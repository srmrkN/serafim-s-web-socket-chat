import pytest
from fastapi.testclient import TestClient
from websockets import connect
import asyncio
import sys
import os
import threading
import uvicorn
import time

# Добавляем путь к директории, в которой находится main.py
sys.path.append(os.path.join(os.path.dirname(__file__), '../Backend'))

from main import app

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def run_server():
    config = uvicorn.Config(app, host="127.0.0.1", port=8000, log_level="info")
    server = uvicorn.Server(config)
    thread = threading.Thread(target=server.run)
    thread.start()
    time.sleep(2)  # Добавляем задержку для запуска сервера
    yield
    server.should_exit = True
    thread.join()

@pytest.mark.asyncio
async def test_websocket_connection():
    async with connect("ws://127.0.0.1:8000/ws/1/testuser") as websocket:
        await websocket.send("Hello, World!")
        response = await websocket.recv()
        assert "testuser: Hello, World!" in response

@pytest.mark.asyncio
async def test_websocket_broadcast():
    async with connect("ws://127.0.0.1:8000/ws/1/user1") as websocket1:
        async with connect("ws://127.0.0.1:8000/ws/2/user2") as websocket2:
            await websocket1.send("Hello from user1")
            response1 = await websocket1.recv()
            response2 = await websocket2.recv()
            assert "user1: Hello from user1" in response1
            assert "user1: Hello from user1" in response2