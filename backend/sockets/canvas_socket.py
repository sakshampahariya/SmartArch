import json
import random

import socketio

from services.redis_client import redis_client

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")

COLORS = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"]


def _room_key(room_id: str) -> str:
    return f"room:{room_id}:users"


def _owner_key(room_id: str) -> str:
    return f"room:{room_id}:owner"


def _perm_key(room_id: str) -> str:
    return f"room:{room_id}:drawperm"


def _canvas_key(room_id: str) -> str:
    return f"room:{room_id}:canvas"


# sid → {roomId, userId} mapping (in-memory for disconnect handling)
_sid_map: dict[str, dict] = {}


@sio.event
async def connect(sid, environ):
    _ = environ
    print(f"[connect] {sid}")


# ── JOIN ROOM ──────────────────────────────────────────────────────────────────
@sio.event
async def room_join(sid, data):
    room_id = data.get("roomId")
    user_id = data.get("userId") or sid
    name = data.get("name", "Anonymous")
    role = data.get("role", "collaborator")

    if not room_id:
        return

    await sio.enter_room(sid, room_id)
    _sid_map[sid] = {"roomId": room_id, "userId": user_id}

    color = random.choice(COLORS)

    user = {
        "userId": user_id,
        "name": name,
        "color": color,
        "role": role,
        "cursor": {"x": 0, "y": 0},
        "isOnline": True,
        "joinedAt": __import__("time").time(),
    }

    if redis_client:
        # If owner key not set yet, this user is the owner
        owner = await redis_client.get(_owner_key(room_id))
        if not owner:
            await redis_client.set(_owner_key(room_id), user_id, ex=604800)
            await redis_client.set(_perm_key(room_id), "everyone", ex=604800)
            role = "owner"
            user["role"] = "owner"

        # Restore role if re-joining
        existing_raw = await redis_client.hget(_room_key(room_id), user_id)
        if existing_raw:
            existing = json.loads(existing_raw)
            user["role"] = existing.get("role", role)
            user["color"] = existing.get("color", color)

        await redis_client.hset(_room_key(room_id), user_id, json.dumps(user))
        await redis_client.expire(_room_key(room_id), 86400)

        # Send full room state to the joining user
        all_users_raw = await redis_client.hgetall(_room_key(room_id))
        all_users = [json.loads(v) for v in all_users_raw.values()]
        draw_perm = await redis_client.get(_perm_key(room_id)) or "everyone"
        canvas_json = await redis_client.get(_canvas_key(room_id))

        await sio.emit("room:state", {
            "users": all_users,
            "drawPermission": draw_perm,
            "canvasJSON": canvas_json or "{}",
            "myRole": user["role"],
            "myColor": user["color"],
        }, to=sid)
    else:
        # Fallback (no Redis): just confirm join
        await sio.emit("room:state", {
            "users": [user],
            "drawPermission": "everyone",
            "canvasJSON": "{}",
            "myRole": role,
            "myColor": color,
        }, to=sid)

    # Notify other room members
    await sio.emit("user:joined", user, room=room_id, skip_sid=sid)
    print(f"[room:join] {name} ({user['role']}) joined room {room_id}")


# ── CANVAS SYNC ────────────────────────────────────────────────────────────────
@sio.event
async def object_updated(sid, data):
    room_id = data.get("roomId")
    if room_id:
        await sio.emit("object:updated", data, room=room_id, skip_sid=sid)


@sio.event
async def object_added(sid, data):
    room_id = data.get("roomId")
    if room_id:
        await sio.emit("object:added", data, room=room_id, skip_sid=sid)


@sio.event
async def object_removed(sid, data):
    room_id = data.get("roomId")
    if room_id:
        await sio.emit("object:removed", data, room=room_id, skip_sid=sid)


@sio.event
async def canvas_saved(sid, data):
    room_id = data.get("roomId")
    canvas_json = data.get("canvasJSON", "{}")
    if room_id and redis_client:
        await redis_client.setex(_canvas_key(room_id), 86400, canvas_json)


# ── CURSOR ────────────────────────────────────────────────────────────────────
@sio.event
async def cursor_moved(sid, data):
    room_id = data.get("roomId")
    if room_id:
        await sio.emit("cursor:moved", data, room=room_id, skip_sid=sid)


# ── PERMISSION CHANGE (owner only) ───────────────────────────────────────────
@sio.event
async def permission_change(sid, data):
    room_id = data.get("roomId")
    user_id = data.get("userId")
    draw_perm = data.get("drawPermission", "everyone")

    if not room_id or not redis_client:
        return

    owner = await redis_client.get(_owner_key(room_id))
    if owner != user_id:
        await sio.emit("error:unauthorized", {"message": "Only owner can change permissions"}, to=sid)
        return

    await redis_client.set(_perm_key(room_id), draw_perm, ex=604800)
    await sio.emit("permission:changed", {"drawPermission": draw_perm}, room=room_id)
    print(f"[permission] Room {room_id} → {draw_perm}")


# ── ROLE CHANGE (owner grants/revokes collaborator) ───────────────────────────
@sio.event
async def role_change(sid, data):
    room_id = data.get("roomId")
    requester_id = data.get("requesterId")
    target_user_id = data.get("targetUserId")
    new_role = data.get("newRole", "viewer")

    if not room_id or not redis_client:
        return

    owner = await redis_client.get(_owner_key(room_id))
    if owner != requester_id:
        return

    user_raw = await redis_client.hget(_room_key(room_id), target_user_id)
    if not user_raw:
        return

    user = json.loads(user_raw)
    user["role"] = new_role
    await redis_client.hset(_room_key(room_id), target_user_id, json.dumps(user))
    await sio.emit("role:changed", {"userId": target_user_id, "newRole": new_role}, room=room_id)


# ── DISCONNECT ────────────────────────────────────────────────────────────────
@sio.event
async def disconnect(sid):
    ctx = _sid_map.pop(sid, None)
    if not ctx:
        return

    room_id = ctx.get("roomId")
    user_id = ctx.get("userId")

    if room_id and user_id and redis_client:
        user_raw = await redis_client.hget(_room_key(room_id), user_id)
        if user_raw:
            user = json.loads(user_raw)
            user["isOnline"] = False
            await redis_client.hset(_room_key(room_id), user_id, json.dumps(user))

    if room_id:
        await sio.emit("user:left", {"userId": user_id}, room=room_id)
    print(f"[disconnect] {user_id} left room {room_id}")
