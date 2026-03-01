from fastapi import WebSocket
import json


class ConnectionManager:
    def __init__(self):
        self.active: dict[str, list[WebSocket]] = {}

    async def connect(self, slug: str, websocket: WebSocket):
        await websocket.accept()
        if slug not in self.active:
            self.active[slug] = []
        self.active[slug].append(websocket)

    def disconnect(self, slug: str, websocket: WebSocket):
        if slug in self.active:
            self.active[slug] = [ws for ws in self.active[slug] if ws != websocket]
            if not self.active[slug]:
                del self.active[slug]

    async def broadcast(self, slug: str, data: dict):
        if slug not in self.active:
            return
        dead = []
        for ws in self.active[slug]:
            try:
                await ws.send_text(json.dumps(data))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(slug, ws)


manager = ConnectionManager()
