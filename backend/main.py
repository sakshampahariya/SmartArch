from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import socketio

from routes.ai import router as ai_router
from routes.boards import router as boards_router
from sockets.canvas_socket import sio

load_dotenv()

app = FastAPI(title="SmartArch Board API")
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router)
app.include_router(boards_router)


@app.get("/health")
async def health():
    return {"ok": True}
