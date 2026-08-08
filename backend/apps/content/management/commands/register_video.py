"""
GRADSKOOL — Management Command: register_video

Registers a Bunny Stream video into VideoLibrary.
The SAME Bunny video ID can be added to multiple courses — Bunny
streams from the same CDN regardless of how many DB rows point to it.

Usage examples:

  # Add a new video to one course
  python manage.py register_video \\
    --bunny-id abc123-guid \\
    --course-id 1 \\
    --title "CAT VARC Session 01" \\
    --publish

  # Add the SAME video to a second course (reuse)
  python manage.py register_video \\
    --bunny-id abc123-guid \\
    --course-id 5 \\
    --title "VARC Fundamentals" \\
    --publish

  # Add as a free preview (no course required)
  python manage.py register_video \\
    --bunny-id abc123-guid \\
    --title "Free Demo Class" \\
    --free-preview \\
    --publish

  # List everywhere a video is currently used
  python manage.py register_video \\
    --bunny-id abc123-guid \\
    --list-usages

  # Clone a video row to another course (shortcut)
  python manage.py register_video \\
    --clone-from-video-id 12 \\
    --course-id 5 \\
    --title "Same video, different course"
"""
from django.core.management.base import BaseCommand, CommandError
from apps.content.models import VideoLibrary
from apps.courses.models import Course, CurriculumModule


