"""
Partner Onboarding & Compliance Routes
"""

from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import base64

from app.models.schemas import (
    PartnerCreate,
    PartnerResponse,
    DocumentExtraction,
    ComplianceCheck
)
from app.config.database import get_collection
from app.agents import onboarding_agent
from app.utils.auth import get_current_user
from app.utils.helpers import serialize_doc, serialize_docs, create_response, paginate

router = APIRouter()


@router.post("/partners", response_model=dict)
async def create_partner(
    partner: PartnerCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new partner for onboarding"""
    partners = get_collection("partners")
    
    # Check if partner already exists
    existing = await partners.find_one({"email": partner.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Partner with this email already exists"
        )
    
    # Create partner document
    partner_doc = {
        **partner.model_dump(),
        "compliance_status": "pending",
        "compliance_score": 0.0,
        "certifications": [],
        "ai_analysis": None,
        "created_by": current_user["user_id"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await partners.insert_one(partner_doc)
    partner_doc["_id"] = result.inserted_id
    
    return create_response(
        success=True,
        data=serialize_doc(partner_doc),
        message="Partner created successfully"
    )


@router.get("/partners", response_model=dict)
async def list_partners(
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List all partners with pagination"""
    partners = get_collection("partners")
    
    query = {}
    if status:
        query["compliance_status"] = status
    
    cursor = partners.find(query).sort("created_at", -1)
    all_partners = await cursor.to_list(length=1000)
    
    result = paginate(serialize_docs(all_partners), page, page_size)
    
    return create_response(
        success=True,
        data=result
    )


@router.get("/partners/{partner_id}", response_model=dict)
async def get_partner(
    partner_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get partner details"""
    partners = get_collection("partners")
    
    partner = await partners.find_one({"_id": ObjectId(partner_id)})
    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Partner not found"
        )
    
    return create_response(
        success=True,
        data=serialize_doc(partner)
    )


@router.post("/partners/{partner_id}/documents", response_model=dict)
async def upload_document(
    partner_id: str,
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload a document for partner compliance"""
    partners = get_collection("partners")
    
    # Verify partner exists
    partner = await partners.find_one({"_id": ObjectId(partner_id)})
    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Partner not found"
        )
    
    # Read file content
    content = await file.read()
    content_base64 = base64.b64encode(content).decode()
    
    # Extract document data using AI
    extraction_result = await onboarding_agent.process({
        "action": "extract_document",
        "document_content": content_base64,
        "document_type": document_type
    })
    
    # Create document record
    document = {
        "document_type": document_type,
        "file_name": file.filename,
        "file_content": content_base64,
        "extracted_data": extraction_result.get("extracted_data", {}),
        "validation_status": "pending",
        "uploaded_at": datetime.utcnow()
    }
    
    # Add document to partner
    await partners.update_one(
        {"_id": ObjectId(partner_id)},
        {
            "$push": {"documents": document},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    return create_response(
        success=True,
        data={
            "document": document,
            "extraction": extraction_result
        },
        message="Document uploaded and processed successfully"
    )


@router.post("/partners/{partner_id}/validate", response_model=dict)
async def validate_compliance(
    partner_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Validate partner compliance"""
    partners = get_collection("partners")
    
    partner = await partners.find_one({"_id": ObjectId(partner_id)})
    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Partner not found"
        )
    
    # Run AI compliance validation
    validation_result = await onboarding_agent.process({
        "action": "validate_compliance",
        "partner_data": serialize_doc(partner),
        "documents": partner.get("documents", [])
    })
    
    # Update partner with validation results
    await partners.update_one(
        {"_id": ObjectId(partner_id)},
        {
            "$set": {
                "compliance_status": validation_result.get("compliance_status", "pending"),
                "compliance_score": validation_result.get("compliance_score", 0),
                "ai_analysis": validation_result,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return create_response(
        success=True,
        data=validation_result,
        message="Compliance validation completed"
    )


@router.post("/partners/{partner_id}/onboarding-status", response_model=dict)
async def get_onboarding_status(
    partner_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get comprehensive onboarding status"""
    partners = get_collection("partners")
    
    partner = await partners.find_one({"_id": ObjectId(partner_id)})
    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Partner not found"
        )
    
    # Generate onboarding status using AI
    status_result = await onboarding_agent.process({
        "action": "generate_onboarding_status",
        "partner_id": partner_id,
        "partner_data": serialize_doc(partner),
        "documents": partner.get("documents", [])
    })
    
    return create_response(
        success=True,
        data=status_result
    )


@router.post("/extract-document", response_model=dict)
async def extract_document_data(
    extraction: DocumentExtraction,
    current_user: dict = Depends(get_current_user)
):
    """Extract data from document content using AI"""
    result = await onboarding_agent.process({
        "action": "extract_document",
        "document_content": extraction.document_content,
        "document_type": extraction.document_type
    })
    
    return create_response(
        success=True,
        data=result
    )


@router.post("/analyze-contract", response_model=dict)
async def analyze_contract(
    contract_content: str,
    current_user: dict = Depends(get_current_user)
):
    """Analyze contract terms and conditions"""
    result = await onboarding_agent.process({
        "action": "analyze_contract",
        "contract_content": contract_content
    })
    
    return create_response(
        success=True,
        data=result
    )


@router.post("/partners/{partner_id}/certifications", response_model=dict)
async def add_certification(
    partner_id: str,
    certification: dict,
    current_user: dict = Depends(get_current_user)
):
    """Add certification to partner"""
    partners = get_collection("partners")
    
    partner = await partners.find_one({"_id": ObjectId(partner_id)})
    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Partner not found"
        )
    
    # Validate certification using AI
    validation = await onboarding_agent.process({
        "action": "check_certifications",
        "certifications": [certification]
    })
    
    certification["validation"] = validation.get("validation_results", [{}])[0]
    certification["added_at"] = datetime.utcnow().isoformat()
    
    # Add certification to partner
    await partners.update_one(
        {"_id": ObjectId(partner_id)},
        {
            "$push": {"certifications": certification},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    return create_response(
        success=True,
        data={
            "certification": certification,
            "validation": validation
        },
        message="Certification added and validated"
    )


@router.get("/compliance-summary", response_model=dict)
async def get_compliance_summary(
    current_user: dict = Depends(get_current_user)
):
    """Get overall compliance summary"""
    partners = get_collection("partners")
    
    pipeline = [
        {
            "$group": {
                "_id": "$compliance_status",
                "count": {"$sum": 1},
                "avg_score": {"$avg": "$compliance_score"}
            }
        }
    ]
    
    results = await partners.aggregate(pipeline).to_list(length=100)
    
    summary = {
        "by_status": {r["_id"]: {"count": r["count"], "avg_score": r.get("avg_score", 0)} for r in results},
        "total_partners": sum(r["count"] for r in results),
        "generated_at": datetime.utcnow().isoformat()
    }
    
    return create_response(
        success=True,
        data=summary
    )
