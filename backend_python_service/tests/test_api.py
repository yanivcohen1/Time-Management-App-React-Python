# pylint: disable=redefined-outer-name, unused-argument
"""
Integration tests for the API endpoints.
"""
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.models import User, Role
from app.auth import create_access_token, get_password_hash

@pytest.fixture
async def client(test_db):
    """Create an async client for the app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest.fixture
async def test_user():
    """Create a test user."""
    user = User(
        email="test@example.com",
        password_hash=get_password_hash("password"),
        full_name="Test User",
        role=Role.USER
    )
    await user.create()
    return user

@pytest.fixture
def token(test_user):
    """Create an access token for the test user."""
    return create_access_token({"sub": test_user.email, "role": test_user.role})

@pytest.mark.asyncio
async def test_create_todo(client, token):
    """Test creating a new todo."""
    response = await client.post(
        "/todos/",
        json={"title": "Test Todo", "status": "BACKLOG"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Test Todo"

@pytest.mark.asyncio
async def test_get_todos(client, token):
    """Test retrieving todos."""
    response = await client.get(
        "/todos/",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert "items" in response.json()
