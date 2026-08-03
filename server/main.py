from fastapi import FastAPI, Depends
from database import init_db
from routers import households, tasks, active_tasks, highscores
from auth import verify_token

app = FastAPI(
    title="Housekeeping Shared Backend API",
    description="Multi-user household task sharing API backend powered by FastAPI & SQLite",
    version="1.0.0"
)

# Initialize Database tables
init_db()

# Include Routers with enforced authentication
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
