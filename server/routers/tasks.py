import sqlite3
from fastapi import APIRouter, Depends, HTTPException

from database import get_db
from schemas import (
    ActivateTaskRequest,
    DeactivateTaskRequest,
    CustomTaskRequest,
    UpdateTaskRequest,
    ImportCsvRequest,
    DeleteTaskRequest
)

router = APIRouter(prefix="/api/households", tags=["Tasks"])

@router.get("/{household_id}/catalog")
def get_catalog_tasks(household_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    query = """
    SELECT c.id, c.name, c.is_custom, c.default_frequency_days,
           a.id AS active_id, a.frequency_days, a.last_done_date,
           date(a.last_done_date, '+' || a.frequency_days || ' days') AS due_date
    FROM task_catalog c
    LEFT JOIN active_tasks a ON c.id = a.catalog_task_id AND a.household_id = c.household_id
    WHERE c.household_id = ?
    ORDER BY c.name ASC
    """
    cursor.execute(query, (household_id,))
    rows = cursor.fetchall()
    result = []
    for r in rows:
        is_active = r["active_id"] is not None
        freq_days = r["frequency_days"] if is_active else r["default_frequency_days"]
        last_done = r["last_done_date"] if is_active else None
        due_date = r["due_date"] if is_active else None
        result.append({
            "id": r["id"],
            "name": r["name"],
            "is_custom": bool(r["is_custom"]),
            "default_frequency_days": r["default_frequency_days"],
            "is_active": is_active,
            "active_id": r["active_id"],
            "frequency_days": freq_days,
            "last_done_date": last_done,
            "due_date": due_date
        })
    return result

@router.get("/{household_id}/active")
def get_active_tasks(household_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    query = """
    SELECT a.id, a.catalog_task_id, c.name, a.frequency_days, a.last_done_date,
           date(a.last_done_date, '+' || a.frequency_days || ' days') AS due_date,
           CAST(julianday('now', 'localtime') - julianday(date(a.last_done_date, '+' || a.frequency_days || ' days')) AS INTEGER) AS days_overdue
    FROM active_tasks a
    JOIN task_catalog c ON a.catalog_task_id = c.id
    WHERE a.household_id = ?
      AND (
        a.last_done_date IS NULL
        OR julianday('now', 'localtime') - julianday(date(a.last_done_date, '+' || a.frequency_days || ' days')) >= -2
        OR a.last_done_date >= date('now', 'localtime', 'weekday 0', '-6 days')
      )
    ORDER BY a.frequency_days ASC, days_overdue ASC
    """
    cursor.execute(query, (household_id,))
    rows = cursor.fetchall()
    result = []
    for r in rows:
        last_done = r["last_done_date"]
        due_date = r["due_date"]
        days_overdue = r["days_overdue"]
        if last_done is None or days_overdue is None:
            days_overdue = r["frequency_days"]
        
        result.append({
            "id": r["id"],
            "catalog_task_id": r["catalog_task_id"],
            "task_name": r["name"],
            "frequency_days": r["frequency_days"],
            "last_done_date": last_done,
            "due_date": due_date,
            "days_overdue": days_overdue
        })
    return result

@router.get("/{household_id}/active/all")
def get_all_active_tasks_unsorted(household_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    query = """
    SELECT a.id, a.catalog_task_id, c.name, a.frequency_days, a.last_done_date,
           date(a.last_done_date, '+' || a.frequency_days || ' days') AS due_date,
           CAST(julianday('now', 'localtime') - julianday(date(a.last_done_date, '+' || a.frequency_days || ' days')) AS INTEGER) AS days_overdue
    FROM active_tasks a
    JOIN task_catalog c ON a.catalog_task_id = c.id
    WHERE a.household_id = ?
    """
    cursor.execute(query, (household_id,))
    rows = cursor.fetchall()
    result = []
    for r in rows:
        last_done = r["last_done_date"]
        due_date = r["due_date"]
        days_overdue = r["days_overdue"]
        if last_done is None or days_overdue is None:
            days_overdue = r["frequency_days"]
        result.append({
            "id": r["id"],
            "catalog_task_id": r["catalog_task_id"],
            "task_name": r["name"],
            "frequency_days": r["frequency_days"],
            "last_done_date": last_done,
            "due_date": due_date,
            "days_overdue": days_overdue
        })
    return result

@router.post("/{household_id}/activate")
def activate_task(household_id: int, req: ActivateTaskRequest, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute(
        "SELECT id FROM active_tasks WHERE household_id = ? AND catalog_task_id = ?",
        (household_id, req.catalog_task_id)
    )
    existing = cursor.fetchone()
    if existing:
        cursor.execute(
            "UPDATE active_tasks SET frequency_days = ?, notified_this_cycle = 0 WHERE id = ?",
            (req.frequency_days, existing["id"])
        )
    else:
        cursor.execute(
            "INSERT INTO active_tasks (household_id, catalog_task_id, frequency_days, notified_this_cycle) VALUES (?, ?, ?, 0)",
            (household_id, req.catalog_task_id, req.frequency_days)
        )
    db.commit()
    return {"status": "success"}

@router.post("/{household_id}/deactivate")
def deactivate_task(household_id: int, req: DeactivateTaskRequest, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("DELETE FROM active_tasks WHERE household_id = ? AND catalog_task_id = ?", (household_id, req.catalog_task_id))
    db.commit()
    return {"status": "success"}

@router.post("/{household_id}/custom-task")
def add_custom_task(household_id: int, req: CustomTaskRequest, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute(
        "INSERT INTO task_catalog (household_id, name, is_custom, default_frequency_days) VALUES (?, ?, 1, ?)",
        (household_id, req.name, req.default_frequency_days)
    )
    catalog_task_id = cursor.lastrowid
    cursor.execute(
        "INSERT INTO active_tasks (household_id, catalog_task_id, frequency_days, notified_this_cycle) VALUES (?, ?, ?, 0)",
        (household_id, catalog_task_id, req.default_frequency_days)
    )
    db.commit()
    return {"status": "success", "catalog_task_id": catalog_task_id}

@router.post("/{household_id}/update-task")
def update_task(household_id: int, req: UpdateTaskRequest, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute(
        "UPDATE task_catalog SET name = ?, default_frequency_days = ? WHERE id = ? AND household_id = ?",
        (req.name, req.frequency_days, req.catalog_task_id, household_id)
    )
    cursor.execute(
        "UPDATE active_tasks SET frequency_days = ? WHERE catalog_task_id = ? AND household_id = ?",
        (req.frequency_days, req.catalog_task_id, household_id)
    )
    db.commit()
    return {"status": "success"}

@router.post("/{household_id}/delete-task")
def delete_task(household_id: int, req: DeleteTaskRequest, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("DELETE FROM active_tasks WHERE household_id = ? AND catalog_task_id = ?", (household_id, req.catalog_task_id))
    cursor.execute("DELETE FROM task_completions WHERE household_id = ? AND catalog_task_id = ?", (household_id, req.catalog_task_id))
    cursor.execute("DELETE FROM task_catalog WHERE id = ? AND household_id = ?", (req.catalog_task_id, household_id))
    db.commit()
    return {"status": "success"}

@router.post("/{household_id}/import-csv")
def import_csv(household_id: int, req: ImportCsvRequest, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
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
            
            cursor.execute("SELECT id FROM task_catalog WHERE household_id = ? AND name = ?", (household_id, name))
            c_row = cursor.fetchone()
            if c_row:
                cat_id = c_row["id"]
            else:
                cursor.execute(
                    "INSERT INTO task_catalog (household_id, name, is_custom, default_frequency_days) VALUES (?, ?, 1, ?)",
                    (household_id, name, freq)
                )
                cat_id = cursor.lastrowid
            
            cursor.execute("SELECT id FROM active_tasks WHERE household_id = ? AND catalog_task_id = ?", (household_id, cat_id))
            a_row = cursor.fetchone()
            if a_row:
                cursor.execute(
                    "UPDATE active_tasks SET frequency_days = ?, last_done_date = ?, notified_this_cycle = 0 WHERE id = ?",
                    (freq, last_done, a_row["id"])
                )
            else:
                cursor.execute(
                    "INSERT INTO active_tasks (household_id, catalog_task_id, frequency_days, last_done_date, notified_this_cycle) VALUES (?, ?, ?, ?, 0)",
                    (household_id, cat_id, freq, last_done)
                )
    
    db.commit()
    return {"status": "success"}
