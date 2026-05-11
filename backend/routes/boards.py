import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/boards", tags=["boards"])

# In-memory store (replace with a DB in production)
_boards: dict[str, dict] = {}


class CreateBoardRequest(BaseModel):
    name: str
    created_by: Optional[str] = "guest"


class UpdateBoardRequest(BaseModel):
    canvas_json: Optional[str] = None
    name: Optional[str] = None


@router.post("")
async def create_board(body: CreateBoardRequest):
    board_id = str(uuid.uuid4())
    board = {
        "id": board_id,
        "name": body.name,
        "created_by": body.created_by,
        "created_at": datetime.now().isoformat(),
        "canvas_json": "{}",
        "collaborators": [],
    }
    _boards[board_id] = board

    # Persist owner + default draw permission in Redis
    from services.redis_client import redis_client
    if redis_client:
        await redis_client.set(f"room:{board_id}:owner", body.created_by or "guest", ex=604800)
        await redis_client.set(f"room:{board_id}:drawperm", "everyone", ex=604800)

    return board


@router.get("")
async def list_boards():
    return list(_boards.values())


@router.get("/{board_id}")
async def get_board(board_id: str):
    board = _boards.get(board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return board


@router.patch("/{board_id}")
async def update_board(board_id: str, body: UpdateBoardRequest):
    board = _boards.get(board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    if body.canvas_json is not None:
        board["canvas_json"] = body.canvas_json
    if body.name is not None:
        board["name"] = body.name
    return board


@router.delete("/{board_id}")
async def delete_board(board_id: str):
    if board_id not in _boards:
        raise HTTPException(status_code=404, detail="Board not found")
    del _boards[board_id]
    return {"ok": True}
