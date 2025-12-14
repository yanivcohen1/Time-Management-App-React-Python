import os
from typing import List
import yaml
from pydantic import BaseModel

class JwtSettings(BaseModel):
    """JWT configuration settings."""
    Key: str
    TimeoutMinutes: int

class ConnectionStringsSettings(BaseModel):
    """Database connection strings."""
    MongoConnection: str

class ServerSettings(BaseModel):
    """Server configuration settings."""
    Urls: str

class CorsSettings(BaseModel):
    """CORS configuration settings."""
    AllowedOrigins: str

    @property
    def allowed_origins_list(self) -> List[str]:
        return self.AllowedOrigins.split(",")

class Settings(BaseModel):
    """Application settings."""
    Jwt: JwtSettings
    ConnectionStrings: ConnectionStringsSettings
    Server: ServerSettings
    Cors: CorsSettings

def load_settings() -> Settings:
    env = os.getenv("ENV", "dev")
    # Adjust path to be relative to the root of the server directory where main.py usually runs
    # or absolute path. Assuming running from server root.
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    config_file = os.path.join(base_path, f"config.{env}.yaml")

    with open(config_file, "r", encoding="utf-8") as f:
        config_data = yaml.safe_load(f)

    return Settings(**config_data)

settings = load_settings()
