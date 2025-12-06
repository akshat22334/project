"""
Common Utility Functions
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from bson import ObjectId
import json


def serialize_doc(doc: dict) -> dict:
    """Serialize MongoDB document for JSON response"""
    if doc is None:
        return None
    
    serialized = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            serialized[key] = str(value)
        elif isinstance(value, datetime):
            serialized[key] = value.isoformat()
        elif isinstance(value, dict):
            serialized[key] = serialize_doc(value)
        elif isinstance(value, list):
            serialized[key] = [
                serialize_doc(item) if isinstance(item, dict) else
                str(item) if isinstance(item, ObjectId) else
                item.isoformat() if isinstance(item, datetime) else item
                for item in value
            ]
        else:
            serialized[key] = value
    
    return serialized


def serialize_docs(docs: List[dict]) -> List[dict]:
    """Serialize list of MongoDB documents"""
    return [serialize_doc(doc) for doc in docs]


def create_response(
    success: bool,
    data: Any = None,
    message: str = None,
    error: str = None
) -> dict:
    """Create standardized API response"""
    response = {"success": success}
    
    if data is not None:
        response["data"] = data
    if message:
        response["message"] = message
    if error:
        response["error"] = error
    
    response["timestamp"] = datetime.utcnow().isoformat()
    
    return response


def paginate(
    items: List[Any],
    page: int = 1,
    page_size: int = 20
) -> Dict[str, Any]:
    """Paginate list of items"""
    total = len(items)
    total_pages = (total + page_size - 1) // page_size
    
    start = (page - 1) * page_size
    end = start + page_size
    
    return {
        "items": items[start:end],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_items": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }
    }


def generate_tracking_number(prefix: str = "TRK") -> str:
    """Generate unique tracking number"""
    import random
    import string
    
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    return f"{prefix}{timestamp}{random_suffix}"


def generate_invoice_number(prefix: str = "INV") -> str:
    """Generate unique invoice number"""
    import random
    
    timestamp = datetime.utcnow().strftime("%Y%m%d")
    random_suffix = str(random.randint(1000, 9999))
    
    return f"{prefix}-{timestamp}-{random_suffix}"


def calculate_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two GPS coordinates in kilometers"""
    import math
    
    R = 6371  # Earth's radius in km
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c


def format_currency(amount: float, currency: str = "USD") -> str:
    """Format amount as currency string"""
    symbols = {
        "USD": "$",
        "EUR": "€",
        "GBP": "£",
        "INR": "₹"
    }
    symbol = symbols.get(currency, "$")
    return f"{symbol}{amount:,.2f}"


def parse_date(date_string: str) -> Optional[datetime]:
    """Parse date string in various formats"""
    formats = [
        "%Y-%m-%d",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%S.%f",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S.%fZ",
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%d-%m-%Y"
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_string, fmt)
        except ValueError:
            continue
    
    return None


def safe_json_parse(json_string: str, default: Any = None) -> Any:
    """Safely parse JSON string"""
    try:
        return json.loads(json_string)
    except (json.JSONDecodeError, TypeError):
        return default


def truncate_string(s: str, max_length: int = 100, suffix: str = "...") -> str:
    """Truncate string to max length"""
    if len(s) <= max_length:
        return s
    return s[:max_length - len(suffix)] + suffix


def clean_dict(d: dict) -> dict:
    """Remove None values from dictionary"""
    return {k: v for k, v in d.items() if v is not None}
