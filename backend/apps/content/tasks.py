"""
GRADSKOOL — Content Celery Tasks

generate_transcript(video_library_id)
  → Downloads audio from Bunny → Whisper API → saves raw transcript.
  → Triggered after a video is published.

generate_ai_notes(video_library_id)
  → Reads raw transcript → GPT-4o-mini → structured study notes.
  → Triggered automatically after transcript is done.

These tasks run on Celery workers (Railway background worker process).
Broker: Upstash Redis.
"""
import os
import time
import logging
import tempfile

from celery import shared_task
from django.conf import settings

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    name='content.generate_transcript',
)
def generate_transcript(self, video_library_id: int):
    """
    Step 1: Download video audio from Bunny → transcribe with Whisper.
    """
    # Lazy imports to avoid loading heavy ML libs at startup
    from apps.content.models import VideoLibrary, AITranscript
    from apps.content.bunny import download_audio_for_transcription

    try:
        video = VideoLibrary.objects.get(id=video_library_id)
    except VideoLibrary.DoesNotExist:
        logger.error(f'Video {video_library_id} not found')
        return

    transcript, _ = AITranscript.objects.get_or_create(video=video)
    transcript.status = 'processing'
    transcript.save(update_fields=['status'])

    with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as tmp:
        tmp_path = tmp.name

    try:
        # 1. Download audio
        success = download_audio_for_transcription(video.bunny_video_id, tmp_path)
        if not success:
            raise RuntimeError('Audio download failed')

        # 2. Whisper transcription
        import openai
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

        start = time.time()
        with open(tmp_path, 'rb') as audio_file:
            result = client.audio.transcriptions.create(
                model='whisper-1',
                file=audio_file,
                language='en',
                response_format='text',
            )
        elapsed = time.time() - start

        transcript.raw_transcript = result
        transcript.word_count     = len(result.split())
        transcript.processing_secs = elapsed
        transcript.status         = 'done'
        transcript.save(update_fields=[
            'raw_transcript', 'word_count', 'processing_secs', 'status', 'updated_at'
        ])

        logger.info(
            f'Transcript done: video={video_library_id} '
            f'words={transcript.word_count} time={elapsed:.1f}s'
        )

        # 3. Trigger AI notes generation
        generate_ai_notes.delay(video_library_id)

    except Exception as exc:
        transcript.status        = 'failed'
        transcript.error_message = str(exc)
        transcript.save(update_fields=['status', 'error_message', 'updated_at'])
        logger.exception(f'Transcript failed for video {video_library_id}: {exc}')
        raise self.retry(exc=exc)

    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


@shared_task(
    bind=True,
    max_retries=2,
    default_retry_delay=30,
    name='content.generate_ai_notes',
)
def generate_ai_notes(self, video_library_id: int):
    """
    Step 2: Convert raw Whisper transcript into structured study notes.
    Uses GPT-4o-mini (cost-effective, fast enough for batch processing).
    """
    from apps.content.models import VideoLibrary, AITranscript

    try:
        video      = VideoLibrary.objects.get(id=video_library_id)
        transcript = video.transcript
    except (VideoLibrary.DoesNotExist, AITranscript.DoesNotExist):
        logger.error(f'Video or transcript not found: {video_library_id}')
        return

    if not transcript.raw_transcript:
        logger.warning(f'No raw transcript for video {video_library_id}')
        return

    try:
        import openai
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

        # Truncate to fit context window (~12K chars ≈ 3K tokens)
        text = transcript.raw_transcript[:12000]

        response = client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[
                {
                    'role': 'system',
                    'content': (
                        'You are an expert MBA entrance exam tutor. '
                        'Convert the following lecture transcript into structured, '
                        'scannable study notes. Use this exact format:\n\n'
                        '## Key Concepts\n'
                        '- [concept 1]\n- [concept 2]\n\n'
                        '## Formulas & Rules\n'
                        '- [formula or rule]\n\n'
                        '## Worked Examples\n'
                        '- [brief example summary]\n\n'
                        '## Common Mistakes\n'
                        '- [mistake to avoid]\n\n'
                        '## Exam Tips\n'
                        '- [actionable tip]\n\n'
                        'Be concise. Use bullet points. Preserve technical accuracy.'
                    ),
                },
                {
                    'role': 'user',
                    'content': f'Lecture title: {video.title}\n\nTranscript:\n{text}',
                },
            ],
            max_tokens=1200,
            temperature=0.3,
        )

        notes = response.choices[0].message.content
        transcript.ai_notes = notes
        transcript.save(update_fields=['ai_notes', 'updated_at'])

        logger.info(f'AI notes generated for video {video_library_id}: {len(notes)} chars')

    except Exception as exc:
        logger.exception(f'AI notes failed for video {video_library_id}: {exc}')
        raise self.retry(exc=exc)
