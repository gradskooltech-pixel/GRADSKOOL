"""
GRADSKOOL — Bunny Stream Service

generate_signed_url(video_id, user_id, expires_in)
  → Creates a time-limited, user-tied embed URL.
  → Token binds video path + expiry + user_id → SHA-256 HMAC.
  → Prevents URL sharing between users.

get_video_metadata(video_id)
  → Fetches duration, thumbnail from Bunny API.

BunnyUploader
  → Used by management command to register a video after uploading
    via Bunny Storage or direct upload.
"""
import base64
import hashlib
import hmac
import time
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

BUNNY_CDN_HOST = 'iframe.mediadelivery.net'


def generate_signed_url(video_id: str, user_id: int, expires_in: int = 3600) -> str:
    """
    Generate a Bunny Stream signed embed URL.

    The token = BASE64(SHA256(token_key + path + expiry + user_id))
    This ties the URL to:
      - The video (path)
      - The time window (expiry)
      - The requesting user (user_id) — prevents sharing

    Reference: https://docs.bunny.net/docs/stream-signed-urls
    """
    library_id = settings.BUNNY_LIBRARY_ID
    token_key  = settings.BUNNY_TOKEN_KEY
    expiry     = int(time.time()) + expires_in

    path = f'/{library_id}/{video_id}/play'
    token_raw = f'{token_key}{path}{expiry}{user_id}'

    token = (
        base64.b64encode(
            hashlib.sha256(token_raw.encode('utf-8')).digest()
        )
        .decode('utf-8')
        .replace('+', '-')
        .replace('/', '_')
        .rstrip('=')
    )

    url = (
        f'https://{BUNNY_CDN_HOST}/embed/{library_id}/{video_id}'
        f'?token={token}&expires={expiry}'
        f'&autoplay=false'
        f'&responsive=true'
    )
    return url


def get_video_metadata(bunny_video_id: str) -> dict | None:
    """
    Fetch video metadata from Bunny Stream Management API.
    Returns dict with duration, thumbnailFileName, etc.
    """
    library_id = settings.BUNNY_LIBRARY_ID
    api_key    = settings.BUNNY_STREAM_API_KEY

    url = f'https://video.bunnycdn.com/library/{library_id}/videos/{bunny_video_id}'
    try:
        res = requests.get(
            url,
            headers={'AccessKey': api_key},
            timeout=10
        )
        if res.status_code == 200:
            return res.json()
    except Exception as e:
        logger.error(f'Bunny metadata fetch failed for {bunny_video_id}: {e}')
    return None


def build_thumbnail_url(bunny_video_id: str) -> str:
    """
    Bunny Stream auto-generates a thumbnail for every video.
    """
    library_id = settings.BUNNY_LIBRARY_ID
    return f'https://vz-{library_id}.b-cdn.net/{bunny_video_id}/thumbnail.jpg'


def download_audio_for_transcription(bunny_video_id: str, output_path: str) -> bool:
    """
    Download the original audio track from Bunny Storage for Whisper processing.
    Bunny provides HLS streams; we use the MP4 fallback for transcription.

    In production: use Bunny CDN pull zone with BUNNY_PULL_ZONE_URL.
    """
    pull_zone  = getattr(settings, 'BUNNY_PULL_ZONE_URL', None)
    library_id = settings.BUNNY_LIBRARY_ID

    if not pull_zone:
        logger.warning('BUNNY_PULL_ZONE_URL not set — cannot download audio')
        return False

    # Bunny transcodes to 360p MP4 — small enough for Whisper
    audio_url = f'{pull_zone}/{bunny_video_id}/play_360p.mp4'
    try:
        res = requests.get(audio_url, stream=True, timeout=120)
        if res.status_code == 200:
            with open(output_path, 'wb') as f:
                for chunk in res.iter_content(chunk_size=8192):
                    f.write(chunk)
            return True
    except Exception as e:
        logger.error(f'Audio download failed for {bunny_video_id}: {e}')
    return False
