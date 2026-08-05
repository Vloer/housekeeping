import sqlite3

class HighscoreRepository:
    def __init__(self, db: sqlite3.Connection):
        self.db = db

    def get_household_highscores(self, household_id: int) -> list[sqlite3.Row]:
        cursor = self.db.cursor()
        cursor.execute(
            """
            SELECT user_uuid, username, points
            FROM household_members
            WHERE household_id = ?
            ORDER BY points DESC, username ASC
            """,
            (household_id,)
        )
        return cursor.fetchall()

    def get_global_highscores(self) -> list[sqlite3.Row]:
        cursor = self.db.cursor()
        cursor.execute(
            """
            SELECT user_uuid, GROUP_CONCAT(DISTINCT username) as names, SUM(points) as total_points
            FROM household_members
            GROUP BY user_uuid
            ORDER BY total_points DESC
            """
        )
        return cursor.fetchall()

    def get_user_task_stats(self, household_id: int, user_uuid: str) -> list[sqlite3.Row]:
        cursor = self.db.cursor()
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
        return cursor.fetchall()
