"""
TrustTrace AI - Vercel Serverless Backend Handler
Wraps the FastAPI app for Vercel Python serverless runtime.
"""
import sys
import os
import json
import asyncio
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Ensure project root is on the path so `backend.*` imports resolve
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Use the bundled SQLite DB on Vercel (read-only filesystem)
os.environ.setdefault("DATABASE_URL", "sqlite:///" + os.path.join(PROJECT_ROOT, "data", "trusttrace.db"))

from backend.main import app  # noqa: E402


class _ASGIAdapter:
    """Minimal ASGI adapter that runs the FastAPI app per-request in an event loop."""

    def __init__(self, asgi_app):
        self.asgi_app = asgi_app

    def __call__(self, method, path, query_string, headers, body):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(self._run_asgi(method, path, query_string, headers, body))
        finally:
            loop.close()

    async def _run_asgi(self, method, path, query_string, headers, body):
        # Build ASGI scope from Vercel request info
        scope = {
            "type": "http",
            "asgi": {"version": "3.0"},
            "http_version": "1.1",
            "method": method,
            "scheme": "https",
            "path": path,
            "raw_path": path.encode("utf-8"),
            "query_string": query_string.encode("utf-8"),
            "root_path": "",
            "headers": [(k.lower().encode("utf-8"), v.encode("utf-8")) for k, v in headers.items()],
            "client": ("127.0.0.1", 0),
            "server": ("vercel", 443),
        }

        status_code = [200]
        response_headers = []
        response_body = b""

        async def receive():
            return {"type": "http.request", "body": body or b"", "more_body": False}

        async def send(message):
            if message["type"] == "http.response.start":
                status_code[0] = message["status"]
                response_headers.extend(message.get("headers", []))
            elif message["type"] == "http.response.body":
                response_body += message.get("body", b"")

        await self.asgi_app(scope, receive, send)

        return status_code[0], response_headers, response_body


adapter = _ASGIAdapter(app)


class Handler(BaseHTTPRequestHandler):
    """Vercel Python serverless request handler."""

    def do_GET(self):
        self._dispatch()

    def do_POST(self):
        self._dispatch()

    def do_PUT(self):
        self._dispatch()

    def do_DELETE(self):
        self._dispatch()

    def _dispatch(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query_string = parsed.query
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length) if content_length else b""

        headers = {k: v for k, v in self.headers.items()}

        try:
            status_code, response_headers, response_body = adapter(
                self.command, path, query_string, headers, body
            )
        except Exception as exc:  # noqa: BLE001
            status_code = 500
            response_headers = [("content-type", "application/json")]
            response_body = json.dumps({"detail": str(exc)}).encode("utf-8")

        self.send_response(status_code)
        for key, value in response_headers:
            key_str = key.decode("utf-8") if isinstance(key, bytes) else key
            value_str = value.decode("utf-8") if isinstance(value, bytes) else value
            if key_str.lower() == "content-length":
                continue  # let BaseHTTPRequestHandler handle it
            self.send_header(key_str, value_str)
        self.send_header("Content-Length", str(len(response_body)))
        self.end_headers()
        self.wfile.write(response_body)

    def log_message(self, format, *args):  # noqa: A002
        return  # silence default stderr logging
