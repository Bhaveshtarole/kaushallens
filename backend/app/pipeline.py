import json
import logging
import uuid
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np
import supervision as sv

from .config import settings

logger = logging.getLogger("skillguard.pipeline")

# Resolve Person Class ID (In COCO, person is class 1 or class 0)
def get_person_class_id() -> int:
    try:
        from rfdetr.assets.coco_classes import COCO_CLASSES
        if isinstance(COCO_CLASSES, dict):
            for k, v in COCO_CLASSES.items():
                if v == "person":
                    return int(k)
            return 1
        elif isinstance(COCO_CLASSES, (list, tuple)):
            return COCO_CLASSES.index("person")
        return 1
    except Exception:
        return 1


class LocalVideoAnalyzer:
    """Production video compliance pipeline implementing SkillGuard Colab logic:
    RF-DETR -> ByteTrack -> classroom zone -> camera quality -> temporal compliance rules -> evidence package.
    """

    def __init__(self) -> None:
        self.model = None
        self.person_class_id = get_person_class_id()
        self.hog_detector = None

    def _get_model(self):
        if self.model is not None:
            return self.model
        try:
            from rfdetr import RFDETRMedium
            logger.info("Loading RF-DETR Medium on %s...", settings.device)
            self.model = RFDETRMedium(device=settings.device)
            return self.model
        except Exception as exc:
            logger.warning("RF-DETR model initialization failed (%s); using OpenCV HOG detector fallback.", exc)
            return None

    def _detect_persons(self, frame_bgr: np.ndarray, frame_rgb: np.ndarray) -> sv.Detections:
        """Run RF-DETR detection with robust OpenCV HOG fallback if model unavailable."""
        model = self._get_model()
        if model is not None:
            try:
                detections = model.predict(frame_rgb, threshold=settings.confidence_threshold)
                # Filter specifically for person detections
                detections = detections[detections.class_id == self.person_class_id]
                detections = detections.with_nms(threshold=settings.nms_iou_threshold)
                return detections
            except Exception as e:
                logger.warning("RF-DETR predict error: %s, falling back to HOG", e)

        # Fallback person detector using OpenCV HOG Descriptor
        if self.hog_detector is None:
            hog = cv2.HOGDescriptor()
            hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
            self.hog_detector = hog

        gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
        boxes, weights = self.hog_detector.detectMultiScale(
            gray,
            winStride=(8, 8),
            padding=(4, 4),
            scale=1.05,
        )

        xyxy_list = []
        conf_list = []
        class_list = []

        for (x, y, w, h), weight in zip(boxes, weights):
            conf = float(weight[0]) if hasattr(weight, "__iter__") else float(weight)
            conf = min(0.95, max(0.40, conf * 0.4 + 0.45))
            if conf >= settings.confidence_threshold:
                xyxy_list.append([float(x), float(y), float(x + w), float(y + h)])
                conf_list.append(conf)
                class_list.append(self.person_class_id)

        if not xyxy_list:
            return sv.Detections.empty()

        return sv.Detections(
            xyxy=np.array(xyxy_list, dtype=np.float32),
            confidence=np.array(conf_list, dtype=np.float32),
            class_id=np.array(class_list, dtype=int),
        )

    @staticmethod
    def camera_quality(frame_bgr: np.ndarray) -> tuple[float, str, list[str], float, float]:
        """Returns visual quality score and evidence labels (exact Colab Cell 8)."""
        gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
        brightness = float(gray.mean())
        blur_variance = float(cv2.Laplacian(gray, cv2.CV_64F).var())

        flags = []
        brightness_score = min(1.0, max(0.0, brightness / 70.0))
        blur_score = min(1.0, max(0.0, blur_variance / 90.0))

        if brightness < 35:
            flags.append("dark")
        if blur_variance < 35:
            flags.append("blurred_or_obstructed")

        score = round(0.55 * brightness_score + 0.45 * blur_score, 3)
        status = "healthy" if score >= 0.70 else ("degraded" if score >= 0.45 else "unhealthy")
        return score, status, flags, round(brightness, 1), round(blur_variance, 1)

    def analyze(
        self,
        video_path: Path,
        *,
        expected_present: int,
        centre_id: str = "TC-DEMO-001",
        batch_id: str = "BATCH-DEMO-001",
        camera_id: str = "CAM-CLASSROOM-A",
        occlusion_risk: str = "high",
        generate_annotated_video: bool = True,
    ) -> dict:
        capture = cv2.VideoCapture(str(video_path))
        if not capture.isOpened():
            raise ValueError("The uploaded file could not be opened as a video.")

        fps = float(capture.get(cv2.CAP_PROP_FPS) or 25.0)
        total_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        frame_width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH) or 640)
        frame_height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT) or 352)

        # Classroom-zone polygon (Colab Cell 4 & 5)
        zone_polygon = np.array([
            [0, 0],
            [frame_width - 1, 0],
            [frame_width - 1, frame_height - 1],
            [0, frame_height - 1],
        ], dtype=np.int32)

        zone = sv.PolygonZone(
            polygon=zone_polygon,
            triggering_anchors=(sv.Position.CENTER, sv.Position.BOTTOM_CENTER),
        )
        box_annotator = sv.BoxAnnotator()
        label_annotator = sv.LabelAnnotator()

        # Initialize ByteTrack Tracker (Colab Cell 6)
        try:
            from trackers import ByteTrackTracker
            tracker = ByteTrackTracker(
                frame_rate=min(fps, 15.0),
                track_activation_threshold=settings.confidence_threshold,
            )
        except Exception:
            tracker = None

        sample_stride = max(1, int(round(fps * settings.sample_every_seconds)))
        observation_id = f"obs_{uuid.uuid4().hex[:12]}"

        annotated_dir = settings.storage_dir / "annotated"
        annotated_dir.mkdir(parents=True, exist_ok=True)
        annotated_path = annotated_dir / f"{observation_id}.mp4"

        writer = None
        if generate_annotated_video:
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            writer = cv2.VideoWriter(str(annotated_path), fourcc, min(fps, 15.0), (frame_width, frame_height))

        samples = []
        timeline = []
        seen_track_ids = set()
        frame_index = 0
        fallback_track_id = 1

        while True:
            ok, frame_bgr = capture.read()
            if not ok:
                break

            is_sample_frame = (frame_index % sample_stride == 0)

            if is_sample_frame or total_frames < 45:
                frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
                detections = self._detect_persons(frame_bgr, frame_rgb)

                # Tracker update
                if tracker is not None and len(detections) > 0:
                    try:
                        tracked = tracker.update(detections)
                        tracked = tracked[tracked.tracker_id != -1]
                    except Exception:
                        tracked = detections
                else:
                    tracked = detections

                # Zone filtering
                if len(tracked) > 0:
                    try:
                        in_zone_mask = zone.trigger(tracked)
                        in_zone = tracked[in_zone_mask] if np.any(in_zone_mask) else tracked
                    except Exception:
                        in_zone = tracked
                else:
                    in_zone = tracked

                # Track IDs
                valid_ids = []
                if hasattr(in_zone, "tracker_id") and in_zone.tracker_id is not None:
                    valid_ids = [int(tid) for tid in in_zone.tracker_id if tid != -1]
                else:
                    valid_ids = list(range(fallback_track_id, fallback_track_id + len(in_zone)))
                    fallback_track_id += len(in_zone)

                seen_track_ids.update(valid_ids)
                quality_score, quality_status, quality_flags, brightness, blur_variance = self.camera_quality(frame_bgr)

                detection_conf = float(np.mean(in_zone.confidence)) if len(in_zone) and in_zone.confidence is not None else 0.0
                time_sec = round(frame_index / fps, 2)

                # Format actual bounding boxes for frontend video canvas
                boxes = []
                if len(in_zone) > 0:
                    for i, (box_coords, conf) in enumerate(zip(in_zone.xyxy, in_zone.confidence)):
                        tid = valid_ids[i] if i < len(valid_ids) else (i + 1)
                        boxes.append({
                            "track_id": int(tid),
                            "confidence": round(float(conf), 2),
                            "box": [round(float(c), 1) for c in box_coords],
                        })

                sample_entry = {
                    "time_seconds": time_sec,
                    "visible_tracked_people": int(len(in_zone)),
                    "mean_detection_confidence": round(detection_conf, 3),
                    "camera_quality_score": quality_score,
                    "camera_quality_status": quality_status,
                    "camera_quality_flags": ", ".join(quality_flags) if quality_flags else "none",
                    "brightness": brightness,
                    "blur_variance": blur_variance,
                    "active_track_ids": ",".join(map(str, valid_ids)),
                    "boxes": boxes,
                }
                samples.append(sample_entry)
                timeline.append(sample_entry)

                # Write annotated frame
                if writer is not None and writer.isOpened():
                    labels = [f"person #{t['track_id']} {t['confidence']:.2f}" for t in boxes]
                    annotated_frame = box_annotator.annotate(scene=frame_bgr.copy(), detections=in_zone)
                    annotated_frame = label_annotator.annotate(scene=annotated_frame, detections=in_zone, labels=labels)
                    cv2.polylines(annotated_frame, [zone_polygon], isClosed=True, color=(0, 255, 255), thickness=2)
                    cv2.rectangle(annotated_frame, (8, 8), (min(535, frame_width - 10), 94), (18, 26, 44), -1)
                    cv2.putText(annotated_frame, f"Visible tracked people: {len(in_zone)}", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                    cv2.putText(annotated_frame, f"Camera quality: {quality_status}", (20, 72), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                    writer.write(annotated_frame)

            frame_index += 1

        capture.release()
        if writer is not None:
            writer.release()

        if not samples:
            raise ValueError("No frames could be sampled from the uploaded video.")

        # Colab Cell 9 & 10: Aggregate observations into time windows & apply conservative compliance rules
        window_seconds = settings.window_seconds
        counts = [s["visible_tracked_people"] for s in samples]
        confidences = [s["mean_detection_confidence"] for s in samples]
        qualities = [s["camera_quality_score"] for s in samples]

        observed_median = round(float(np.median(counts)), 1)
        observed_mean = round(float(np.mean(counts)), 1)
        observed_max = int(np.max(counts))
        observed_min = int(np.min(counts))

        count_stability = round(float(np.clip(
            1 - ((observed_max - observed_min) / max(observed_median, 1.0)),
            0.0,
            1.0,
        )), 3)

        # Build window groups
        window_dict = defaultdict(list)
        for s in samples:
            w_id = int(s["time_seconds"] // window_seconds)
            window_dict[w_id].append(s)

        windows = []
        events = []
        tolerance = max(settings.tolerance_min_people, round(expected_present * settings.tolerance_percent))

        for w_id, w_samples in sorted(window_dict.items()):
            w_counts = [ws["visible_tracked_people"] for ws in w_samples]
            w_confs = [ws["mean_detection_confidence"] for ws in w_samples]
            w_quals = [ws["camera_quality_score"] for ws in w_samples]

            w_med = round(float(np.median(w_counts)), 1)
            w_mean = round(float(np.mean(w_counts)), 1)
            w_max = int(np.max(w_counts))
            w_min = int(np.min(w_counts))
            w_conf = round(float(np.mean(w_confs)), 3)
            w_qual = round(float(np.mean(w_quals)), 3)
            w_stab = round(float(np.clip(1 - ((w_max - w_min) / max(w_med, 1.0)), 0.0, 1.0)), 3)

            # Classify window according to Colab Cell 9
            if w_qual < 0.55:
                w_status = "CAMERA_UNHEALTHY"
                w_reason = "Camera quality is too low for occupancy verification."
            else:
                below_expected = w_med < expected_present * (1.0 - settings.tolerance_percent)
                reliable = (w_conf >= 0.60 and w_stab >= 0.65 and occlusion_risk != "high")
                if below_expected and reliable:
                    w_status = "POTENTIAL_ATTENDANCE_DISCREPANCY"
                    w_reason = "Persistent observed occupancy is materially below reported attendance with adequate visual confidence."
                elif below_expected:
                    w_status = "UNVERIFIABLE"
                    w_reason = "Observed count is below threshold, but crowding/occlusion or low stability makes the result non-defensible."
                else:
                    w_status = "COMPLIANT"
                    w_reason = "Observed occupancy is within configured tolerance."

            start_t = min(ws["time_seconds"] for ws in w_samples)
            end_t = max(ws["time_seconds"] for ws in w_samples)

            win_record = {
                "window_id": w_id,
                "start_time_seconds": start_t,
                "end_time_seconds": end_t,
                "observed_median": w_med,
                "observed_mean": w_mean,
                "observed_min": w_min,
                "observed_max": w_max,
                "detection_confidence": w_conf,
                "camera_quality_score": w_qual,
                "count_stability": w_stab,
                "reported_attendance": expected_present,
                "compliance_status": w_status,
                "reason": w_reason,
            }
            windows.append(win_record)

            # Colab Cell 10: Build event records for non-compliant windows
            if w_status != "COMPLIANT":
                event_id = f"EVT-{centre_id}-{w_id:04d}"
                events.append({
                    "event_id": event_id,
                    "event_type": w_status.lower(),
                    "centre_id": centre_id,
                    "camera_id": camera_id,
                    "batch_id": batch_id,
                    "window_start_seconds": start_t,
                    "window_end_seconds": end_t,
                    "reported_attendance": expected_present,
                    "observed_median_visible_people": w_med,
                    "camera_quality_score": w_qual,
                    "detection_confidence": w_conf,
                    "count_stability": w_stab,
                    "occlusion_risk": occlusion_risk,
                    "reason": w_reason,
                    "review_required": True,
                    "generated_at_utc": datetime.now(timezone.utc).isoformat(),
                })

        # Overall Run Decision
        overall_qual = round(float(np.mean(qualities)), 3)
        overall_conf = round(float(np.mean(confidences)), 3)
        discrepancy = round(expected_present - observed_median, 1)

        if overall_qual < 0.55:
            overall_status = "CAMERA_UNHEALTHY"
            overall_reason = "Camera quality is too low for occupancy verification."
        elif discrepancy <= 0:
            overall_status = "NO_DEFICIT_DETECTED"
            overall_reason = "Observed occupancy meets or exceeds the biometric expected count."
        elif discrepancy <= tolerance:
            overall_status = "WITHIN_CAMERA_TOLERANCE"
            overall_reason = "The small gap is within the configured camera-count tolerance."
        elif occlusion_risk == "high" or count_stability < 0.65 or overall_conf < 0.60:
            overall_status = "UNVERIFIABLE"
            overall_reason = "Observed count is below threshold, but crowding/occlusion or low stability makes the result non-defensible."
        else:
            overall_status = "POTENTIAL_ATTENDANCE_DISCREPANCY"
            overall_reason = "Persistent observed occupancy is materially below reported attendance with adequate visual confidence."

        run_package = {
            "run_metadata": {
                "centre_id": centre_id,
                "camera_id": camera_id,
                "batch_id": batch_id,
                "reported_attendance": expected_present,
                "occlusion_risk": occlusion_risk,
                "model": "RFDETRMedium",
                "tracker": "ByteTrackTracker",
                "privacy_mode": "aggregate occupancy; no facial identification",
            },
            "events": events,
        }

        result = {
            "observation_id": observation_id,
            "centre_id": centre_id,
            "batch_id": batch_id,
            "camera_id": camera_id,
            "video": {
                "filename": video_path.name,
                "fps": round(fps, 2),
                "total_frames": total_frames,
                "resolution": f"{frame_width}x{frame_height}",
                "duration_seconds": round(total_frames / fps, 2) if fps > 0 else 0,
            },
            "summary": {
                "expected_present": expected_present,
                "observed_median": observed_median,
                "observed_mean": observed_mean,
                "observed_min": observed_min,
                "observed_max": observed_max,
                "sample_count": len(samples),
                "detection_confidence": overall_conf,
                "camera_quality_score": overall_qual,
                "count_stability": count_stability,
                "occlusion_risk": occlusion_risk,
                "unique_tracks": len(seen_track_ids),
            },
            "decision": {
                "status": overall_status,
                "reason": overall_reason,
                "discrepancy": discrepancy,
                "tolerance_people": tolerance,
            },
            "windows": windows,
            "events": events,
            "run_package": run_package,
            "samples": samples,
            "timeline": timeline,
            "annotated_video_url": f"/v1/analysis/video/{observation_id}/annotated",
        }

        result_dir = settings.storage_dir / "results"
        result_dir.mkdir(parents=True, exist_ok=True)
        (result_dir / f"{observation_id}.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
        return result


analyzer = LocalVideoAnalyzer()
