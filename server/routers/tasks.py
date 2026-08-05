import sqlite3
from fastapi import APIRouter, Depends
from core.database import get_db
from repositories.task_repository import TaskRepository
from services.task_service import TaskService
from schemas.task import (
    CatalogTaskResponse,
    ActiveTaskResponse,
    ActivateTaskRequest,
    DeactivateTaskRequest,
    CustomTaskRequest,
    CustomTaskResponse,
    UpdateTaskRequest,
    ImportCsvRequest,
    DeleteTaskRequest
)

router = APIRouter(prefix="/api/households", tags=["Tasks"])

def get_task_service(db: sqlite3.Connection = Depends(get_db)) -> TaskService:
    repo = TaskRepository(db)
    return TaskService(repo)

@router.get("/{household_id}/catalog", response_model=list[CatalogTaskResponse])
def get_catalog_tasks(household_id: int, service: TaskService = Depends(get_task_service)):
    return service.get_catalog(household_id)

@router.get("/{household_id}/active", response_model=list[ActiveTaskResponse])
def get_active_tasks(household_id: int, service: TaskService = Depends(get_task_service)):
    return service.get_active(household_id)

@router.get("/{household_id}/active/all", response_model=list[ActiveTaskResponse])
def get_all_active_tasks_unsorted(household_id: int, service: TaskService = Depends(get_task_service)):
    return service.get_all_active_unsorted(household_id)

@router.post("/{household_id}/activate")
def activate_task(household_id: int, req: ActivateTaskRequest, service: TaskService = Depends(get_task_service)):
    service.activate(household_id, req)
    return {"status": "success"}

@router.post("/{household_id}/deactivate")
def deactivate_task(household_id: int, req: DeactivateTaskRequest, service: TaskService = Depends(get_task_service)):
    service.deactivate(household_id, req)
    return {"status": "success"}

@router.post("/{household_id}/custom-task", response_model=CustomTaskResponse)
def add_custom_task(household_id: int, req: CustomTaskRequest, service: TaskService = Depends(get_task_service)):
    return service.create_custom(household_id, req)

@router.post("/{household_id}/update-task")
def update_task(household_id: int, req: UpdateTaskRequest, service: TaskService = Depends(get_task_service)):
    service.update_task(household_id, req)
    return {"status": "success"}

@router.post("/{household_id}/delete-task")
def delete_task(household_id: int, req: DeleteTaskRequest, service: TaskService = Depends(get_task_service)):
    service.delete_task(household_id, req)
    return {"status": "success"}

@router.post("/{household_id}/import-csv")
def import_csv(household_id: int, req: ImportCsvRequest, service: TaskService = Depends(get_task_service)):
    return service.import_csv(household_id, req)
