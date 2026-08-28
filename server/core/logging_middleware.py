import time
import logging
import sqlite3
import json
from datetime import datetime, timezone, timedelta
from urllib.parse import unquote
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from core.config import DB_PATH

# Configure logger for HTTP access logs
logger = logging.getLogger("http_access")
GMT_PLUS_1 = timezone(timedelta(hours=2))

class HTTPLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.perf_counter()

        # Safely read JSON body without breaking downstream handlers
        body_json = {}
        try:
            body_bytes = await request.body()
            async def receive():
                return {"type": "http.request", "body": body_bytes}
            request._receive = receive
            if body_bytes:
                body_json = json.loads(body_bytes.decode("utf-8"))
        except Exception:
            body_json = {}

        # Execute request downstream
        response = await call_next(request)

        # Calculate latency in milliseconds
        process_time_ms = (time.perf_counter() - start_time) * 1000

        # Extract client IP
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        elif request.client and request.client.host:
            client_ip = request.client.host
        else:
            client_ip = "unknown"

        # Build path string including query params if available
        url_path = request.url.path
        if request.url.query:
            url_path = f"{url_path}?{request.url.query}"

        # Extract user, household, and task key context
        username, household_name, task_key = self._extract_context(request, body_json)

        context_parts = []
        if username:
            context_parts.append(f"[User: {username}]")
        if household_name:
            context_parts.append(f"[Household: {household_name}]")
        if task_key:
            context_parts.append(f"[Task: {task_key}]")

        context_str = (" " + " ".join(context_parts)) if context_parts else ""

        timestamp = datetime.now(GMT_PLUS_1).strftime("%Y-%m-%d %H:%M:%S")
        log_message = (
            f"{timestamp} [INFO] HTTP {request.method} {url_path} -> "
            f"{response.status_code} (in {process_time_ms:.1f}ms) [IP: {client_ip}]{context_str}"
        )
        logger.info(log_message)

        return response

    def _extract_context(self, request: Request, body_json: dict):
        headers = request.headers
        raw_user = headers.get("x-user-name") or headers.get("x-username")
        username = unquote(raw_user).strip() if raw_user else None

        user_uuid = headers.get("x-user-uuid") or body_json.get("user_uuid")

        raw_hh = headers.get("x-household-name")
        household_name = unquote(raw_hh).strip() if raw_hh else None
        household_id_str = headers.get("x-household-id")

        url_path = request.url.path
        path_parts = [p for p in url_path.split("/") if p]

        if not username:
            username = body_json.get("user_name") or body_json.get("username")

        if not household_name and ("create" in url_path or "join" in url_path):
            if "name" in body_json and isinstance(body_json["name"], str):
                household_name = body_json["name"]

        household_id = None
        if household_id_str and household_id_str.isdigit():
            household_id = int(household_id_str)

        if not household_id:
            if "households" in path_parts:
                idx = path_parts.index("households")
                if idx + 1 < len(path_parts) and path_parts[idx + 1].isdigit():
                    household_id = int(path_parts[idx + 1])
            elif "household" in path_parts:
                idx = path_parts.index("household")
                if idx + 1 < len(path_parts) and path_parts[idx + 1].isdigit():
                    household_id = int(path_parts[idx + 1])

        active_task_id = None
        if "active-tasks" in path_parts:
            idx = path_parts.index("active-tasks")
            if idx + 1 < len(path_parts) and path_parts[idx + 1].isdigit():
                active_task_id = int(path_parts[idx + 1])

        catalog_task_id = body_json.get("catalog_task_id")
        task_key = None

        if "custom-task" in url_path and "name" in body_json:
            task_key = body_json.get("name")

        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            # Resolve join_code to household_name if needed
            if not household_name and "join_code" in body_json:
                code = str(body_json["join_code"]).strip().upper()
                cursor.execute("SELECT id, name FROM households WHERE UPPER(join_code) = ?", (code,))
                row = cursor.fetchone()
                if row:
                    household_name = row["name"]
                    if not household_id:
                        household_id = row["id"]

            # Resolve active_task_id to catalog_task_id and household_id if needed
            if active_task_id:
                cursor.execute(
                    "SELECT household_id, catalog_task_id FROM active_tasks WHERE id = ?",
                    (active_task_id,)
                )
                row = cursor.fetchone()
                if row:
                    if not household_id:
                        household_id = row["household_id"]
                    if not catalog_task_id:
                        catalog_task_id = row["catalog_task_id"]

            # Resolve household_name by household_id
            if household_id and not household_name:
                cursor.execute("SELECT name FROM households WHERE id = ?", (household_id,))
                row = cursor.fetchone()
                if row:
                    household_name = row["name"]

            # Resolve username by household_id and user_uuid
            if household_id and user_uuid and not username:
                cursor.execute(
                    "SELECT username FROM household_members WHERE household_id = ? AND user_uuid = ?",
                    (household_id, user_uuid)
                )
                row = cursor.fetchone()
                if row:
                    username = row["username"]

            # Resolve task_key by catalog_task_id
            if catalog_task_id and not task_key:
                cursor.execute("SELECT name FROM task_catalog WHERE id = ?", (catalog_task_id,))
                row = cursor.fetchone()
                if row:
                    task_key = row["name"]

            conn.close()
        except Exception:
            pass

        return username, household_name, task_key
