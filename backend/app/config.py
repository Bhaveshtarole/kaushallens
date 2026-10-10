from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="SKILLGUARD_", extra="ignore")

    device: str = "cpu"
    confidence_threshold: float = 0.45
    nms_iou_threshold: float = 0.50
    sample_every_seconds: float = 1.0
    window_seconds: int = 10
    tolerance_percent: float = 0.15
    tolerance_min_people: int = 2
    storage_dir: Path = Path("storage")
    allowed_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    @property
    def origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


settings = Settings()
