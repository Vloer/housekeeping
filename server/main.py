import logging
from fastapi import FastAPI, Depends
from core.database import init_db
from core.security import verify_token
from core.logging_middleware import HTTPLoggingMiddleware
from routers import households, tasks, active_tasks, highscores

# Configure root logger to output to stdout
logging.basicConfig(level=logging.INFO, format="%(message)s")

# Disable default Uvicorn access logger to prevent duplicate logging
logging.getLogger("uvicorn.access").disabled = True

app = FastAPI(
    title="Housekeeping Shared Backend API",
    description="Multi-user household task sharing API backend powered by FastAPI & SQLite (Clean Layered Architecture)",
    version="1.0.0"
)

# Register HTTP logging middleware
app.add_middleware(HTTPLoggingMiddleware)

# Initialize Database tables on application startup
init_db()

# Register Routers with enforced Bearer Token authentication
app.include_router(households.router, dependencies=[Depends(verify_token)])
app.include_router(tasks.router, dependencies=[Depends(verify_token)])
app.include_router(active_tasks.router, dependencies=[Depends(verify_token)])
app.include_router(highscores.router, dependencies=[Depends(verify_token)])

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Housekeeping Shared Backend API",
        "docs": "/docs"
    }
