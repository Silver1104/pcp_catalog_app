import io
from typing import Tuple

from fastapi import HTTPException, UploadFile, status
from PIL import Image

MAX_UPLOAD_BYTES = 12 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}


def read_and_convert_to_webp(file: UploadFile) -> Tuple[bytes, str]:
    if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image type: {file.content_type}. Use JPEG, PNG, WebP, or GIF.",
        )

    raw = file.file.read()
    if not raw:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file uploaded")
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image too large (max {MAX_UPLOAD_BYTES // (1024 * 1024)} MB)",
        )

    try:
        image = Image.open(io.BytesIO(raw))
        image = image.convert("RGBA") if image.mode in ("P", "LA") else image.convert("RGB")
        if image.mode == "RGBA":
            background = Image.new("RGB", image.size, (255, 255, 255))
            background.paste(image, mask=image.split()[3])
            image = background

        out = io.BytesIO()
        image.save(out, format="WEBP", quality=85, method=6)
        return out.getvalue(), "image/webp"
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not process image. Upload a valid photo file.",
        ) from exc
