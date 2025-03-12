
from fastapi import FastAPI
import uvicorn
from config import PORT, logger
from models import ScheduleRequest, ScheduleResponse
from middleware import setup_cors
from routes.schedule_routes import router as schedule_router

app = FastAPI(title="Scheduler API")

# Set up CORS middleware
setup_cors(app)

# Include routers
app.include_router(schedule_router)

@app.get("/")
def home():
    return {"status": "Scheduler API active", "version": "1.2.0"}

if __name__ == "__main__":
    logger.info(f"Starting Scheduler API on port {PORT}...")
    uvicorn.run(app, host="0.0.0.0", port=PORT)