class Command(BaseCommand):
    help = 'Register or reuse a Bunny Stream video across multiple courses.'

    def add_arguments(self, parser):
        parser.add_argument('--bunny-id',           help='Bunny Stream video GUID')
        parser.add_argument('--youtube-id',         help='YouTube video ID (11 chars from watch?v=ID)')
        parser.add_argument('--course-id',          type=int, default=None,
                            help='Course to attach video to (omit for preview-only)')
        parser.add_argument('--title',              default='',
                            help='Title for this video entry')
        parser.add_argument('--module-id',          type=int, default=None)
        parser.add_argument('--description',        default='')
        parser.add_argument('--sort-order',         type=int, default=0)
        parser.add_argument('--free-preview',       action='store_true', default=False,
                            help='Make this video freely watchable without enrollment')
        parser.add_argument('--publish',            action='store_true', default=False)
        parser.add_argument('--transcribe',         action='store_true', default=False)

        # Multi-use helpers
        parser.add_argument('--list-usages',        action='store_true', default=False,
                            help='Show all courses this bunny-id is already used in')
        parser.add_argument('--clone-from-video-id', type=int, default=None,
                            help='Copy metadata from an existing VideoLibrary row into a new course')
        parser.add_argument('--add-to-courses',     default='',
                            help='Comma-separated course IDs to add this video to at once '
                                 'e.g. --add-to-courses 1,3,5')

    def handle(self, *args, **options):

        # ── LIST USAGES ───────────────────────────────────────────────────────
        if options['list_usages']:
            bunny_id = options.get('bunny_id')
            if not bunny_id:
                raise CommandError('--bunny-id required with --list-usages')
            rows = VideoLibrary.objects.filter(
                bunny_video_id=bunny_id
            ).select_related('course__exam', 'module')

            if not rows.exists():
                self.stdout.write(f'No rows found for bunny_id={bunny_id}')
                return

            self.stdout.write(f'\nBunny video {bunny_id} is used in {rows.count()} place(s):\n')
            for row in rows:
                course_label = str(row.course) if row.course else '— (no course / preview)'
                self.stdout.write(
                    f'  [{row.id}] "{row.title}"\n'
                    f'       Course:    {course_label}\n'
                    f'       Module:    {row.module or "—"}\n'
                    f'       Published: {row.is_published}  |  Preview: {row.is_free_preview}\n'
                )
            return

        # ── CLONE FROM EXISTING ROW ───────────────────────────────────────────
        if options['clone_from_video_id']:
            return self._clone(options)

        # ── ADD TO MULTIPLE COURSES AT ONCE ───────────────────────────────────
        if options['add_to_courses']:
            return self._add_to_many(options)

        # ── SINGLE REGISTRATION ───────────────────────────────────────────────
        bunny_id   = options.get('bunny_id') or ''
        youtube_id = options.get('youtube_id') or ''
        if not bunny_id and not youtube_id:
            raise CommandError('Provide either --bunny-id or --youtube-id')
        if not options['title']:
            raise CommandError('--title is required')

        course, module = self._resolve_course_module(options)
        self._create_entry(bunny_id, course, module, options)

    # ── CLONE ─────────────────────────────────────────────────────────────────

    def _clone(self, options):
        try:
            source = VideoLibrary.objects.get(id=options['clone_from_video_id'])
        except VideoLibrary.DoesNotExist:
            raise CommandError(f'VideoLibrary id={options["clone_from_video_id"]} not found')

        course, module = self._resolve_course_module(options)
        title = options['title'] or source.title

        video = VideoLibrary.objects.create(
            bunny_video_id  = source.bunny_video_id,
            course          = course,
            module          = module,
            title           = title,
            description     = options['description'] or source.description,
            duration_secs   = source.duration_secs,
            thumbnail_url   = source.thumbnail_url,
            bunny_library_id= source.bunny_library_id,
            is_free_preview = options['free_preview'],
            is_published    = options['publish'],
            sort_order      = options['sort_order'],
        )
        self.stdout.write(self.style.SUCCESS(
            f'Cloned video [{source.id}] → new row [{video.id}]\n'
            f'  Bunny ID: {video.bunny_video_id}\n'
            f'  Title:    {video.title}\n'
            f'  Course:   {course or "— (preview)"}'
        ))

    # ── ADD TO MANY COURSES ───────────────────────────────────────────────────

    def _add_to_many(self, options):
        bunny_id   = options.get('bunny_id') or ''
        youtube_id = options.get('youtube_id') or ''
        if not bunny_id and not youtube_id:
            raise CommandError('--bunny-id or --youtube-id required with --add-to-courses')
        if not options['title']:
            raise CommandError('--title required with --add-to-courses')

        course_ids = [int(x.strip()) for x in options['add_to_courses'].split(',') if x.strip()]
        if not course_ids:
            raise CommandError('--add-to-courses must be a comma-separated list of course IDs')

        created_ids = []
        for cid in course_ids:
            try:
                course = Course.objects.get(id=cid)
            except Course.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'  Course {cid} not found — skipped'))
                continue

            youtube_id = options.get('youtube_id') or ''
            video = VideoLibrary.objects.create(
                video_source     = 'youtube' if youtube_id else 'bunny',
                bunny_video_id   = bunny_id or '',
                youtube_video_id = youtube_id,
                course           = course,
                module           = None,
                title            = options['title'],
                description      = options['description'],
                is_free_preview  = True if youtube_id else options['free_preview'],
                is_published     = options['publish'],
                sort_order       = options['sort_order'],
            )
            created_ids.append(video.id)
            self.stdout.write(f'  ✓ [{video.id}] added to {course}')

        self.stdout.write(self.style.SUCCESS(
            f'\nAdded "{options["title"]}" ({bunny_id}) to {len(created_ids)} courses: '
            f'row IDs {created_ids}'
        ))

    # ── HELPERS ───────────────────────────────────────────────────────────────

    def _resolve_course_module(self, options):
        course = None
        if options.get('course_id'):
            try:
                course = Course.objects.get(id=options['course_id'])
            except Course.DoesNotExist:
                raise CommandError(f'Course id={options["course_id"]} not found')

        module = None
        if options.get('module_id') and course:
            try:
                module = CurriculumModule.objects.get(id=options['module_id'], course=course)
            except CurriculumModule.DoesNotExist:
                raise CommandError(f'Module {options["module_id"]} not found in this course')

        return course, module

    def _create_entry(self, bunny_id, course, module, options):
        youtube_id  = options.get('youtube_id') or ''
        is_youtube  = bool(youtube_id)
        duration    = None
        thumbnail   = ''

        if is_youtube:
            # YouTube — thumbnail auto-generated, no API call needed
            thumbnail = f'https://img.youtube.com/vi/{youtube_id}/maxresdefault.jpg'
        else:
            # Bunny — try to fetch metadata (graceful fallback if no API key)
            try:
                from apps.content.bunny import get_video_metadata, build_thumbnail_url
                meta = get_video_metadata(bunny_id)
                if meta:
                    duration  = meta.get('length')
                    thumbnail = build_thumbnail_url(bunny_id)
            except Exception:
                pass

        video = VideoLibrary.objects.create(
            video_source    = 'youtube' if is_youtube else 'bunny',
            bunny_video_id  = bunny_id or '',
            youtube_video_id= youtube_id,
            course          = course,
            module          = module,
            title           = options['title'],
            description     = options['description'],
            duration_secs   = duration,
            thumbnail_url   = thumbnail,
            bunny_library_id= '',
            is_free_preview = True if is_youtube else options['free_preview'],
            is_published    = options['publish'],
            sort_order      = options['sort_order'],
        )

        self.stdout.write(self.style.SUCCESS(
            f'\n✓ Registered video [{video.id}]\n'
            f'  Bunny ID:  {video.bunny_video_id}\n'
            f'  Title:     {video.title}\n'
            f'  Course:    {course or "— (no course / preview only)"}\n'
            f'  Module:    {module or "—"}\n'
            f'  Duration:  {video.duration_display if hasattr(video, "duration_display") else duration or "unknown"}\n'
            f'  Published: {video.is_published}\n'
            f'  Preview:   {video.is_free_preview}\n'
            f'\nTo add this same video to another course:\n'
            f'  python manage.py register_video --bunny-id {bunny_id} --course-id <id> --title "<title>" --publish\n'
            f'\nTo see all usages:\n'
            f'  python manage.py register_video --bunny-id {bunny_id} --list-usages'
        ))

        if options['transcribe'] and video.is_published:
            try:
                from apps.content.tasks import generate_transcript
                generate_transcript.delay(video.id)
                self.stdout.write('  → Transcription task queued.')
            except Exception:
                self.stdout.write(self.style.WARNING('  → Transcription queuing failed (Celery not running?)'))
