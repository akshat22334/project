"""
Pydantic Models for AI Logistics Platform
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from bson import ObjectId

# Custom ObjectId type for Pydantic
class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, values=None):
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str) and ObjectId.is_valid(v):
            return v
        raise ValueError("Invalid ObjectId")

# ============== ENUMS ==============

class ComplianceStatus(str, Enum):
    PENDING = "pending"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"

class CommunicationCategory(str, Enum):
    RATE_REQUEST = "rate_request"
    SHIPMENT_STATUS = "shipment_status"
    COMPLAINT = "complaint"
    GENERAL_INQUIRY = "general_inquiry"
    BILLING_QUERY = "billing_query"
    URGENT = "urgent"

class ShipmentStatus(str, Enum):
    CREATED = "created"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    DELAYED = "delayed"
    EXCEPTION = "exception"

class PODStatus(str, Enum):
    PENDING = "pending"
    CAPTURED = "captured"
    VALIDATED = "validated"
    DISPUTED = "disputed"
    RESOLVED = "resolved"

class InvoiceStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    DISPUTED = "disputed"
    PAID = "paid"
    OVERDUE = "overdue"

# ============== USER MODELS ==============

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "user"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: Optional[str] = Field(None, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# ============== PARTNER ONBOARDING MODELS ==============

class PartnerDocument(BaseModel):
    document_type: str
    file_name: str
    file_url: Optional[str] = None
    file_content: Optional[str] = None
    extracted_data: Optional[Dict[str, Any]] = None
    validation_status: str = "pending"
    validation_errors: List[str] = []
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

class PartnerBase(BaseModel):
    company_name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    business_type: Optional[str] = None

class PartnerCreate(PartnerBase):
    documents: List[PartnerDocument] = []

class PartnerResponse(PartnerBase):
    id: Optional[str] = Field(None, alias="_id")
    compliance_status: ComplianceStatus = ComplianceStatus.PENDING
    compliance_score: float = 0.0
    documents: List[PartnerDocument] = []
    certifications: List[Dict[str, Any]] = []
    ai_analysis: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class DocumentExtraction(BaseModel):
    document_content: str
    document_type: str

class ComplianceCheck(BaseModel):
    partner_id: str
    check_type: str = "full"

# ============== COMMUNICATION MODELS ==============

class CommunicationBase(BaseModel):
    customer_email: EmailStr
    customer_name: Optional[str] = None
    subject: str
    message: str

class CommunicationCreate(CommunicationBase):
    pass

class CommunicationResponse(CommunicationBase):
    id: Optional[str] = Field(None, alias="_id")
    category: Optional[CommunicationCategory] = None
    priority: int = 0
    sentiment: Optional[str] = None
    ai_suggested_response: Optional[str] = None
    ai_routing: Optional[Dict[str, Any]] = None
    status: str = "new"
    assigned_to: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class EmailClassification(BaseModel):
    email_content: str
    subject: str

# ============== SHIPMENT TRACKING MODELS ==============

class GPSData(BaseModel):
    latitude: float
    longitude: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    speed: Optional[float] = None
    heading: Optional[float] = None

class TemperatureData(BaseModel):
    value: float
    unit: str = "celsius"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    is_alert: bool = False

class ShipmentBase(BaseModel):
    tracking_number: str
    origin: str
    destination: str
    carrier: Optional[str] = None
    weight: Optional[float] = None
    dimensions: Optional[Dict[str, float]] = None

class ShipmentCreate(ShipmentBase):
    estimated_delivery: Optional[datetime] = None
    special_instructions: Optional[str] = None

class ShipmentResponse(ShipmentBase):
    id: Optional[str] = Field(None, alias="_id")
    status: ShipmentStatus = ShipmentStatus.CREATED
    current_location: Optional[GPSData] = None
    location_history: List[GPSData] = []
    temperature_readings: List[TemperatureData] = []
    estimated_delivery: Optional[datetime] = None
    predicted_eta: Optional[datetime] = None
    delay_probability: float = 0.0
    route_optimization: Optional[Dict[str, Any]] = None
    alerts: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class LocationUpdate(BaseModel):
    shipment_id: str
    gps_data: GPSData
    temperature: Optional[TemperatureData] = None

class RouteOptimizationRequest(BaseModel):
    shipment_id: str
    current_location: GPSData
    traffic_conditions: Optional[str] = None

# ============== POD MODELS ==============

class PODBase(BaseModel):
    shipment_id: str
    recipient_name: str

class PODCreate(PODBase):
    signature_image: Optional[str] = None  # Base64 encoded
    photo_evidence: Optional[str] = None  # Base64 encoded
    gps_location: Optional[GPSData] = None
    notes: Optional[str] = None

class PODResponse(PODBase):
    id: Optional[str] = Field(None, alias="_id")
    status: PODStatus = PODStatus.PENDING
    signature_image: Optional[str] = None
    photo_evidence: Optional[str] = None
    gps_location: Optional[GPSData] = None
    delivery_timestamp: datetime = Field(default_factory=datetime.utcnow)
    ai_validation: Optional[Dict[str, Any]] = None
    validation_score: float = 0.0
    billing_synced: bool = False
    dispute_info: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class PODValidation(BaseModel):
    pod_id: str
    validation_type: str = "full"

class DisputeCreate(BaseModel):
    pod_id: str
    reason: str
    description: str

# ============== BILLING MODELS ==============

class InvoiceLineItem(BaseModel):
    description: str
    quantity: float
    unit_price: float
    total: float
    category: Optional[str] = None

class InvoiceBase(BaseModel):
    invoice_number: str
    vendor_name: str
    vendor_email: Optional[EmailStr] = None

class InvoiceCreate(InvoiceBase):
    line_items: List[InvoiceLineItem] = []
    subtotal: float
    tax: float = 0.0
    total: float
    due_date: datetime
    document_content: Optional[str] = None  # For OCR processing

class InvoiceResponse(InvoiceBase):
    id: Optional[str] = Field(None, alias="_id")
    line_items: List[InvoiceLineItem] = []
    subtotal: float = 0.0
    tax: float = 0.0
    total: float = 0.0
    due_date: Optional[datetime] = None
    status: InvoiceStatus = InvoiceStatus.PENDING
    ocr_extracted_data: Optional[Dict[str, Any]] = None
    ai_validation: Optional[Dict[str, Any]] = None
    matched_delivery_records: List[str] = []
    exceptions: List[Dict[str, Any]] = []
    auto_approved: bool = False
    payment_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class OCRRequest(BaseModel):
    document_content: str  # Base64 encoded image
    document_type: str = "invoice"

class ReconciliationRequest(BaseModel):
    invoice_id: str
    delivery_records: List[str]

# ============== DASHBOARD MODELS ==============

class DashboardMetrics(BaseModel):
    total_partners: int = 0
    compliant_partners: int = 0
    pending_communications: int = 0
    active_shipments: int = 0
    on_time_delivery_rate: float = 0.0
    pending_pods: int = 0
    validated_pods: int = 0
    pending_invoices: int = 0
    total_revenue: float = 0.0
    disputes_count: int = 0

class AnalyticsRequest(BaseModel):
    start_date: datetime
    end_date: datetime
    metrics: List[str] = []

class AIInsight(BaseModel):
    category: str
    title: str
    description: str
    impact: str
    recommendations: List[str] = []
    confidence: float = 0.0
