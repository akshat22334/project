"""
Shipment Tracking Routes
"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from app.models.schemas import (
    ShipmentCreate,
    ShipmentResponse,
    LocationUpdate,
    RouteOptimizationRequest,
    GPSData,
    TemperatureData
)
from app.config.database import get_collection
from app.agents import tracking_agent
from app.utils.auth import get_current_user
from app.utils.helpers import (
    serialize_doc, 
    serialize_docs, 
    create_response, 
    paginate,
    generate_tracking_number
)

router = APIRouter()


@router.post("/shipments", response_model=dict)
async def create_shipment(
    shipment: ShipmentCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new shipment"""
    shipments = get_collection("shipments")
    
    # Generate tracking number if not provided
    tracking_number = shipment.tracking_number or generate_tracking_number()
    
    # Check for duplicate tracking number
    existing = await shipments.find_one({"tracking_number": tracking_number})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tracking number already exists"
        )
    
    # Create shipment document
    shipment_doc = {
        **shipment.model_dump(),
        "tracking_number": tracking_number,
        "status": "created",
        "current_location": None,
        "location_history": [],
        "temperature_readings": [],
        "predicted_eta": shipment.estimated_delivery,
        "delay_probability": 0.0,
        "route_optimization": None,
        "alerts": [],
        "created_by": current_user["user_id"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await shipments.insert_one(shipment_doc)
    shipment_doc["_id"] = result.inserted_id
    
    return create_response(
        success=True,
        data=serialize_doc(shipment_doc),
        message=f"Shipment created with tracking number: {tracking_number}"
    )


@router.get("/shipments", response_model=dict)
async def list_shipments(
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    carrier: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List all shipments with filtering"""
    shipments = get_collection("shipments")
    
    query = {}
    if status:
        query["status"] = status
    if carrier:
        query["carrier"] = carrier
    
    cursor = shipments.find(query).sort("created_at", -1)
    all_shipments = await cursor.to_list(length=1000)
    
    result = paginate(serialize_docs(all_shipments), page, page_size)
    
    return create_response(
        success=True,
        data=result
    )


@router.get("/shipments/{shipment_id}", response_model=dict)
async def get_shipment(
    shipment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get shipment details"""
    shipments = get_collection("shipments")
    
    shipment = await shipments.find_one({"_id": ObjectId(shipment_id)})
    if not shipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipment not found"
        )
    
    return create_response(
        success=True,
        data=serialize_doc(shipment)
    )


@router.get("/track/{tracking_number}", response_model=dict)
async def track_shipment(
    tracking_number: str
):
    """Track shipment by tracking number (public endpoint)"""
    shipments = get_collection("shipments")
    
    shipment = await shipments.find_one({"tracking_number": tracking_number})
    if not shipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipment not found"
        )
    
    # Return limited public information
    public_data = {
        "tracking_number": shipment["tracking_number"],
        "status": shipment["status"],
        "origin": shipment["origin"],
        "destination": shipment["destination"],
        "estimated_delivery": shipment.get("estimated_delivery"),
        "predicted_eta": shipment.get("predicted_eta"),
        "current_location": shipment.get("current_location"),
        "location_history": shipment.get("location_history", [])[-10:],  # Last 10 locations
        "alerts": [a for a in shipment.get("alerts", []) if a.get("public", True)]
    }
    
    return create_response(
        success=True,
        data=public_data
    )


@router.post("/shipments/{shipment_id}/location", response_model=dict)
async def update_shipment_location(
    shipment_id: str,
    location: GPSData,
    temperature: Optional[TemperatureData] = None,
    current_user: dict = Depends(get_current_user)
):
    """Update shipment location (IoT/GPS data)"""
    shipments = get_collection("shipments")
    
    shipment = await shipments.find_one({"_id": ObjectId(shipment_id)})
    if not shipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipment not found"
        )
    
    # Process location update through AI agent
    analysis = await tracking_agent.process({
        "action": "full_tracking_analysis",
        "shipment_data": serialize_doc(shipment),
        "current_location": location.model_dump(),
        "previous_location": shipment.get("current_location"),
        "destination": {"address": shipment.get("destination")},
        "temperature_data": temperature.model_dump() if temperature else None,
        "shipment_type": shipment.get("shipment_type", "ambient")
    })
    
    # Prepare update
    location_data = {**location.model_dump(), "timestamp": datetime.utcnow().isoformat()}
    
    update_data = {
        "current_location": location_data,
        "updated_at": datetime.utcnow()
    }
    
    # Update ETA if predicted
    eta_prediction = analysis.get("tracking_analysis", {}).get("eta_prediction", {})
    if eta_prediction.get("eta_prediction", {}).get("predicted_eta"):
        update_data["predicted_eta"] = eta_prediction["eta_prediction"]["predicted_eta"]
        update_data["delay_probability"] = eta_prediction["eta_prediction"].get("delay_probability", 0)
    
    # Add alerts
    alerts = analysis.get("tracking_analysis", {}).get("alerts", {}).get("alerts", [])
    
    # Update shipment
    await shipments.update_one(
        {"_id": ObjectId(shipment_id)},
        {
            "$set": update_data,
            "$push": {
                "location_history": location_data,
                "alerts": {"$each": alerts}
            }
        }
    )
    
    # Add temperature reading if provided
    if temperature:
        temp_data = {**temperature.model_dump(), "timestamp": datetime.utcnow().isoformat()}
        await shipments.update_one(
            {"_id": ObjectId(shipment_id)},
            {"$push": {"temperature_readings": temp_data}}
        )
    
    return create_response(
        success=True,
        data={
            "location_updated": True,
            "analysis": analysis,
            "alerts_generated": len(alerts)
        },
        message="Location updated successfully"
    )


