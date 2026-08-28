from pydantic import BaseModel

class MarkDoneRequest(BaseModel):
    user_uuid: str | None = None
    user_uuids: list[str] | None = None

class MarkDoneResponse(BaseModel):
    status: str
    last_done_date: str
    points_awarded: int

class ActivateTaskRequest(BaseModel):
    catalog_task_id: int
    frequency_days: int

class DeactivateTaskRequest(BaseModel):
    catalog_task_id: int

class UpdateLastDoneRequest(BaseModel):
    last_done_date: str

class UpdateDueDateRequest(BaseModel):
    due_date: str
    frequency_days: int

class UpdateDueDateResponse(BaseModel):
    status: str
    calculated_last_done: str

class CustomTaskRequest(BaseModel):
    name: str
    default_frequency_days: int

class CustomTaskResponse(BaseModel):
    status: str
    catalog_task_id: int

class UpdateTaskRequest(BaseModel):
    catalog_task_id: int
    name: str
    frequency_days: int

class ImportCsvRequest(BaseModel):
    csv_content: str

class DeleteTaskRequest(BaseModel):
    catalog_task_id: int

class CatalogTaskResponse(BaseModel):
    id: int
    name: str
    is_custom: bool
    default_frequency_days: int
    is_active: bool
    active_id: int | None = None
    frequency_days: int
    last_done_date: str | None = None
    due_date: str | None = None

class ActiveTaskResponse(BaseModel):
    id: int
    catalog_task_id: int
    task_name: str
    frequency_days: int
    last_done_date: str | None = None
    due_date: str | None = None
    days_overdue: int
