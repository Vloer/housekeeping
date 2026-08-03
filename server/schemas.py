from pydantic import BaseModel

class HouseholdCreate(BaseModel):
    name: str

class HouseholdJoin(BaseModel):
    join_code: str

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

class CustomTaskRequest(BaseModel):
    name: str
    default_frequency_days: int

class UpdateTaskRequest(BaseModel):
    catalog_task_id: int
    name: str
    frequency_days: int

class ImportCsvRequest(BaseModel):
    csv_content: str
