"""
Authentication Routes
User registration, login, and token management
"""
 
from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
 
from app.models.schemas import UserCreate, UserLogin, UserResponse, Token
from app.config.database import get_collection
from app.utils.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user
)
from app.utils.helpers import serialize_doc, create_response
 
router = APIRouter()
 
 
@router.post("/register", response_model=dict)
async def register_user(user: UserCreate):
    """Register a new user"""
    users = get_collection("users")
   
    # Check if user already exists
    existing_user = await users.find_one({"email": user.email})
    if existing_user:
        # If user exists, update their password hash
        new_password_hash = get_password_hash(user.password)
        await users.update_one(
            {"_id": existing_user["_id"]},
            {"$set": {"password_hash": new_password_hash, "updated_at": datetime.utcnow()}}
        )
       
        # Generate token
        token = create_access_token({
            "sub": str(existing_user["_id"]),
            "email": existing_user["email"],
            "role": existing_user.get("role", "user")
        })
 
        # Get updated user doc
        user_doc = await users.find_one({"_id": existing_user["_id"]})
       
        return create_response(
            success=True,
            data={
                "user": serialize_doc(user_doc),
                "access_token": token,
                "token_type": "bearer"
            },
            message="User already existed. Password has been updated."
        )
   
    # Create user document
    user_doc = {
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "password_hash": get_password_hash(user.password),
        "created_at": datetime.utcnow(),
        "is_active": True
    }
   
    result = await users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
   
    # Generate token
    token = create_access_token({
        "sub": str(result.inserted_id),
        "email": user.email,
        "role": user.role
    })
   
    return create_response(
        success=True,
        data={
            "user": serialize_doc(user_doc),
            "access_token": token,
            "token_type": "bearer"
        },
        message="User registered successfully"
    )
 
 
@router.post("/login", response_model=dict)
async def login(credentials: UserLogin):
    """Login and get access token"""
    users = get_collection("users")
   
    # Find user
    user = await users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
   
    # Verify password
    if not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
   
    # Check if active
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )
   
    # Update last login
    await users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
   
    # Generate token
    token = create_access_token({
        "sub": str(user["_id"]),
        "email": user["email"],
        "role": user.get("role", "user")
    })
   
    user_data = serialize_doc(user)
    del user_data["password_hash"]
   
    return create_response(
        success=True,
        data={
            "user": user_data,
            "access_token": token,
            "token_type": "bearer"
        },
        message="Login successful"
    )
 
 
@router.get("/me", response_model=dict)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    users = get_collection("users")
   
    from bson import ObjectId
    user = await users.find_one({"_id": ObjectId(current_user["user_id"])})
   
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
   
    user_data = serialize_doc(user)
    if "password_hash" in user_data:
        del user_data["password_hash"]
   
    return create_response(
        success=True,
        data=user_data
    )
 
 
@router.post("/refresh", response_model=dict)
async def refresh_token(current_user: dict = Depends(get_current_user)):
    """Refresh access token"""
    token = create_access_token({
        "sub": current_user["user_id"],
        "email": current_user["email"],
        "role": current_user.get("role", "user")
    })
   
    return create_response(
        success=True,
        data={
            "access_token": token,
            "token_type": "bearer"
        },
        message="Token refreshed successfully"
    )
 
 
@router.put("/profile", response_model=dict)
async def update_profile(
    updates: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile"""
    users = get_collection("users")
   
    # Filter allowed updates
    allowed_fields = ["full_name", "phone", "company", "preferences"]
    filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}
   
    if not filtered_updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid fields to update"
        )
   
    filtered_updates["updated_at"] = datetime.utcnow()
   
    from bson import ObjectId
    result = await users.update_one(
        {"_id": ObjectId(current_user["user_id"])},
        {"$set": filtered_updates}
    )
   
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or no changes made"
        )
   
    # Get updated user
    user = await users.find_one({"_id": ObjectId(current_user["user_id"])})
    user_data = serialize_doc(user)
    if "password_hash" in user_data:
        del user_data["password_hash"]
   
    return create_response(
        success=True,
        data=user_data,
        message="Profile updated successfully"
    )
 
 