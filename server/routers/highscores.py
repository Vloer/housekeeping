import sqlite3
from fastapi import APIRouter, Depends, HTTPException

from database import get_db

router = APIRouter(prefix="/api/highscores", tags=["Highscores"])

@router.get("/household/{household_id}")
def get_household_highscores(household_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT id FROM households WHERE id = ?", (household_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Household not found")

    cursor.execute(
        """
        SELECT user_uuid, username, points
        FROM household_members
        WHERE household_id = ?
        ORDER BY points DESC, username ASC
        """,
        (household_id,)
    )
    rows = cursor.fetchall()
    result = []
    for idx, r in enumerate(rows, start=1):
        result.append({
            "rank": idx,
            "user_uuid": r["user_uuid"],
            "username": r["username"],
            "points": r["points"]
        })
    return result

@router.get("/global")
def get_global_highscores(db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute(
        """
        SELECT user_uuid, GROUP_CONCAT(DISTINCT username) as names, SUM(points) as total_points
        FROM household_members
        GROUP BY user_uuid
        ORDER BY total_points DESC
        """
    )
    rows = cursor.fetchall()
    result = []
    for idx, r in enumerate(rows, start=1):
        names = r["names"].replace(",", " / ") if r["names"] else "Anonymous"
        result.append({
            "rank": idx,
            "user_uuid": r["user_uuid"],
            "username": names,
            "points": r["total_points"] or 0
        })
    return result

@router.get("/household/{household_id}/user/{user_uuid}/tasks")
def get_user_task_stats(household_id: int, user_uuid: str, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    query = """
    SELECT c.name AS task_name,
           COUNT(tc.id) AS completions_count,
           COALESCE(NULLIF(SUM(tc.points_awarded), 0), COUNT(tc.id) * COALESCE(a.frequency_days, c.default_frequency_days)) AS total_points
    FROM task_completions tc
    JOIN task_catalog c ON tc.catalog_task_id = c.id
    LEFT JOIN active_tasks a ON tc.catalog_task_id = a.catalog_task_id AND tc.household_id = a.household_id
    WHERE tc.household_id = ? AND tc.user_uuid = ?
    GROUP BY tc.catalog_task_id, c.name
    HAVING completions_count > 0
    ORDER BY completions_count DESC, c.name ASC
    """
    cursor.execute(query, (household_id, user_uuid))
    rows = cursor.fetchall()
    return [
        {
            "task_name": r["task_name"],
            "completions_count": r["completions_count"],
            "total_points": r["total_points"]
        } for r in rows
    ]
