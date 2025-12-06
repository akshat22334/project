# """
# Authentication Utilities
# JWT token handling and password hashing
# """
 
# from datetime import datetime, timedelta
# from typing import Optional, Union
# import os
# from passlib.exc import UnknownHashError
# from jose import JWTError, jwt
# from passlib.context import CryptContext
# from fastapi import HTTPException, Depends, status
# from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# from dotenv import load_dotenv
 
# load_dotenv()
 
# # Configuration
# SECRET_KEY = os.getenv("JWT_SECRET_KEY", "12345678")
# ALGORITHM = "HS256"
# ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
 
# pwd_context = CryptContext(schemes=["bcrypt", "sha512_crypt"], deprecated="auto")
 
# security = HTTPBearer()
 
# def _to_str(val: Union[str, bytes]) -> str:
#     if isinstance(val, bytes):
#         return val.decode("utf-8", errors="ignore")
#     if not isinstance(val, str):
#         raise ValueError("Password must be string or bytes")
#     return val
 
# def verify_password(plain_password: Union[str, bytes], hashed_password: str) -> bool:
#     plain = _to_str(plain_password)
#     try:
#         return pwd_context.verify(plain, hashed_password)
#     except UnknownHashError:
#         return False
 
# def get_password_hash(password: Union[str, bytes]) -> str:
#     pw = _to_str(password)
#     # protection against accidental huge payload
#     if len(pw.encode("utf-8")) > 4096:
#         raise HTTPException(status_code=400, detail="Password too long")
#     return pwd_context.hash(pw)
 
# def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
#     to_encode = data.copy()
#     expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
#     to_encode.update({"exp": expire})
#     return jwt.encode(to_encode, SECRET_KEY, ALGORITHM)
 
# def decode_access_token(token: str) -> dict:
#     try:
#         return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#     except JWTError:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Invalid or expired token",
#             headers={"WWW-Authenticate": "Bearer"},
#         )
 
# async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
#     payload = decode_access_token(credentials.credentials)
#     user_id = payload.get("sub")
#     if not user_id:
#         raise HTTPException(status_code=401, detail="Invalid token payload")
#     return {
#         "user_id": user_id,
#         "email": payload.get("email"),
#         "role": payload.get("role", "user")
#     }
 
# def require_role(required_role: str):
#     async def checker(current_user=Depends(get_current_user)):
#         if current_user["role"] not in [required_role, "admin"]:
#             raise HTTPException(status_code=403, detail=f"Role '{required_role}' required")
#         return current_user
#     return checker

"""
Authentication Utilities
JWT token handling and password hashing
"""

from datetime import datetime, timedelta
from typing import Optional, Union
import os
from passlib.exc import UnknownHashError
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "12345678")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# Correct bcrypt config
pwd_context = CryptContext(
    schemes=["bcrypt"],
    bcrypt__ident="2b",  # ensure correct variant
    deprecated="auto"
)

security = HTTPBearer()


def _to_str(val: Union[str, bytes]) -> str:
    if isinstance(val, bytes):
        return val.decode("utf-8", errors="ignore")
    if not isinstance(val, str):
        raise ValueError("Password must be string or bytes")
    return val


def safe_password(pw: str) -> str:
    """bcrypt supports only 72 bytes"""
    return pw[:72]


def verify_password(plain_password: Union[str, bytes], hashed_password: str) -> bool:
    plain = safe_password(_to_str(plain_password))
    try:
        return pwd_context.verify(plain, hashed_password)
    except UnknownHashError:
        return False


def get_password_hash(password: Union[str, bytes]) -> str:
    pw = safe_password(_to_str(password))
    return pwd_context.hash(pw)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return {
        "user_id": user_id,
        "email": payload.get("email"),
        "role": payload.get("role", "user")
    }


def require_role(required_role: str):
    async def checker(current_user=Depends(get_current_user)):
        if current_user["role"] not in [required_role, "admin"]:
            raise HTTPException(status_code=403, detail=f"Role '{required_role}' required")
        return current_user
    return checker
