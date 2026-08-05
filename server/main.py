from fastapi import FastAPI, Depends
from core.database import init_db
from core.security import verify_token
from routers import households, tasks, active_tasks, highscores

app = FastAPI(
    title="Housekeeping Shared Backend API",
    description="Multi-user household task sharing API backend powered by FastAPI & SQLite (Clean Layered Architecture)",
    version="1.0.0"
)

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