@router.post("/shipments/{shipment_id}/predict-eta", response_model=dict)
async def predict_eta(
    shipment_id: str,
    traffic_conditions: Optional[str] = "normal",
    weather_conditions: Optional[str] = "clear",
    current_user: dict = Depends(get_current_user)
):
    """Predict ETA using AI"""
    shipments = get_collection("shipments")
    
    shipment = await shipments.find_one({"_id": ObjectId(shipment_id)})
    if not shipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipment not found"
        )
    
    result = await tracking_agent.process({
        "action": "predict_eta",
        "shipment_data": serialize_doc(shipment),
        "current_location": shipment.get("current_location", {}),
        "destination": {"address": shipment.get("destination")},
        "traffic_conditions": traffic_conditions,
        "weather_conditions": weather_conditions
    })
    
    # Update shipment with prediction
    if result.get("eta_prediction", {}).get("predicted_eta"):
        await shipments.update_one(
            {"_id": ObjectId(shipment_id)},
            {
                "$set": {
                    "predicted_eta": result["eta_prediction"]["predicted_eta"],
                    "delay_probability": result["eta_prediction"].get("delay_probability", 0),
                    "updated_at": datetime.utcnow()
                }
            }
        )
    
    return create_response(
        success=True,
        data=result
    )


@router.post("/shipments/{shipment_id}/optimize-route", response_model=dict)
async def optimize_route(
    shipment_id: str,
    waypoints: Optional[List[dict]] = None,
    constraints: Optional[dict] = None,
    current_user: dict = Depends(get_current_user)
):
    """Optimize delivery route using AI"""
    shipments = get_collection("shipments")
    
    shipment = await shipments.find_one({"_id": ObjectId(shipment_id)})
    if not shipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipment not found"
        )
    
    result = await tracking_agent.process({
        "action": "optimize_route",
        "current_location": shipment.get("current_location", {}),
        "destination": {"address": shipment.get("destination")},
        "waypoints": waypoints or [],
        "constraints": constraints or {}
    })
    
    # Update shipment with route optimization
    if result.get("route_optimization"):
        await shipments.update_one(
            {"_id": ObjectId(shipment_id)},
            {
                "$set": {
                    "route_optimization": result["route_optimization"],
                    "updated_at": datetime.utcnow()
                }
            }
        )
    
    return create_response(
        success=True,
        data=result
    )


@router.put("/shipments/{shipment_id}/status", response_model=dict)
async def update_shipment_status(
    shipment_id: str,
    new_status: str,
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Update shipment status"""
    shipments = get_collection("shipments")
    
    valid_statuses = ["created", "picked_up", "in_transit", "out_for_delivery", "delivered", "delayed", "exception"]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {valid_statuses}"
        )
    
    update_data = {
        "status": new_status,
        "updated_at": datetime.utcnow(),
        "status_updated_by": current_user["user_id"]
    }
    
    if new_status == "delivered":
        update_data["delivered_at"] = datetime.utcnow()
    
    result = await shipments.update_one(
        {"_id": ObjectId(shipment_id)},
        {
            "$set": update_data,
            "$push": {
                "status_history": {
                    "status": new_status,
                    "notes": notes,
                    "timestamp": datetime.utcnow().isoformat(),
                    "updated_by": current_user["user_id"]
                }
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipment not found"
        )
    
    return create_response(
        success=True,
        message=f"Shipment status updated to {new_status}"
    )


@router.get("/shipments/{shipment_id}/alerts", response_model=dict)
async def get_shipment_alerts(
    shipment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all alerts for a shipment"""
    shipments = get_collection("shipments")
    
    shipment = await shipments.find_one({"_id": ObjectId(shipment_id)})
    if not shipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipment not found"
        )
    
    return create_response(
        success=True,
        data={
            "shipment_id": shipment_id,
            "tracking_number": shipment.get("tracking_number"),
            "alerts": shipment.get("alerts", []),
            "total_alerts": len(shipment.get("alerts", []))
        }
    )


@router.get("/dashboard/active", response_model=dict)
async def get_active_shipments_dashboard(
    current_user: dict = Depends(get_current_user)
):
    """Get dashboard data for active shipments"""
    shipments = get_collection("shipments")
    
    # Get active shipments (not delivered)
    active_statuses = ["created", "picked_up", "in_transit", "out_for_delivery", "delayed"]
    
    pipeline = [
        {"$match": {"status": {"$in": active_statuses}}},
        {
            "$group": {
                "_id": "$status",
                "count": {"$sum": 1},
                "avg_delay_probability": {"$avg": "$delay_probability"}
            }
        }
    ]
    
    status_summary = await shipments.aggregate(pipeline).to_list(length=100)
    
    # Get shipments with high delay probability
    high_risk = await shipments.find(
        {"status": {"$in": active_statuses}, "delay_probability": {"$gt": 0.5}}
    ).to_list(length=10)
    
    # Get recent alerts
    recent_alerts_pipeline = [
        {"$match": {"status": {"$in": active_statuses}}},
        {"$unwind": "$alerts"},
        {"$sort": {"alerts.created_at": -1}},
        {"$limit": 20},
        {"$project": {
            "tracking_number": 1,
            "alert": "$alerts"
        }}
    ]
    recent_alerts = await shipments.aggregate(recent_alerts_pipeline).to_list(length=20)
    
    return create_response(
        success=True,
        data={
            "status_summary": {s["_id"]: s for s in status_summary},
            "total_active": sum(s["count"] for s in status_summary),
            "high_risk_shipments": serialize_docs(high_risk),
            "recent_alerts": recent_alerts,
            "generated_at": datetime.utcnow().isoformat()
        }
    )
