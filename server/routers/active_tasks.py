import sqlite3
from fastapi import APIRouter, Depends
from core.database import get_db
from repositories.task_repository import TaskRepository
from services.task_service import TaskService
from schemas.task import (
    MarkDoneRequest,
    MarkDoneResponse,
    UpdateLastDoneRequest,
    UpdateDueDateRequest,
    UpdateDueDateResponse
)

router = APIRouter(prefix="/api/active-tasks", tags=["Active Tasks"])

def get_task_service(db: sqlite3.Connection = Depends(get_db)) -> TaskService:
    repo = TaskRepository(db)
    return TaskService(repo)

@router.post("/{active_task_id}/mark-done", response_model=MarkDoneResponse)
def mark_done(active_task_id: int, req: MarkDoneRequest = None, service: TaskService = Depends(get_task_service)):
    return service.mark_done(active_task_id, req)

@router.post("/{active_task_id}/update-last-done")
def update_last_done(active_task_id: int, req: UpdateLastDoneRequest, service: TaskService = Depends(get_task_service)):
    service.update_last_done(active_task_id, req)
    return {"status": "success"}

@router.post("/{active_task_id}/update-due-date", response_model=UpdateDueDateResponse)
def update_due_date(active_task_id: int, req: UpdateDueDateRequest, service: TaskService = Depends(get_task_service)):
    return service.update_due_date(active_task_id, req)
