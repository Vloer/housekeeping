import sqlite3
from datetime import datetime, timedelta
from typing import Optional

class TaskRepository:
    def __init__(self, db: sqlite3.Connection):
        self.db = db

    def get_catalog(self, household_id: int) -> list[sqlite3.Row]:
        cursor = self.db.cursor()
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
        return cursor.fetchall()

    def get_active(self, household_id: int) -> list[sqlite3.Row]:
        cursor = self.db.cursor()
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
        return cursor.fetchall()

    def get_all_active_unsorted(self, household_id: int) -> list[sqlite3.Row]:
        cursor = self.db.cursor()
        query = """
        SELECT a.id, a.catalog_task_id, c.name, a.frequency_days, a.last_done_date,
               date(a.last_done_date, '+' || a.frequency_days || ' days') AS due_date,
               CAST(julianday('now', 'localtime') - julianday(date(a.last_done_date, '+' || a.frequency_days || ' days')) AS INTEGER) AS days_overdue
        FROM active_tasks a
        JOIN task_catalog c ON a.catalog_task_id = c.id
        WHERE a.household_id = ?
        """
        cursor.execute(query, (household_id,))
        return cursor.fetchall()

    def get_active_task_by_id(self, active_task_id: int) -> Optional[sqlite3.Row]:
        cursor = self.db.cursor()
        cursor.execute(
            "SELECT id, household_id, catalog_task_id, frequency_days FROM active_tasks WHERE id = ?",
            (active_task_id,)
        )
        return cursor.fetchone()

    def mark_task_done(self, active_task_id: int, today_str: str) -> bool:
        cursor = self.db.cursor()
        cursor.execute(
            "UPDATE active_tasks SET last_done_date = ?, notified_this_cycle = 0 WHERE id = ?",
            (today_str, active_task_id)
        )
        return cursor.rowcount > 0

    def award_points(self, household_id: int, user_uuid: str, catalog_task_id: int, points: int):
        cursor = self.db.cursor()
        cursor.execute(
            "UPDATE household_members SET points = points + ? WHERE household_id = ? AND user_uuid = ?",
            (points, household_id, user_uuid)
        )
        cursor.execute(
            "INSERT INTO task_completions (household_id, user_uuid, catalog_task_id, points_awarded) VALUES (?, ?, ?, ?)",
            (household_id, user_uuid, catalog_task_id, points)
        )

    def activate(self, household_id: int, catalog_task_id: int, frequency_days: int):
        cursor = self.db.cursor()
        cursor.execute(
            "SELECT id FROM active_tasks WHERE household_id = ? AND catalog_task_id = ?",
            (household_id, catalog_task_id)
        )
        existing = cursor.fetchone()
        if existing:
            cursor.execute(
                "UPDATE active_tasks SET frequency_days = ?, notified_this_cycle = 0 WHERE id = ?",
                (frequency_days, existing["id"])
            )
        else:
            cursor.execute(
                "INSERT INTO active_tasks (household_id, catalog_task_id, frequency_days, notified_this_cycle) VALUES (?, ?, ?, 0)",
                (household_id, catalog_task_id, frequency_days)
            )

    def deactivate(self, household_id: int, catalog_task_id: int):
        cursor = self.db.cursor()
        cursor.execute(
            "DELETE FROM active_tasks WHERE household_id = ? AND catalog_task_id = ?",
            (household_id, catalog_task_id)
        )

    def update_last_done(self, active_task_id: int, last_done_date: str):
        cursor = self.db.cursor()
        cursor.execute(
            "UPDATE active_tasks SET last_done_date = ?, notified_this_cycle = 0 WHERE id = ?",
            (last_done_date, active_task_id)
        )

    def create_custom(self, household_id: int, name: str, default_frequency_days: int) -> int:
        cursor = self.db.cursor()
        cursor.execute(
            "INSERT INTO task_catalog (household_id, name, is_custom, default_frequency_days) VALUES (?, ?, 1, ?)",
            (household_id, name, default_frequency_days)
        )
        catalog_task_id = cursor.lastrowid
        cursor.execute(
            "INSERT INTO active_tasks (household_id, catalog_task_id, frequency_days, notified_this_cycle) VALUES (?, ?, ?, 0)",
            (household_id, catalog_task_id, default_frequency_days)
        )
        return catalog_task_id

    def update_task_details(self, household_id: int, catalog_task_id: int, name: str, frequency_days: int):
        cursor = self.db.cursor()
        cursor.execute(
            "UPDATE task_catalog SET name = ?, default_frequency_days = ? WHERE id = ? AND household_id = ?",
            (name, frequency_days, catalog_task_id, household_id)
        )
        cursor.execute(
            "UPDATE active_tasks SET frequency_days = ? WHERE catalog_task_id = ? AND household_id = ?",
            (frequency_days, catalog_task_id, household_id)
        )

    def delete_task(self, household_id: int, catalog_task_id: int):
        cursor = self.db.cursor()
        cursor.execute("DELETE FROM active_tasks WHERE household_id = ? AND catalog_task_id = ?", (household_id, catalog_task_id))
        cursor.execute("DELETE FROM task_completions WHERE household_id = ? AND catalog_task_id = ?", (household_id, catalog_task_id))
        cursor.execute("DELETE FROM task_catalog WHERE id = ? AND household_id = ?", (catalog_task_id, household_id))

    def import_csv_line(self, household_id: int, name: str, freq: int, last_done: Optional[str]):
        cursor = self.db.cursor()
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

    def commit(self):
        self.db.commit()
