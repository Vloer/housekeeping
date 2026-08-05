import sqlite3
from typing import Optional

class HouseholdRepository:
    def __init__(self, db: sqlite3.Connection):
        self.db = db

    def get_by_join_code(self, join_code: str) -> Optional[sqlite3.Row]:
        cursor = self.db.cursor()
        cursor.execute(
            "SELECT id, name, join_code FROM households WHERE UPPER(join_code) = UPPER(?)",
            (join_code.strip(),)
        )
        return cursor.fetchone()

    def get_by_id(self, household_id: int) -> Optional[sqlite3.Row]:
        cursor = self.db.cursor()
        cursor.execute("SELECT id, name, join_code FROM households WHERE id = ?", (household_id,))
        return cursor.fetchone()

    def exists_join_code(self, join_code: str) -> bool:
        cursor = self.db.cursor()
        cursor.execute("SELECT id FROM households WHERE join_code = ?", (join_code,))
        return cursor.fetchone() is not None

    def create_household(self, name: str, join_code: str) -> int:
        cursor = self.db.cursor()
        cursor.execute("INSERT INTO households (name, join_code) VALUES (?, ?)", (name, join_code))
        return cursor.lastrowid

    def add_preinstalled_tasks(self, household_id: int, tasks: list[tuple[str, int]]):
        cursor = self.db.cursor()
        for name, freq in tasks:
            cursor.execute(
                "INSERT INTO task_catalog (household_id, name, is_custom, default_frequency_days) VALUES (?, ?, 0, ?)",
                (household_id, name, freq)
            )

    def get_member_by_uuid(self, household_id: int, user_uuid: str) -> Optional[sqlite3.Row]:
        cursor = self.db.cursor()
        cursor.execute(
            "SELECT username FROM household_members WHERE household_id = ? AND user_uuid = ?",
            (household_id, user_uuid)
        )
        return cursor.fetchone()

    def is_username_taken(self, household_id: int, username: str) -> bool:
        cursor = self.db.cursor()
        cursor.execute(
            "SELECT id FROM household_members WHERE household_id = ? AND UPPER(username) = UPPER(?)",
            (household_id, username.strip())
        )
        return cursor.fetchone() is not None

    def add_member(self, household_id: int, user_uuid: str, username: str):
        cursor = self.db.cursor()
        cursor.execute(
            "INSERT INTO household_members (household_id, user_uuid, username, points) VALUES (?, ?, ?, 0)",
            (household_id, user_uuid, username)
        )

    def commit(self):
        self.db.commit()
