"""
Customer Communication Routes
"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from app.models.schemas import (
    CommunicationCreate,
    CommunicationResponse,
    EmailClassification
)
from app.config.database import get_collection
from app.agents import communication_agent
from app.utils.auth import get_current_user
from app.utils.helpers import serialize_doc, serialize_docs, create_response, paginate

router = APIRouter()


@router.post("/incoming", response_model=dict)
async def process_incoming_communication(
    communication: CommunicationCreate,
    current_user: dict = Depends(get_current_user)
):
    """Process incoming customer communication"""
    communications = get_collection("communications")
    
    # Analyze communication using AI
    analysis = await communication_agent.process({
        "action": "full_analysis",
        "subject": communication.subject,
        "message": communication.message,
        "sender": communication.customer_email,
        "customer_name": communication.customer_name
    })
    
    # Extract classification results
    classification = analysis.get("analysis", {}).get("classification", {}).get("classification", {})
    sentiment = analysis.get("analysis", {}).get("sentiment", {}).get("sentiment_analysis", {})
    routing = analysis.get("analysis", {}).get("routing", {}).get("routing", {})
    suggested_response = analysis.get("analysis", {}).get("suggested_response", {})
    
    # Create communication record
    comm_doc = {
        **communication.model_dump(),
        "category": classification.get("category"),
        "priority": classification.get("priority", 3),
        "sentiment": sentiment.get("sentiment"),
        "ai_suggested_response": suggested_response.get("suggested_response") if suggested_response else None,
        "ai_routing": routing,
        "ai_analysis": analysis,
        "status": "new",
        "assigned_to": None,
        "created_by": current_user["user_id"],
        "created_at": datetime.utcnow()
    }
    
    result = await communications.insert_one(comm_doc)
    comm_doc["_id"] = result.inserted_id
    
    return create_response(
        success=True,
        data={
            "communication": serialize_doc(comm_doc),
            "analysis": analysis
        },
        message="Communication processed successfully"
    )


@router.get("/", response_model=dict)
async def list_communications(
    page: int = 1,
    page_size: int = 20,
    category: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """List all communications with filtering"""
    communications = get_collection("communications")
    
    query = {}
    if category:
        query["category"] = category
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    
    cursor = communications.find(query).sort("created_at", -1)
    all_comms = await cursor.to_list(length=1000)
    
    result = paginate(serialize_docs(all_comms), page, page_size)
    
    return create_response(
        success=True,
        data=result
    )


@router.get("/{comm_id}", response_model=dict)
async def get_communication(
    comm_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get communication details"""
    communications = get_collection("communications")
    
    comm = await communications.find_one({"_id": ObjectId(comm_id)})
    if not comm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Communication not found"
        )
    
    return create_response(
        success=True,
        data=serialize_doc(comm)
    )


@router.post("/classify", response_model=dict)
async def classify_email(
    classification: EmailClassification,
    current_user: dict = Depends(get_current_user)
):
    """Classify email content using AI"""
    result = await communication_agent.process({
        "action": "classify",
        "subject": classification.subject,
        "message": classification.email_content
    })
    
    return create_response(
        success=True,
        data=result
    )


@router.post("/generate-response", response_model=dict)
async def generate_response(
    comm_id: str,
    context: Optional[dict] = None,
    current_user: dict = Depends(get_current_user)
):
    """Generate AI response for communication"""
    communications = get_collection("communications")
    
    comm = await communications.find_one({"_id": ObjectId(comm_id)})
    if not comm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Communication not found"
        )
    
    result = await communication_agent.process({
        "action": "generate_response",
        "subject": comm.get("subject", ""),
        "message": comm.get("message", ""),
        "category": comm.get("category", "general_inquiry"),
        "customer_name": comm.get("customer_name", "Valued Customer"),
        "context": context or {}
    })
    
    # Update communication with new response
    await communications.update_one(
        {"_id": ObjectId(comm_id)},
        {
            "$set": {
                "ai_suggested_response": result.get("suggested_response"),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return create_response(
        success=True,
        data=result
    )


@router.put("/{comm_id}/assign", response_model=dict)
async def assign_communication(
    comm_id: str,
    assignee: str,
    current_user: dict = Depends(get_current_user)
):
    """Assign communication to team member"""
    communications = get_collection("communications")
    
    result = await communications.update_one(
        {"_id": ObjectId(comm_id)},
        {
            "$set": {
                "assigned_to": assignee,
                "status": "assigned",
                "assigned_at": datetime.utcnow(),
                "assigned_by": current_user["user_id"]
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Communication not found"
        )
    
    return create_response(
        success=True,
        message=f"Communication assigned to {assignee}"
    )


@router.put("/{comm_id}/status", response_model=dict)
async def update_communication_status(
    comm_id: str,
    new_status: str,
    resolution_notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Update communication status"""
    communications = get_collection("communications")
    
    update_data = {
        "status": new_status,
        "updated_at": datetime.utcnow(),
        "updated_by": current_user["user_id"]
    }
    
    if resolution_notes:
        update_data["resolution_notes"] = resolution_notes
    
    if new_status == "resolved":
        update_data["resolved_at"] = datetime.utcnow()
    
    result = await communications.update_one(
        {"_id": ObjectId(comm_id)},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Communication not found"
        )
    
    return create_response(
        success=True,
        message=f"Status updated to {new_status}"
    )


@router.post("/analyze-sentiment", response_model=dict)
async def analyze_sentiment(
    message: str,
    current_user: dict = Depends(get_current_user)
):
    """Analyze sentiment of message"""
    result = await communication_agent.process({
        "action": "analyze_sentiment",
        "message": message
    })
    
    return create_response(
        success=True,
        data=result
    )


@router.post("/predictive-response", response_model=dict)
async def generate_predictive_response(
    query_type: str,
    shipment_data: Optional[dict] = None,
    current_user: dict = Depends(get_current_user)
):
    """Generate predictive response with ETA and alternatives"""
    result = await communication_agent.generate_predictive_response({
        "query_type": query_type,
        "shipment_data": shipment_data or {}
    })
    
    return create_response(
        success=True,
        data=result
    )


@router.get("/summary/by-category", response_model=dict)
async def get_communications_summary(
    current_user: dict = Depends(get_current_user)
):
    """Get communications summary by category"""
    communications = get_collection("communications")
    
    pipeline = [
        {
            "$group": {
                "_id": "$category",
                "count": {"$sum": 1},
                "avg_priority": {"$avg": "$priority"}
            }
        },
        {"$sort": {"count": -1}}
    ]
    
    results = await communications.aggregate(pipeline).to_list(length=100)
    
    # Get status counts
    status_pipeline = [
        {
            "$group": {
                "_id": "$status",
                "count": {"$sum": 1}
            }
        }
    ]
    status_results = await communications.aggregate(status_pipeline).to_list(length=100)
    
    return create_response(
        success=True,
        data={
            "by_category": results,
            "by_status": {r["_id"]: r["count"] for r in status_results},
            "generated_at": datetime.utcnow().isoformat()
        }
    )
