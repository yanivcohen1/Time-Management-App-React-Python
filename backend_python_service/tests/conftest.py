"""
Pytest configuration and compatibility patches.
"""
import asyncio

# Monkeypatch asyncio.coroutine for motor 2.5.1 compatibility with Python 3.14
if not hasattr(asyncio, 'coroutine'):
    def coroutine(func):
        """Mock asyncio.coroutine for compatibility."""
        return func
    asyncio.coroutine = coroutine

# pylint: disable=wrong-import-position
import pytest
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.models import User, Todo
# pylint: enable=wrong-import-position

@pytest.fixture
async def test_db():
    """Initialize the test database."""
    client = AsyncIOMotorClient("mongodb://localhost:27017/react-py-todo-app-test")
    await init_beanie(database=client.get_default_database(), document_models=[User, Todo])
    yield
    await client.drop_database("react-py-todo-app-test")
