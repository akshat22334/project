"""
AI Logistics Platform - Main Application Entry Point
A comprehensive AI-driven logistics management system with 5 intelligent agents
"""
 
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
 
from app.config.database import connect_to_mongo, close_mongo_connection
from app.routes import (
    onboarding_routes,
    communication_routes,
    tracking_routes,
    pod_routes,
    billing_routes,
    dashboard_routes,
    auth_routes
)
 
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle - startup and shutdown events"""
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()
 
app = FastAPI(
    title="AI Logistics Platform",
    description="Comprehensive AI-driven logistics management system with intelligent agents",
    version="1.0.0",
    lifespan=lifespan
)
 
# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
# Include routers
app.include_router(auth_routes.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(onboarding_routes.router, prefix="/api/onboarding", tags=["Partner Onboarding & Compliance"])
app.include_router(communication_routes.router, prefix="/api/communication", tags=["Customer Communication"])
app.include_router(tracking_routes.router, prefix="/api/tracking", tags=["Shipment Tracking"])
app.include_router(pod_routes.router, prefix="/api/pod", tags=["Proof of Delivery"])
app.include_router(billing_routes.router, prefix="/api/billing", tags=["Billing & Reconciliation"])
app.include_router(dashboard_routes.router, prefix="/api/dashboard", tags=["Dashboard & Analytics"])
 
@app.get("/")
async def root():
    return {
        "message": "AI Logistics Platform API",
        "version": "1.0.0",
        "agents": [
            "Smart Partner Onboarding & Compliance Agent",
            "AI-Powered Demand & Customer Communication Router",
            "Autonomous Execution & Predictive Tracking Agent",
            "Digital Proof-of-Delivery (POD) Automation Agent",
            "Intelligent Financial Reconciliation & Billing Agent"
        ]
    }
 
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "AI Logistics Platform"}
 
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
 
 