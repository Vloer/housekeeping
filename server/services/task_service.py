from datetime import datetime, timedelta
from fastapi import HTTPException, status
from repositories.task_repository import TaskRepository
from schemas.task import (
    CatalogTaskResponse,
    ActiveTaskResponse,
    MarkDoneRequest,
    MarkDoneResponse,
    ActivateTaskRequest,
    DeactivateTaskRequest,
    UpdateLastDoneRequest,
    UpdateDueDateRequest,
    UpdateDueDateResponse,
    CustomTaskRequest,
    CustomTaskResponse,
    UpdateTaskRequest,
    ImportCsvRequest,
    DeleteTaskRequest
)

class TaskService:
    def __init__(self, repo: TaskRepository):
        self.repo = repo

    def get_catalog(self, household_id: int) -> list[CatalogTaskResponse]:
        rows = self.repo.get_catalog(household_id)
        result = []
        for r in rows:
            is_active = r["active_id"] is not None
            freq_days = r["frequency_days"] if is_active else r["default_frequency_days"]
            last_done = r["last_done_date"] if is_active else None
            due_date = r["due_date"] if is_active else None
            result.append(CatalogTaskResponse(
                id=r["id"],
                name=r["name"],
                is_custom=bool(r["is_custom"]),
                default_frequency_days=r["default_frequency_days"],
                is_active=is_active,
                active_id=r["active_id"],
                frequency_days=freq_days,
                last_done_date=last_done,
                due_date=due_date
            ))
        return result

    def get_active(self, household_id: int) -> list[ActiveTaskResponse]:
        rows = self.repo.get_active(household_id)
        result = []
        for r in rows:
            last_done = r["last_done_date"]
            due_date = r["due_date"]
            days_overdue = r["days_overdue"]
            if last_done is None or days_overdue is None:
                days_overdue = r["frequency_days"]
            
            result.append(ActiveTaskResponse(
                id=r["id"],
                catalog_task_id=r["catalog_task_id"],
                task_name=r["name"],
                frequency_days=r["frequency_days"],
                last_done_date=last_done,
                due_date=due_date,
                days_overdue=days_overdue
            ))
        return result

    def get_all_active_unsorted(self, household_id: int) -> list[ActiveTaskResponse]:
        rows = self.repo.get_all_active_unsorted(household_id)
        result = []
        for r in rows:
            last_done = r["last_done_date"]
            due_date = r["due_date"]
            days_overdue = r["days_overdue"]
            if last_done is None or days_overdue is None:
                days_overdue = r["frequency_days"]
            result.append(ActiveTaskResponse(
                id=r["id"],
                catalog_task_id=r["catalog_task_id"],
                task_name=r["name"],
                frequency_days=r["frequency_days"],
                last_done_date=last_done,
                due_date=due_date,
                days_overdue=days_overdue
            ))
        return result

    def mark_done(self, active_task_id: int, req: MarkDoneRequest = None) -> MarkDoneResponse:
        task_row = self.repo.get_active_task_by_id(active_task_id)
        today_str = datetime.now().strftime("%Y-%m-%d")
        
        self.repo.mark_task_done(active_task_id, today_str)
        
        points_awarded = 0
        if task_row and req and req.user_uuid:
            points_awarded = task_row["frequency_days"]
            self.repo.award_points(
                task_row["household_id"],
                req.user_uuid.strip(),
                task_row["catalog_task_id"],
                points_awarded
            )
            
        self.repo.commit()
        return MarkDoneResponse(
            status="success",
            last_done_date=today_str,
            points_awarded=points_awarded
        )

    def activate(self, household_id: int, req: ActivateTaskRequest):
        self.repo.activate(household_id, req.catalog_task_id, req.frequency_days)
        self.repo.commit()

    def deactivate(self, household_id: int, req: DeactivateTaskRequest):
        self.repo.deactivate(household_id, req.catalog_task_id)
        self.repo.commit()

    def update_last_done(self, active_task_id: int, req: UpdateLastDoneRequest):
        self.repo.update_last_done(active_task_id, req.last_done_date)
        self.repo.commit()

    def update_due_date(self, active_task_id: int, req: UpdateDueDateRequest) -> UpdateDueDateResponse:
        try:
            dt = datetime.strptime(req.due_date, "%Y-%m-%d")
            last_done_dt = dt - timedelta(days=req.frequency_days)
            last_done_str = last_done_dt.strftime("%Y-%m-%d")
            self.repo.update_last_done(active_task_id, last_done_str)
            self.repo.commit()
            return UpdateDueDateResponse(status="success", calculated_last_done=last_done_str)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid date format. Use YYYY-MM-DD.")

    def create_custom(self, household_id: int, req: CustomTaskRequest) -> CustomTaskResponse:
        catalog_task_id = self.repo.create_custom(household_id, req.name, req.default_frequency_days)
        self.repo.commit()
        return CustomTaskResponse(status="success", catalog_task_id=catalog_task_id)

    def update_task(self, household_id: int, req: UpdateTaskRequest):
        self.repo.update_task_details(household_id, req.catalog_task_id, req.name, req.frequency_days)
        self.repo.commit()

    def delete_task(self, household_id: int, req: DeleteTaskRequest):
        self.repo.delete_task(household_id, req.catalog_task_id)
        self.repo.commit()

    def import_csv(self, household_id: int, req: ImportCsvRequest):
        lines = req.csv_content.strip().split("\n")
        if not lines:
            return {"status": "empty"}
        
        start_idx = 1 if "task_name" in lines[0].lower() else 0
        for line in lines[start_idx:]:
            line = line.strip()
            if not line:
                continue
            parts = [p.strip('"\' ') for p in line.split(",")]
            if len(parts) >= 2:
                name = parts[0]
                try:
                    freq = int(parts[1])
                except ValueError:
                    freq = 30
                last_done = parts[2] if len(parts) >= 3 and parts[2] else None
                self.repo.import_csv_line(household_id, name, freq, last_done)
                
        self.repo.commit()
        return {"status": "success"}
