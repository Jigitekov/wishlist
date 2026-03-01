from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ws_manager import manager

router = APIRouter()


@router.websocket("/ws/{slug}")
async def websocket_endpoint(websocket: WebSocket, slug: str):
    await manager.connect(slug, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(slug, websocket)
