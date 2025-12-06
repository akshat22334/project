"""
Proof of Delivery (POD) Routes
"""

from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import base64

from app.models.schemas import (
    PODCreate,
    PODResponse,
    PODValidation,
    DisputeCreate,
    GPSData
)
from app.config.database import get_collection
from app.agents import pod_agent
from app.utils.auth import get_current_user
from app.utils.helpers import serialize_doc, serialize_docs, create_response, paginate

router = APIRouter()


@router.post("/capture", response_model=dict)
async def capture_pod(
    pod: PODCreate,
    current_user: dict = Depends(get_current_user)
):
    """Capture proof of delivery"""
    pods = get_collection("pod_records")
    shipments = get_collection("shipments")
    
    # Verify shipment exists
    shipment = await shipments.find_one({"_id": ObjectId(pod.shipment_id)})
    if not shipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipment not found"
        )
    
    # Process POD through AI agent
    pod_data = pod.model_dump()
    if pod.gps_location:
        pod_data["gps_location"] = pod.gps_location.model_dump()
    
    result = await pod_agent.process({
        "action": "capture_pod",
        **pod_data
    })
    
    # Create POD record
    pod_doc = {
        **pod_data,
        "status": "captured" if result.get("validation_passed") else "incomplete",
        "initial_validation": result.get("pod_record", {}).get("initial_validation", {}),
        "validation_score": 0.0,
        "billing_synced": False,
        "created_by": current_user["user_id"],
        "created_at": datetime.utcnow()
    }
    
    db_result = await pods.insert_one(pod_doc)
    pod_doc["_id"] = db_result.inserted_id
    
    return create_response(
        success=True,
        data={
            "pod": serialize_doc(pod_doc),
            "capture_result": result
        },
        message="POD captured successfully"
    )


@router.post("/capture-with-files", response_model=dict)
async def capture_pod_with_files(
    shipment_id: str = Form(...),
    recipient_name: str = Form(...),
    notes: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    signature: Optional[UploadFile] = File(None),
    photo: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    """Capture POD with file uploads"""
    pods = get_collection("pod_records")
    shipments = get_collection("shipments")
    
    # Verify shipment exists
    shipment = await shipments.find_one({"_id": ObjectId(shipment_id)})
    if not shipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipment not found"
        )
    
    # Process uploaded files
    signature_base64 = None
    photo_base64 = None
    
    if signature:
        signature_content = await signature.read()
        signature_base64 = base64.b64encode(signature_content).decode()
    
    if photo:
        photo_content = await photo.read()
        photo_base64 = base64.b64encode(photo_content).decode()
    
    # Prepare GPS data
    gps_data = None
    if latitude and longitude:
        gps_data = {
            "latitude": latitude,
            "longitude": longitude,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    # Process through AI agent
    result = await pod_agent.process({
        "action": "capture_pod",
        "shipment_id": shipment_id,
        "recipient_name": recipient_name,
        "signature_image": signature_base64,
        "photo_evidence": photo_base64,
        "gps_location": gps_data,
        "notes": notes
    })
    
    # Create POD record
    pod_doc = {
        "shipment_id": shipment_id,
        "recipient_name": recipient_name,
        "signature_image": signature_base64,
        "photo_evidence": photo_base64,
        "gps_location": gps_data,
        "notes": notes,
        "status": "captured" if result.get("validation_passed") else "incomplete",
        "delivery_timestamp": datetime.utcnow(),
        "initial_validation": result.get("pod_record", {}).get("initial_validation", {}),
        "validation_score": 0.0,
        "billing_synced": False,
        "created_by": current_user["user_id"],
        "created_at": datetime.utcnow()
    }
    
    db_result = await pods.insert_one(pod_doc)
    pod_doc["_id"] = db_result.inserted_id
    
    # Update shipment status
    await shipments.update_one(
        {"_id": ObjectId(shipment_id)},
        {
            "$set": {
                "status": "delivered",
                "delivered_at": datetime.utcnow(),
                "pod_id": str(db_result.inserted_id)
            }
        }
    )
    
    return create_response(
        success=True,
        data={
            "pod": serialize_doc(pod_doc),
            "capture_result": result
        },
        message="POD captured successfully"
    )


@router.get("/", response_model=dict)
async def list_pods(
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    shipment_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List all POD records"""
    pods = get_collection("pod_records")
    
    query = {}
    if status:
        query["status"] = status
    if shipment_id:
        query["shipment_id"] = shipment_id
    
    cursor = pods.find(query).sort("created_at", -1)
    all_pods = await cursor.to_list(length=1000)
    
    result = paginate(serialize_docs(all_pods), page, page_size)
    
    return create_response(
        success=True,
        data=result
    )


@router.get("/{pod_id}", response_model=dict)
async def get_pod(
    pod_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get POD details"""
    pods = get_collection("pod_records")
    
    pod = await pods.find_one({"_id": ObjectId(pod_id)})
    if not pod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="POD not found"
        )
    
    return create_response(
        success=True,
        data=serialize_doc(pod)
    )


@router.post("/{pod_id}/validate", response_model=dict)
async def validate_pod(
    pod_id: str,
    expected_delivery: Optional[dict] = None,
    current_user: dict = Depends(get_current_user)
):
    """Validate POD using AI"""
    pods = get_collection("pod_records")
    shipments = get_collection("shipments")
    
    pod = await pods.find_one({"_id": ObjectId(pod_id)})
    if not pod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="POD not found"
        )
    
    # Get shipment data
    shipment = await shipments.find_one({"_id": ObjectId(pod["shipment_id"])})
    
    # Validate through AI agent
    result = await pod_agent.process({
        "action": "validate_pod",
        "pod_data": serialize_doc(pod),
        "shipment_data": serialize_doc(shipment) if shipment else {},
        "expected_delivery": expected_delivery or {}
    })
    
    # Update POD with validation results
    await pods.update_one(
        {"_id": ObjectId(pod_id)},
        {
            "$set": {
                "status": result.get("validation_status", "pending"),
                "ai_validation": result,
                "validation_score": result.get("overall_score", 0),
                "validated_at": datetime.utcnow(),
                "validated_by": current_user["user_id"]
            }
        }
    )
    
    return create_response(
        success=True,
        data=result,
        message="POD validation completed"
    )


