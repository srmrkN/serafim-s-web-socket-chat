import logging
import asyncio
import traceback
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocketState
import uvicorn
import json

app = FastAPI()

origins = [
    "http://localhost:3000",  # React frontend
    "http://127.0.0.1:3000",  # React frontend
    # Add other origins as needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Use the defined origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Specify allowed methods
    allow_headers=["*"],  # Allow all headers
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self.nicknames: dict[int, str] = {}
        self.disconnected_clients: dict[int, str] = {}

    async def connect(self, websocket: WebSocket, client_id: int, nickname: str):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.nicknames[client_id] = nickname
        logger.info(f"Client connected: {websocket.client}")

    def disconnect(self, websocket: WebSocket, client_id: int):
        self.active_connections.remove(websocket)
        if client_id in self.nicknames:
            self.disconnected_clients[client_id] = self.nicknames.pop(client_id)
            asyncio.create_task(self.remove_disconnected_client(client_id))
        logger.info(f"Client disconnected: {websocket.client}")

    async def remove_disconnected_client(self, client_id: int, delay: int = 60):
        await asyncio.sleep(delay)
        if client_id in self.disconnected_clients:
            del self.disconnected_clients[client_id]

    async def broadcast(self, client_id: int, message: str, is_system_message: bool = False):
        if message:  # Ensure message is not empty or None
            logger.info(f"Broadcast method called with client_id: {client_id} and message: {message}")
            for connection in self.active_connections:
                try:
                    await connection.send_text(message)
                    logger.info(f"Message sent to {connection.client}")
                except Exception as e:
                    logger.error(f"Error sending message to {connection.client}: {e}")
            logger.info(f"Broadcast message: {message}")

manager = ConnectionManager()

@app.websocket("/ws/{client_id}/{nickname}")
async def websocket_endpoint(websocket: WebSocket, client_id: int, nickname: str):
    await manager.connect(websocket, client_id, nickname)
    try:
        while True:
            data = await websocket.receive_text()
            logger.info(f"Received message from client {client_id}: {data}")
            await manager.broadcast(client_id, data)
    except WebSocketDisconnect:
        manager.disconnect(websocket, client_id)
        await manager.broadcast(client_id, json.dumps({
            'username': nickname,
            'type': 'system',
            'message': f"{nickname} has left the chat"
        }))
    except asyncio.CancelledError:
        logger.warning(f"WebSocket connection with client {client_id} was cancelled")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        logger.error(traceback.format_exc())
        await manager.broadcast(client_id, json.dumps({
            'username': nickname,
            'type': 'system',
            'message': "encountered an error"
        }))
    finally:
        if websocket.client_state == WebSocketState.CONNECTED:
            await websocket.close()

if __name__ == "__main__":
    uvicorn.run("Backend.main:app", host="0.0.0.0", port=8000, log_level="info", reload=True)