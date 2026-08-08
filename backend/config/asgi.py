"""
GRADSKOOL — ASGI Configuration

Exposes the ASGI callable as module-level 'application'.
Currently used for standard HTTP. Ready for Django Channels
(WebSockets) if live session features are added later.
"""
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')

application = get_asgi_application()
