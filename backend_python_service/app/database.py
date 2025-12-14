from motor.motor_asyncio import AsyncIOMotorClient  # type: ignore
from beanie import init_beanie
from app.models import User, Todo
from app.config import settings

async def init_db():
    client = AsyncIOMotorClient(settings.ConnectionStrings.MongoConnection)
    # The connection string usually includes the db name, but motor might not select it by default
    # if not specified in a certain way.
    # However, client.get_default_database() works if the URI has the db name.
    # The config has "mongodb://localhost:27017/react-py-todo-app"
    await init_beanie(database=client.get_default_database(), document_models=[User, Todo])
