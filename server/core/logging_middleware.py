import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request

# Configure logger for HTTP access logs
logger = logging.getLogger("http_access")

class HTTPLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.perf_counter()

        # Execute request downstream
        response = await call_next(request)

        # Calculate latency in milliseconds
        process_time_ms = (time.perf_counter() - start_time) * 1000

        # Extract client IP (checking X-Forwarded-For header first in case behind proxy)
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

        # Format and log access message
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        log_message = (
            f"{timestamp} [INFO] HTTP {request.method} {url_path} -> "
            f"{response.status_code} (in {process_time_ms:.1f}ms) [IP: {client_ip}]"
        )
        logger.info(log_message)

        return response
