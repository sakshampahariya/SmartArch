import json
import os
import random
import time

import socketio
from supabase import create_client

from services.redis_client import redis_client

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")

COLORS = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"]

# Supabase client for persistent storage
_supabase_url = os.getenv("SUPABASE_URL")
_supabase_key = os.getenv("SUPABASE_KEY")
supabase = create_client(_supabase_url, _supabase_key) if _supabase_url and _supabase_key else None


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

    if not room_id:
        return

    await sio.enter_room(sid, room_id)
    _sid_map[sid] = {"roomId": room_id, "userId": user_id}

    color = random.choice(COLORS)

    # ── Determine role from Supabase (board owner = creator) ──────────────────
    role = "collaborator"
    if supabase:
        try:
            result = supabase.table("boards").select("created_by").eq("id", room_id).single().execute()
            if result.data and result.data.get("created_by") == user_id:
                role = "owner"
        except Exception as e:
            print(f"[room_join] Supabase lookup error: {e}")

    user = {
        "userId": user_id,
        "name": name,
        "color": color,
        "role": role,
        "cursor": {"x": 0, "y": 0},
        "isOnline": True,
        "joinedAt": time.time(),
    }

    draw_perm = "everyone"
    canvas_json = "{}"

    if redis_client:
        # Restore color if returning user
        existing_raw = await redis_client.hget(_room_key(room_id), user_id)
        if existing_raw:
            existing = json.loads(existing_raw)
            user["color"] = existing.get("color", color)

        # Store draw perm
        stored_perm = await redis_client.get(_perm_key(room_id))
        if stored_perm:
            draw_perm = stored_perm
        elif role == "owner":
            await redis_client.set(_perm_key(room_id), "everyone", ex=604800)

        await redis_client.hset(_room_key(room_id), user_id, json.dumps(user))
        await redis_client.expire(_room_key(room_id), 86400)

        # Try Redis cache first, then fall back to Supabase
        canvas_json = await redis_client.get(_canvas_key(room_id)) or "{}"

    # If canvas not in Redis, load from Supabase
    if canvas_json == "{}" and supabase:
        try:
            result = supabase.table("boards").select("canvas_json").eq("id", room_id).single().execute()
            if result.data and result.data.get("canvas_json"):
                saved = result.data["canvas_json"]
                canvas_json = json.dumps(saved) if isinstance(saved, dict) else saved
                # Warm Redis cache
                if redis_client:
                    await redis_client.setex(_canvas_key(room_id), 86400, canvas_json)
        except Exception as e:
            print(f"[room_join] Canvas load error: {e}")

    # Build full user list from Redis
    all_users = [user]
    if redis_client:
        all_users_raw = await redis_client.hgetall(_room_key(room_id))
        all_users = [json.loads(v) for v in all_users_raw.values()]

    await sio.emit("room:state", {
        "users": all_users,
        "drawPermission": draw_perm,
        "canvasJSON": canvas_json,
        "myRole": user["role"],
        "myColor": user["color"],
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
    """Called by the owner's client to persist the full canvas state."""
    room_id = data.get("roomId")
    canvas_json = data.get("canvasJSON", "{}")

    if not room_id:
        return

    # Always cache in Redis for fast real-time access
    if redis_client:
        await redis_client.setex(_canvas_key(room_id), 86400, canvas_json)

    # Persist to Supabase for permanent storage
    if supabase:
        try:
            parsed = json.loads(canvas_json) if isinstance(canvas_json, str) else canvas_json
            supabase.table("boards").update({"canvas_json": parsed}).eq("id", room_id).execute()
            print(f"[canvas_saved] Board {room_id} saved to Supabase ✓")
        except Exception as e:
            print(f"[canvas_saved] Supabase save error: {e}")


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

    if not room_id:
        return

    # Verify ownership via Supabase
    is_owner = False
    if supabase:
        try:
            result = supabase.table("boards").select("created_by").eq("id", room_id).single().execute()
            is_owner = result.data and result.data.get("created_by") == user_id
        except Exception:
            pass

    if not is_owner:
        await sio.emit("error:unauthorized", {"message": "Only owner can change permissions"}, to=sid)
        return

    if redis_client:
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

    # Verify ownership
    is_owner = False
    if supabase:
        try:
            result = supabase.table("boards").select("created_by").eq("id", room_id).single().execute()
            is_owner = result.data and result.data.get("created_by") == requester_id
        except Exception:
            pass

    if not is_owner:
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
