import json

import socketio

from services.redis_client import redis_client

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")


@sio.event
async def connect(sid, environ):
    _ = environ
    print(f"Client connected: {sid}")


@sio.event
async def room_join(sid, data):
    room_id = data.get("roomId")
    user = data.get("user", {})

    if not room_id:
        return

    await sio.enter_room(sid, room_id)

    if redis_client is not None:
        await redis_client.setex(
            f"room:{room_id}:user:{user.get('id', sid)}", 86400, json.dumps(user)
        )

    # Send existing canvas state back to the joining user if cached
    if redis_client is not None:
        canvas_key = f"room:{room_id}:canvas"
        cached = await redis_client.get(canvas_key)
        if cached:
            await sio.emit("canvas:state", {"canvasJSON": cached}, to=sid)

    await sio.emit("user:joined", user, room=room_id, skip_sid=sid)


@sio.event
async def object_updated(sid, data):
    room_id = data.get("roomId")
    if not room_id:
        return
    await sio.emit("object:updated", data, room=room_id, skip_sid=sid)


@sio.event
async def canvas_saved(sid, data):
    """Persist full canvas JSON snapshot (debounced from client)."""
    room_id = data.get("roomId")
    canvas_json = data.get("canvasJSON", "{}")
    if room_id and redis_client is not None:
        await redis_client.setex(f"room:{room_id}:canvas", 86400, canvas_json)


@sio.event
async def cursor_moved(sid, data):
    room_id = data.get("roomId")
    if not room_id:
        return
    await sio.emit("cursor:moved", data, room=room_id, skip_sid=sid)


@sio.event
async def disconnect(sid):
    await sio.emit("user:left", {"socketId": sid})
