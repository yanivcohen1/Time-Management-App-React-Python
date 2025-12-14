"""
Test to list all users in the database.
"""
# pylint: disable=duplicate-code, unused-argument
import pytest
from app.models import User, Role

@pytest.mark.asyncio
async def test_check_users(test_db):
    """Test listing all users."""
    # Create a test user first
    user = User(
        email="check@example.com",
        password_hash="hash",
        full_name="Check User",
        role=Role.USER
    )
    await user.create()

    users = await User.find_all().to_list()
    print(f"Found {len(users)} users:")
    for u in users:
        print(f" - {u.email} (Role: {u.role})")

    assert len(users) == 1
    assert users[0].email == "check@example.com"
