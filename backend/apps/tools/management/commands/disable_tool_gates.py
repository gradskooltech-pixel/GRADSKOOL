"""Disable lead gate on all tools — run once after migration."""
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Disable lead gate on all tools (make them freely accessible)'

    def handle(self, *args, **options):
        from apps.tools.models import Tool
        count = Tool.objects.filter(requires_lead_gate=True).update(requires_lead_gate=False)
        self.stdout.write(self.style.SUCCESS(f'Disabled lead gate on {count} tools'))