@router.post("/{pod_id}/analyze-photo", response_model=dict)
async def analyze_pod_photo(
    pod_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Analyze POD photo using AI vision"""
    pods = get_collection("pod_records")
    
    pod = await pods.find_one({"_id": ObjectId(pod_id)})
    if not pod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="POD not found"
        )
    
    if not pod.get("photo_evidence"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No photo evidence available"
        )
    
    result = await pod_agent.process({
        "action": "analyze_photo",
        "photo_evidence": pod["photo_evidence"],
        "shipment_info": {
            "shipment_id": pod["shipment_id"],
            "recipient": pod["recipient_name"]
        }
    })
    
    # Update POD with photo analysis
    if result.get("success"):
        await pods.update_one(
            {"_id": ObjectId(pod_id)},
            {
                "$set": {
                    "photo_analysis": result.get("photo_analysis"),
                    "updated_at": datetime.utcnow()
                }
            }
        )
    
    return create_response(
        success=True,
        data=result
    )


@router.post("/disputes", response_model=dict)
async def create_dispute(
    dispute: DisputeCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a delivery dispute"""
    pods = get_collection("pod_records")
    disputes = get_collection("disputes")
    shipments = get_collection("shipments")
    
    pod = await pods.find_one({"_id": ObjectId(dispute.pod_id)})
    if not pod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="POD not found"
        )
    
    shipment = await shipments.find_one({"_id": ObjectId(pod["shipment_id"])})
    
    # Create dispute record
    dispute_doc = {
        "pod_id": dispute.pod_id,
        "shipment_id": pod["shipment_id"],
        "reason": dispute.reason,
        "description": dispute.description,
        "status": "open",
        "created_by": current_user["user_id"],
        "created_at": datetime.utcnow()
    }
    
    result = await disputes.insert_one(dispute_doc)
    dispute_doc["_id"] = result.inserted_id
    
    # Update POD status
    await pods.update_one(
        {"_id": ObjectId(dispute.pod_id)},
        {
            "$set": {
                "status": "disputed",
                "dispute_info": {
                    "dispute_id": str(result.inserted_id),
                    "reason": dispute.reason,
                    "created_at": datetime.utcnow().isoformat()
                }
            }
        }
    )
    
    return create_response(
        success=True,
        data=serialize_doc(dispute_doc),
        message="Dispute created successfully"
    )


