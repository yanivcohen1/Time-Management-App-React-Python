from typing import Optional
from datetime import datetime
from enum import Enum
from beanie import Document, Link, Indexed
from pydantic import EmailStr, Field

class Role(str, Enum):
    """User roles."""
    USER = "user"
    ADMIN = "admin"

class Status(str, Enum):
    """Todo status."""
    BACKLOG = "BACKLOG"
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

# pylint: disable=too-many-ancestors
class User(Document):
    """User model."""
    email: Indexed(EmailStr, unique=True)  # type: ignore
    password_hash: str
    full_name: str
    role: Role = Role.USER

    class Settings:
        """Beanie settings."""
        # pylint: disable=too-few-public-methods
        name = "users"

class Todo(Document):
    """Todo model."""
    title: str
    description: Optional[str] = None
    status: Status = Status.BACKLOG
    duration: Optional[str] = None
    due_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    user: Link[User]
    class Settings:
        """Beanie settings."""
        # pylint: disable=too-few-public-methods
        name = "todos"
