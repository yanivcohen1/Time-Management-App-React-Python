from typing import Optional
from datetime import datetime
from beanie import PydanticObjectId
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from app.models import Todo, User, Status
from app.auth import get_current_user

router = APIRouter(prefix="/todos", tags=["todos"])

class TodoCreate(BaseModel):
    """Todo creation model."""
    title: str
    description: Optional[str] = None
    status: Status = Status.BACKLOG
    due_date: Optional[datetime] = None
    duration: Optional[str] = None

class TodoUpdate(BaseModel):
    """Todo update model."""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[Status] = None
    due_date: Optional[datetime] = None
    duration: Optional[str] = None

# pylint: disable=too-many-arguments, too-many-positional-arguments
@router.get("/", response_model=dict)
async def get_todos(
    page: int = 1,
    size: int = 10,
    sort_by: str = "created_at",
    sort_desc: bool = True,
    status: Optional[Status] = None,
    search: Optional[str] = None,
    due_date_start: Optional[datetime] = None,
    due_date_end: Optional[datetime] = None,
    user_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    if user_id and current_user.role == "admin":
        query = Todo.find(Todo.user.id == PydanticObjectId(user_id))  # type: ignore
    else:
        query = Todo.find(Todo.user.id == current_user.id)  # type: ignore

    if status:
        query = query.find(Todo.status == status)

    if search:
        query = query.find({"title": {"$regex": search, "$options": "i"}})

    if due_date_start:
        query = query.find(Todo.due_date >= due_date_start)  # type: ignore

    if due_date_end:
        # If the time is midnight, assume it's a date filter and include the whole day
        if due_date_end.time() == datetime.min.time():
            due_date_end = due_date_end.replace(hour=23, minute=59, second=59, microsecond=999999)
        query = query.find(Todo.due_date <= due_date_end)  # type: ignore

    total = await query.count()

    sort_field = f"-{sort_by}" if sort_desc else sort_by
    todos = await query.sort(sort_field).skip((page - 1) * size).limit(size).to_list()

    return {
        "items": todos,
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size
    }

@router.get("/stats/status")
async def get_status_stats(current_user: User = Depends(get_current_user)):
    pipeline = [
        {"$match": {"user.$id": current_user.id}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    stats = await Todo.aggregate(pipeline).to_list()
    # Ensure all statuses are present
    result = {s.value: 0 for s in Status}
    for s in stats:
        if s["_id"] in result:
            result[s["_id"]] = s["count"]
    return result

@router.get("/stats/workload")
async def get_workload_stats(current_user: User = Depends(get_current_user)):
    pipeline = [
        {"$match": {"user.$id": current_user.id, "due_date": {"$ne": None}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$due_date"}},
            "total": {"$sum": 1},
            "backlog": {"$sum": {"$cond": [{"$eq": ["$status", "BACKLOG"]}, 1, 0]}},
            "pending": {"$sum": {"$cond": [{"$eq": ["$status", "PENDING"]}, 1, 0]}},
            "in_progress": {"$sum": {"$cond": [{"$eq": ["$status", "IN_PROGRESS"]}, 1, 0]}},
            "completed": {"$sum": {"$cond": [{"$eq": ["$status", "COMPLETED"]}, 1, 0]}}
        }},
        {"$sort": {"_id": 1}}
    ]
    stats = await Todo.aggregate(pipeline).to_list()
    return stats

@router.post("/", response_model=Todo)
async def create_todo(todo_in: TodoCreate, current_user: User = Depends(get_current_user)):
    todo = Todo(**todo_in.dict(), user=current_user)
    await todo.create()
    return todo

@router.put("/{id}", response_model=Todo)
async def update_todo(
    id: PydanticObjectId, todo_in: TodoUpdate, current_user: User = Depends(get_current_user)
):
    todo = await Todo.find_one(Todo.id == id, Todo.user.id == current_user.id)  # type: ignore
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    update_data = todo_in.dict(exclude_unset=True)
    await todo.update({"$set": update_data})
    return todo

@router.delete("/{id}")
async def delete_todo(id: PydanticObjectId, current_user: User = Depends(get_current_user)):
    todo = await Todo.find_one(Todo.id == id, Todo.user.id == current_user.id)  # type: ignore
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    await todo.delete()
    return {"message": "Todo deleted"}
