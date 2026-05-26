from pydantic_settings import BaseSettings  # pydantic-settings
from pydantic import AnyHttpUrl, field_validator
from typing import List


class Settings(BaseSettings):
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_HOURS: int = 8

    # Database
    DB_NAME: str = "zeiterfassung.db"

    # CORS
    ALLOWED_ORIGINS: List[AnyHttpUrl] = []

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def split_origins(cls, v):
        """
        Erlaubt ALLOWED_ORIGINS="http://localhost:5500,http://127.0.0.1:5500"
        in der .env, wird zu einer Liste geparst.
        """
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()