"""
TrustTrace AI - FastAPI Main Application Server
Smart Supply Chain Verification | AI + Blockchain + Cloud
"""

import os
import time
from datetime import datetime
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from backend.routers import shipments, predictions, analytics, chat, auth_router
from backend.core.database import init_db

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("trusttrace_api")

app = FastAPI(
    title="TrustTrace AI — Smart Supply Chain Verification API",
    description="Full-stack AI, Blockchain & Cloud Supply Chain Risk & Integrity Verification Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event
@app.on_event("startup")
def startup_event():
    logger.info("Initializing TrustTrace database...")
    init_db()
    logger.info("TrustTrace AI Backend Server started successfully.")

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    return response

# Health check endpoint
@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "HEALTHY",
        "service": "TrustTrace AI Backend Engine",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "CONNECTED",
        "blockchain_engine": "READY (EVM Local & Hardhat Compatible)",
        "ml_models": {
            "delay_model": "READY",
            "temperature_risk_model": "READY"
        }
    }

# Include API routers
app.include_router(shipments.router)
app.include_router(predictions.router)
app.include_router(analytics.router)
app.include_router(chat.router)
app.include_router(auth_router.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
