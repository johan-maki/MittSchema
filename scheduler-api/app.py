
from fastapi import FastAPI, HTTPException
import uvicorn
from config import PORT, logger
from middleware import setup_cors
from routes.schedule_routes import router as schedule_router
from controllers.route_controller import router as route_router
from utils import get_supabase_client

app = FastAPI(
    title="Scheduler API",
    description="Employee scheduling optimization API with Gurobi",
    version="1.2.1"
)

# Set up CORS middleware
setup_cors(app)

# Include routers
app.include_router(schedule_router)
app.include_router(route_router)

@app.get("/")
def home():
    return {"status": "Scheduler API active", "version": "1.2.1"}

@app.get("/health")
def health_check():
    """Health check endpoint that verifies database connectivity"""
    try:
        # Test Supabase connection
        supabase = get_supabase_client()
        # Simple query to test connection
        result = supabase.table("employees").select("id").limit(1).execute()
        
        return {
            "status": "healthy",
            "database": "connected",
            "version": "1.2.1"
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail={
            "status": "unhealthy", 
            "database": "disconnected",
            "error": str(e)
        })

if __name__ == "__main__":
    logger.info(f"Starting Scheduler API on port {PORT}...")
    uvicorn.run(app, host="0.0.0.0", port=PORT)
