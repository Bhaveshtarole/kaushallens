from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="SKILLGUARD_", extra="ignore")

    device: str = "cpu"
    confidence_threshold: float = 0.35
    nms_iou_threshold: float = 0.70
    sample_every_seconds: float = 0.5
    window_seconds: int = 10
    tolerance_percent: float = 0.20
    tolerance_min_people: int = 2
    storage_dir: Path = Path("storage")
    allowed_origins: str = "*"

    @property
    def origins(self) -> list[str]:
        if self.allowed_origins.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


settings = Settings()
