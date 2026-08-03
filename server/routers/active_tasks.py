import sqlite3
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException

from database import get_db
from schemas import UpdateLastDoneRequest, UpdateDueDateRequest, MarkDoneRequest

router = APIRouter(prefix="/api/active-tasks", tags=["Active Tasks"])

@router.post("/{active_task_id}/mark-done")
def mark_done(active_task_id: int, req: MarkDoneRequest = None, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT household_id, frequency_days FROM active_tasks WHERE id = ?", (active_task_id,))
    task_row = cursor.fetchone()
    
    today_str = datetime.now().strftime("%Y-%m-%d")
    cursor.execute("UPDATE active_tasks SET last_done_date = ?, notified_this_cycle = 0 WHERE id = ?", (today_str, active_task_id))
    
    points_awarded = 0
    if task_row and req and req.user_uuid:
        points_awarded = task_row["frequency_days"]
        cursor.execute(
            "UPDATE household_members SET points = points + ? WHERE household_id = ? AND user_uuid = ?",
            (points_awarded, task_row["household_id"], req.user_uuid)
        )
    
    db.commit()
    return {"status": "success", "last_done_date": today_str, "points_awarded": points_awarded}

@router.post("/{active_task_id}/update-last-done")
def update_last_done(active_task_id: int, req: UpdateLastDoneRequest, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("UPDATE active_tasks SET last_done_date = ?, notified_this_cycle = 0 WHERE id = ?", (req.last_done_date, active_task_id))
    db.commit()
    return {"status": "success"}

@router.post("/{active_task_id}/update-due-date")
def update_due_date(active_task_id: int, req: UpdateDueDateRequest, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    try:
        dt = datetime.strptime(req.due_date, "%Y-%m-%d")
        last_done_dt = dt - timedelta(days=req.frequency_days)
        last_done_str = last_done_dt.strftime("%Y-%m-%d")
        cursor.execute("UPDATE active_tasks SET last_done_date = ?, notified_this_cycle = 0 WHERE id = ?", (last_done_str, active_task_id))
        db.commit()
        return {"status": "success", "calculated_last_done": last_done_str}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