@router.post("/disputes/{dispute_id}/resolve", response_model=dict)
async def resolve_dispute(
    dispute_id: str,
    customer_claim: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Resolve dispute using AI"""
    disputes = get_collection("disputes")
    pods = get_collection("pod_records")
    shipments = get_collection("shipments")
    
    dispute = await disputes.find_one({"_id": ObjectId(dispute_id)})
    if not dispute:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dispute not found"
        )
    
    pod = await pods.find_one({"_id": ObjectId(dispute["pod_id"])})
    shipment = await shipments.find_one({"_id": ObjectId(dispute["shipment_id"])})
    
    # Resolve through AI agent
    result = await pod_agent.process({
        "action": "resolve_dispute",
        "dispute_data": serialize_doc(dispute),
        "pod_data": serialize_doc(pod) if pod else {},
        "shipment_data": serialize_doc(shipment) if shipment else {},
        "customer_claim": customer_claim or dispute.get("description", "")
    })
    
    # Update dispute with resolution
    await disputes.update_one(
        {"_id": ObjectId(dispute_id)},
        {
            "$set": {
                "status": "resolved",
                "ai_resolution": result.get("dispute_resolution"),
                "resolved_at": datetime.utcnow(),
                "resolved_by": current_user["user_id"]
            }
        }
    )
    
    # Update POD status
    if pod:
        new_status = "resolved" if result.get("dispute_resolution", {}).get("dispute_valid") else "validated"
        await pods.update_one(
            {"_id": ObjectId(dispute["pod_id"])},
            {"$set": {"status": new_status}}
        )
    
    return create_response(
        success=True,
        data=result,
        message="Dispute resolved"
    )


@router.post("/{pod_id}/sync-billing", response_model=dict)
async def sync_pod_with_billing(
    pod_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Sync validated POD with billing system"""
    pods = get_collection("pod_records")
    shipments = get_collection("shipments")
    
    pod = await pods.find_one({"_id": ObjectId(pod_id)})
    if not pod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="POD not found"
        )
    
    if pod.get("status") != "validated":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="POD must be validated before syncing with billing"
        )
    
    shipment = await shipments.find_one({"_id": ObjectId(pod["shipment_id"])})
    
    # Sync through AI agent
    result = await pod_agent.process({
        "action": "sync_billing",
        "pod_data": serialize_doc(pod),
        "shipment_data": serialize_doc(shipment) if shipment else {},
        "validation_status": pod.get("status")
    })
    
    # Update POD
    await pods.update_one(
        {"_id": ObjectId(pod_id)},
        {
            "$set": {
                "billing_synced": True,
                "billing_sync_data": result.get("billing_sync"),
                "synced_at": datetime.utcnow()
            }
        }
    )
    
    return create_response(
        success=True,
        data=result,
        message="POD synced with billing"
    )


@router.get("/summary/stats", response_model=dict)
async def get_pod_stats(
    current_user: dict = Depends(get_current_user)
):
    """Get POD statistics summary"""
    pods = get_collection("pod_records")
    disputes = get_collection("disputes")
    
    # POD status summary
    pod_pipeline = [
        {
            "$group": {
                "_id": "$status",
                "count": {"$sum": 1},
                "avg_score": {"$avg": "$validation_score"}
            }
        }
    ]
    pod_stats = await pods.aggregate(pod_pipeline).to_list(length=100)
    
    # Dispute summary
    dispute_pipeline = [
        {
            "$group": {
                "_id": "$status",
                "count": {"$sum": 1}
            }
        }
    ]
    dispute_stats = await disputes.aggregate(dispute_pipeline).to_list(length=100)
    
    # Calculate metrics
    total_pods = sum(s["count"] for s in pod_stats)
    validated_pods = next((s["count"] for s in pod_stats if s["_id"] == "validated"), 0)
    validation_rate = (validated_pods / total_pods * 100) if total_pods > 0 else 0
    
    return create_response(
        success=True,
        data={
            "pod_by_status": {s["_id"]: s for s in pod_stats},
            "dispute_by_status": {s["_id"]: s["count"] for s in dispute_stats},
            "total_pods": total_pods,
            "validation_rate": round(validation_rate, 2),
            "generated_at": datetime.utcnow().isoformat()
        }
    )
