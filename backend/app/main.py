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
    ctype = (video.content_type or "").lower()
    fname = (video.filename or "").lower()
    is_video = ctype.startswith("video/") or ctype in ["application/octet-stream", "binary/octet-stream", ""] or any(fname.endswith(ext) for ext in [".mp4", ".mkv", ".avi", ".mov", ".webm"])
    if not is_video:
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


@app.post("/v1/analysis/frame")
async def analyze_frame(
    frame: UploadFile = File(...),
    centre_id: str = Form("TC-LIVE-001"),
    batch_id: str = Form("BATCH-LIVE-001"),
    expected_present: int = Form(1),
):
    try:
        raw_bytes = await frame.read()
        import cv2
        import numpy as np
        from datetime import timezone

        nparr = np.frombuffer(raw_bytes, np.uint8)
        frame_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame_bgr is None:
            raise HTTPException(status_code=400, detail="Invalid image frame uploaded.")

        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        all_boxes = analyzer._detect_objects_and_persons(frame_bgr, frame_rgb, time_sec=0.0)
        q_score, q_status, flags, brightness, blur_var = analyzer.camera_quality(frame_bgr)

        person_boxes = [b for b in all_boxes if b.get("category") == "person"]
        object_boxes = [b for b in all_boxes if b.get("category") == "object"]

        h, w = frame_bgr.shape[:2]

        return {
            "status": "success",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "centre_id": centre_id,
            "batch_id": batch_id,
            "people_count": len(person_boxes),
            "object_count": len(object_boxes),
            "expected_present": expected_present,
            "boxes": all_boxes,
            "camera_quality": {
                "score": q_score,
                "status": q_status,
                "flags": flags,
                "brightness": brightness,
                "blur_variance": blur_var,
            },
            "frame_width": int(w),
            "frame_height": int(h),
        }
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    finally:
        await frame.close()


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
