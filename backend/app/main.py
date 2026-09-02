from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router

app = FastAPI(
    title="AeroTwin NCR - Coupled Atmospheric Air Pollution Forecasting API",
    description="Physics-guided, explainable 72-hour air pollution forecast & decision-support API for Delhi NCR.",
    version="1.0.0-MVP"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows local dev frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "title": "AeroTwin NCR API",
        "description": "Physics-Guided 72-Hour Coupled Air Pollution Forecast & Decision Support Platform",
        "documentation": "/docs",
        "endpoints": {
            "health": "/api/v1/health",
            "observations": "/api/v1/observations",
            "forecast": "/api/v1/forecast",
            "explain": "/api/v1/forecast/explain",
            "attribution": "/api/v1/attribution",
            "plume": "/api/v1/plume",
            "scenario": "/api/v1/scenario",
            "validation": "/api/v1/validation",
            "comparison": "/api/v1/comparison",
            "wrf_status": "/api/v1/wrf-chem/status"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
