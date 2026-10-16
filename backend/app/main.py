import shutil
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from .attendance import add_events, calculate_expected
from .config import settings
from .compliance import reconcile
from .pipeline import analyzer
from .schemas import BiometricEvent, ReconciliationRequest

settings.storage_dir.mkdir(parents=True, exist_ok=True)
app = FastAPI(title="SkillGuard Local AI", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "device": settings.device, "service": "skillguard-local-ai"}


@app.post("/v1/attendance/events")
def import_attendance(events: list[BiometricEvent]):
    return {"accepted": add_events(events), "received": len(events)}


@app.get("/v1/attendance/{centre_id}/{batch_id}")
def attendance_snapshot(centre_id: str, batch_id: str):
    return calculate_expected(centre_id, batch_id)


@app.post("/v1/reconciliation")
def reconcile_counts(request: ReconciliationRequest):
    return reconcile(request)


@app.post("/v1/analysis/video")
async def analyze_video(
    video: UploadFile = File(...),
    centre_id: str = Form(...),
    batch_id: str = Form(...),
    expected_present: int = Form(..., ge=0),
    occlusion_risk: str = Form("medium", pattern="^(low|medium|high)$"),
):
    if not (video.content_type or "").startswith("video/"):
        raise HTTPException(status_code=415, detail="Upload a video file.")
    suffix = Path(video.filename or "upload.mp4").suffix or ".mp4"
    upload_dir = settings.storage_dir / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)
    target = upload_dir / f"{uuid.uuid4().hex}{suffix}"
    try:
        with target.open("wb") as destination:
            shutil.copyfileobj(video.file, destination)
        return analyzer.analyze(
            target,
            expected_present=expected_present,
            centre_id=centre_id,
            batch_id=batch_id,
            occlusion_risk=occlusion_risk,
        )
    except (ValueError, RuntimeError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    finally:
        await video.close()


@app.get("/v1/analysis/video/{observation_id}/annotated")
def get_annotated_video(observation_id: str):
    video_path = settings.storage_dir / "annotated" / f"{observation_id}.mp4"
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Annotated video not found")
    return FileResponse(str(video_path), media_type="video/mp4", filename=f"{observation_id}_annotated.mp4")


@app.get("/v1/analysis/video/{observation_id}/package")
def get_run_package(observation_id: str):
    json_path = settings.storage_dir / "results" / f"{observation_id}.json"
    if not json_path.exists():
        raise HTTPException(status_code=404, detail="Run package not found")
    return FileResponse(str(json_path), media_type="application/json", filename="skillguard_event_package.json")
