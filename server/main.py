from fastapi import FastAPI
from database import init_db
from routers import households, tasks, active_tasks

app = FastAPI(
    title="Housekeeping Shared Backend API",
    description="Multi-user household task sharing API backend powered by FastAPI & SQLite",
    version="1.0.0"
)

# Initialize Database tables
init_db()

# Include Routers
app.include_router(households.router)
app.include_router(tasks.router)
app.include_router(active_tasks.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Housekeeping Shared Backend API",
        "docs": "/docs"
    }
