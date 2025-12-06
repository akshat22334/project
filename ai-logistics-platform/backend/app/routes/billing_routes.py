"""
Billing & Reconciliation Routes
"""

from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
import base64

from app.models.schemas import (
    InvoiceCreate,
    InvoiceResponse,
    OCRRequest,
    ReconciliationRequest
)
from app.config.database import get_collection
from app.agents import billing_agent
from app.utils.auth import get_current_user
from app.utils.helpers import (
    serialize_doc, 
    serialize_docs, 
    create_response, 
    paginate,
    generate_invoice_number
)

router = APIRouter()


@router.post("/invoices", response_model=dict)
async def create_invoice(
    invoice: InvoiceCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new invoice"""
    invoices = get_collection("invoices")
    
    # Check for duplicate
    existing = await invoices.find_one({"invoice_number": invoice.invoice_number})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invoice number already exists"
        )
    
    # Create invoice document
    invoice_doc = {
        **invoice.model_dump(),
        "status": "pending",
        "ocr_extracted_data": None,
        "ai_validation": None,
        "matched_delivery_records": [],
        "exceptions": [],
        "auto_approved": False,
        "created_by": current_user["user_id"],
        "created_at": datetime.utcnow()
    }
    
    result = await invoices.insert_one(invoice_doc)
    invoice_doc["_id"] = result.inserted_id
    
    return create_response(
        success=True,
        data=serialize_doc(invoice_doc),
        message="Invoice created successfully"
    )


@router.post("/invoices/upload", response_model=dict)
async def upload_invoice(
    file: UploadFile = File(...),
    vendor_name: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Upload and process invoice using OCR"""
    invoices = get_collection("invoices")
    
    # Read file content
    content = await file.read()
    content_base64 = base64.b64encode(content).decode()
    
    # Extract data using AI OCR
    extraction_result = await billing_agent.process({
        "action": "extract_ocr",
        "document_content": content_base64,
        "document_type": "invoice"
    })
    
    extracted_data = extraction_result.get("extracted_data", {})
    
    # Create invoice from extracted data
    invoice_number = extracted_data.get("invoice_number") or generate_invoice_number()
    
    # Check for duplicate
    existing = await invoices.find_one({"invoice_number": invoice_number})
    is_duplicate = existing is not None
    
    invoice_doc = {
        "invoice_number": invoice_number,
        "vendor_name": vendor_name or extracted_data.get("vendor_name", "Unknown"),
        "vendor_email": extracted_data.get("vendor_contact", {}).get("email"),
        "vendor_address": extracted_data.get("vendor_address"),
        "line_items": extracted_data.get("line_items", []),
        "subtotal": extracted_data.get("subtotal", 0),
        "tax": extracted_data.get("tax_amount", 0),
        "total": extracted_data.get("total_amount", 0),
        "due_date": extracted_data.get("due_date"),
        "status": "pending",
        "ocr_extracted_data": extracted_data,
        "original_document": content_base64,
        "file_name": file.filename,
        "is_potential_duplicate": is_duplicate,
        "duplicate_of": str(existing["_id"]) if existing else None,
        "created_by": current_user["user_id"],
        "created_at": datetime.utcnow()
    }
    
    result = await invoices.insert_one(invoice_doc)
    invoice_doc["_id"] = result.inserted_id
    
    return create_response(
        success=True,
        data={
            "invoice": serialize_doc(invoice_doc),
            "extraction": extraction_result,
            "is_duplicate": is_duplicate
        },
        message="Invoice uploaded and processed"
    )


@router.get("/invoices", response_model=dict)
async def list_invoices(
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    vendor: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List all invoices"""
    invoices = get_collection("invoices")
    
    query = {}
    if status:
        query["status"] = status
    if vendor:
        query["vendor_name"] = {"$regex": vendor, "$options": "i"}
    
    cursor = invoices.find(query).sort("created_at", -1)
    all_invoices = await cursor.to_list(length=1000)
    
    result = paginate(serialize_docs(all_invoices), page, page_size)
    
    return create_response(
        success=True,
        data=result
    )


@router.get("/invoices/{invoice_id}", response_model=dict)
async def get_invoice(
    invoice_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get invoice details"""
    invoices = get_collection("invoices")
    
    invoice = await invoices.find_one({"_id": ObjectId(invoice_id)})
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    return create_response(
        success=True,
        data=serialize_doc(invoice)
    )


@router.post("/invoices/{invoice_id}/reconcile", response_model=dict)
async def reconcile_invoice(
    invoice_id: str,
    delivery_record_ids: Optional[List[str]] = None,
    current_user: dict = Depends(get_current_user)
):
    """Reconcile invoice against delivery records"""
    invoices = get_collection("invoices")
    pods = get_collection("pod_records")
    shipments = get_collection("shipments")
    
    invoice = await invoices.find_one({"_id": ObjectId(invoice_id)})
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    # Get delivery records
    delivery_records = []
    if delivery_record_ids:
        for record_id in delivery_record_ids:
            pod = await pods.find_one({"_id": ObjectId(record_id)})
            if pod:
                delivery_records.append(serialize_doc(pod))
    else:
        # Try to auto-match based on reference numbers
        refs = invoice.get("ocr_extracted_data", {}).get("reference_numbers", {})
        if refs.get("shipment_id"):
            shipment = await shipments.find_one({"_id": ObjectId(refs["shipment_id"])})
            if shipment:
                pod = await pods.find_one({"shipment_id": refs["shipment_id"]})
                if pod:
                    delivery_records.append(serialize_doc(pod))
    
    # Reconcile through AI agent
    result = await billing_agent.process({
        "action": "reconcile",
        "invoice_data": serialize_doc(invoice),
        "delivery_records": delivery_records,
        "po_data": {}
    })
    
    # Update invoice with reconciliation results
    await invoices.update_one(
        {"_id": ObjectId(invoice_id)},
        {
            "$set": {
                "ai_validation": result,
                "matched_delivery_records": [r.get("_id") for r in delivery_records],
                "reconciled_at": datetime.utcnow(),
                "reconciled_by": current_user["user_id"]
            }
        }
    )
    
    return create_response(
        success=True,
        data=result,
        message="Invoice reconciliation completed"
    )


@router.post("/invoices/{invoice_id}/auto-approve", response_model=dict)
async def check_auto_approval(
    invoice_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Check if invoice qualifies for auto-approval"""
    invoices = get_collection("invoices")
    pods = get_collection("pod_records")
    
    invoice = await invoices.find_one({"_id": ObjectId(invoice_id)})
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    # Get POD status for matched records
    pod_validated = False
    if invoice.get("matched_delivery_records"):
        for pod_id in invoice["matched_delivery_records"]:
            pod = await pods.find_one({"_id": ObjectId(pod_id)})
            if pod and pod.get("status") == "validated":
                pod_validated = True
                break
    
    # Check auto-approval through AI agent
    result = await billing_agent.process({
        "action": "auto_approve",
        "invoice_data": serialize_doc(invoice),
        "reconciliation": invoice.get("ai_validation", {}).get("reconciliation", {}),
        "pod_status": {"validated": pod_validated}
    })
    
    # Update invoice if auto-approved
    if result.get("auto_approved"):
        await invoices.update_one(
            {"_id": ObjectId(invoice_id)},
            {
                "$set": {
                    "status": "approved",
                    "auto_approved": True,
                    "approved_at": datetime.utcnow(),
                    "approval_checks": result.get("approval_checks")
                }
            }
        )
    
    return create_response(
        success=True,
        data=result,
        message="Auto-approved" if result.get("auto_approved") else "Manual review required"
    )


@router.put("/invoices/{invoice_id}/status", response_model=dict)
async def update_invoice_status(
    invoice_id: str,
    new_status: str,
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Update invoice status"""
    invoices = get_collection("invoices")
    
    valid_statuses = ["draft", "pending", "approved", "disputed", "paid", "overdue"]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {valid_statuses}"
        )
    
    update_data = {
        "status": new_status,
        "updated_at": datetime.utcnow(),
        "updated_by": current_user["user_id"]
    }
    
    if new_status == "paid":
        update_data["payment_date"] = datetime.utcnow()
    if new_status == "approved":
        update_data["approved_at"] = datetime.utcnow()
    if notes:
        update_data["status_notes"] = notes
    
    result = await invoices.update_one(
        {"_id": ObjectId(invoice_id)},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    return create_response(
        success=True,
        message=f"Invoice status updated to {new_status}"
    )


@router.post("/detect-exceptions", response_model=dict)
async def detect_billing_exceptions(
    invoice_ids: Optional[List[str]] = None,
    current_user: dict = Depends(get_current_user)
):
    """Detect exceptions in invoices"""
    invoices_collection = get_collection("invoices")
    pods = get_collection("pod_records")
    
    # Get invoices to check
    query = {"status": {"$in": ["pending", "draft"]}}
    if invoice_ids:
        query["_id"] = {"$in": [ObjectId(id) for id in invoice_ids]}
    
    invoices = await invoices_collection.find(query).to_list(length=100)
    
    # Enrich with POD status
    enriched_invoices = []
    for inv in invoices:
        inv_data = serialize_doc(inv)
        
        # Check POD validation
        if inv.get("matched_delivery_records"):
            for pod_id in inv["matched_delivery_records"]:
                pod = await pods.find_one({"_id": ObjectId(pod_id)})
                if pod:
                    inv_data["pod_validated"] = pod.get("status") == "validated"
                    break
        else:
            inv_data["pod_validated"] = False
        
        enriched_invoices.append(inv_data)
    
    # Detect exceptions through AI agent
    result = await billing_agent.process({
        "action": "detect_exceptions",
        "invoices": enriched_invoices
    })
    
    # Update invoices with exceptions
    for exception in result.get("exception_details", []):
        invoice_number = exception.get("invoice_number")
        if invoice_number:
            await invoices_collection.update_one(
                {"invoice_number": invoice_number},
                {"$set": {"exceptions": exception.get("exceptions", [])}}
            )
    
    return create_response(
        success=True,
        data=result
    )


@router.post("/cashflow-prediction", response_model=dict)
async def predict_cash_flow(
    forecast_days: int = 30,
    current_user: dict = Depends(get_current_user)
):
    """Predict cash flow using AI"""
    invoices = get_collection("invoices")
    
    # Get pending invoices
    pending = await invoices.find(
        {"status": {"$in": ["pending", "approved"]}}
    ).to_list(length=100)
    
    # Get historical payments (last 90 days)
    ninety_days_ago = datetime.utcnow() - timedelta(days=90)
    paid = await invoices.find({
        "status": "paid",
        "payment_date": {"$gte": ninety_days_ago}
    }).to_list(length=100)
    
    # Predict through AI agent
    result = await billing_agent.process({
        "action": "predict_cashflow",
        "pending_invoices": serialize_docs(pending),
        "historical_payments": serialize_docs(paid),
        "forecast_days": forecast_days
    })
    
    return create_response(
        success=True,
        data=result
    )


@router.post("/financial-report", response_model=dict)
async def generate_financial_report(
    period_start: str,
    period_end: str,
    current_user: dict = Depends(get_current_user)
):
    """Generate financial report"""
    invoices = get_collection("invoices")
    
    try:
        start_date = datetime.fromisoformat(period_start)
        end_date = datetime.fromisoformat(period_end)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use ISO format (YYYY-MM-DD)"
        )
    
    # Get invoices in period
    period_invoices = await invoices.find({
        "created_at": {"$gte": start_date, "$lte": end_date}
    }).to_list(length=1000)
    
    # Get payments in period
    payments = await invoices.find({
        "status": "paid",
        "payment_date": {"$gte": start_date, "$lte": end_date}
    }).to_list(length=1000)
    
    # Generate report through AI agent
    result = await billing_agent.process({
        "action": "generate_report",
        "period_start": period_start,
        "period_end": period_end,
        "invoices": serialize_docs(period_invoices),
        "payments": [{"amount": p.get("total", 0)} for p in payments]
    })
    
    return create_response(
        success=True,
        data=result
    )


@router.get("/dashboard/summary", response_model=dict)
async def get_billing_dashboard(
    current_user: dict = Depends(get_current_user)
):
    """Get billing dashboard summary"""
    invoices = get_collection("invoices")
    
    # Status summary
    status_pipeline = [
        {
            "$group": {
                "_id": "$status",
                "count": {"$sum": 1},
                "total_amount": {"$sum": "$total"}
            }
        }
    ]
    status_summary = await invoices.aggregate(status_pipeline).to_list(length=100)
    
    # Overdue invoices
    today = datetime.utcnow()
    overdue = await invoices.count_documents({
        "status": {"$in": ["pending", "approved"]},
        "due_date": {"$lt": today}
    })
    
    # This month stats
    month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_invoices = await invoices.find({
        "created_at": {"$gte": month_start}
    }).to_list(length=1000)
    
    month_total = sum(inv.get("total", 0) for inv in month_invoices)
    month_paid = sum(
        inv.get("total", 0) for inv in month_invoices 
        if inv.get("status") == "paid"
    )
    
    return create_response(
        success=True,
        data={
            "by_status": {s["_id"]: s for s in status_summary},
            "overdue_count": overdue,
            "this_month": {
                "total_invoiced": month_total,
                "total_collected": month_paid,
                "collection_rate": (month_paid / month_total * 100) if month_total else 0
            },
            "generated_at": datetime.utcnow().isoformat()
        }
    )
