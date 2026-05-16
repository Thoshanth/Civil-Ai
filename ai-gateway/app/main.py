"""
CivilAI Gateway - FastAPI Application
Main entry point for AI/LLM services
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import routers
from app.routers import geotech, boq, iscode, structural, tender, site_photo

# Create FastAPI app
app = FastAPI(
    title="CivilAI Gateway",
    description="AI-powered analysis for civil engineering documents and data",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative frontend port
        "https://*.vercel.app",   # Vercel deployments
        "https://*.netlify.app",  # Netlify deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(geotech.router, prefix="/api/geotech", tags=["Geotechnical"])
app.include_router(boq.router, prefix="/api/boq", tags=["BOQ"])
app.include_router(iscode.router, prefix="/api/iscode", tags=["IS Code"])
app.include_router(structural.router, prefix="/api/structural", tags=["Structural"])
app.include_router(tender.router, prefix="/api/tender", tags=["Tender"])
app.include_router(site_photo.router, prefix="/api/site_photo", tags=["Site Photo"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "CivilAI Gateway",
        "version": "1.0.0",
        "status": "running",
        "modules": [
            "geotechnical",
            "boq",
            "iscode",
            "structural",
            "tender",
            "site_photo"
        ]
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ai-gateway"
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc)
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
