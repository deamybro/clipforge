import os
import uuid
import subprocess
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, storage
import json
from urllib.parse import urlparse

app = FastAPI(title="ClipForge Downloader", version="1.0.0")

# Initialize Firebase Admin using the service account JSON from env
service_account_info = json.loads(os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON", "{}"))
if service_account_info:
    cred = credentials.Certificate(service_account_info)
    firebase_admin.initialize_app(cred, {
        "storageBucket": service_account_info.get("project_id", "") + ".appspot.com"
    })

RAILWAY_SECRET = os.environ.get("RAILWAY_DOWNLOADER_SECRET", "")

SUPPORTED_DOMAINS = [
    "youtube.com", "youtu.be",
    "tiktok.com",
    "instagram.com",
    "twitter.com", "x.com",
    "facebook.com", "fb.watch"
]


class DownloadRequest(BaseModel):
    url: str
    user_id: str


def is_supported_url(value: str) -> bool:
    try:
        hostname = (urlparse(value).hostname or "").lower()
        return any(
            hostname == domain or hostname.endswith("." + domain)
            for domain in SUPPORTED_DOMAINS
        )
    except ValueError:
        return False


@app.post("/download")
async def download_video(
    request: DownloadRequest,
    x_secret: str = Header(None)
):
    # Authenticate the request
    if x_secret != RAILWAY_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized.")

    # Whitelist check
    if not is_supported_url(request.url):
        raise HTTPException(status_code=400, detail="Unsupported platform.")

    output_path = f"/tmp/{uuid.uuid4()}.mp4"

    try:
        result = subprocess.run([
            "yt-dlp",
            "--format", "bestvideo[height<=1080]+bestaudio/best[height<=1080]",
            "--merge-output-format", "mp4",
            "--match-filter", "duration <= 10800",
            "--no-playlist",
            "-o", output_path,
            request.url
        ], capture_output=True, text=True, timeout=600)

        if result.returncode != 0:
            error_msg = result.stderr.lower()
            if "private" in error_msg or "login" in error_msg:
                raise HTTPException(
                    status_code=403,
                    detail="This video is private or requires a login. Try a different link."
                )
            if "age" in error_msg:
                raise HTTPException(
                    status_code=403,
                    detail="This video is age-restricted and cannot be downloaded."
                )
            if "not available" in error_msg or "unavailable" in error_msg:
                raise HTTPException(
                    status_code=404,
                    detail="Video not found or unavailable. Check the link and try again."
                )
            raise HTTPException(
                status_code=500,
                detail="Failed to download video. Check the link and try again."
            )

    except subprocess.TimeoutExpired:
        raise HTTPException(
            status_code=408,
            detail="Download timed out. Try again or use a shorter video."
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    try:
        storage_path = f"users/{request.user_id}/uploads/{uuid.uuid4()}.mp4"
        bucket = storage.bucket()
        blob = bucket.blob(storage_path)
        blob.upload_from_filename(output_path, content_type="video/mp4")
    finally:
        if os.path.exists(output_path):
            os.remove(output_path)

    return {"success": True, "storage_path": storage_path}


@app.get("/health")
async def health():
    return {"status": "ok"}
