"""
GRADSKOOL — Audit stuck PDF/bundle payments

Proactively finds every PdfPurchase and PdfBundlePurchase still sitting at
status='created' (i.e. never confirmed paid), and checks EACH ONE against
Razorpay's own records directly — catching exactly the class of bug this
session already hit once for real (a student paid successfully on
Razorpay, but nothing on the backend was ever told, because the webhook
that's supposed to report that has no working URL registered — see
VerifyPdfPaymentView's docstring for the full story). Rather than waiting
for a student to notice and report it, this checks proactively so GS can
run it periodically (or on a schedule) and catch these before a student
even asks.

For each unpaid order, calls Razorpay's real API (client.order.payments)
to see if a payment actually completed for it. If Razorpay confirms a
captured payment exists but the local record still says 'created', that's
exactly the stuck-payment bug — flagged clearly, with the exact
confirm_stuck_bundle / manual fix needed.

Usage:
    python manage.py audit_stuck_payments              # checks both PdfPurchase and PdfBundlePurchase
    python manage.py audit_stuck_payments --days 7      # only orders from the last 7 days (default: 30)
    python manage.py audit_stuck_payments --apply       # automatically fix any confirmed-stuck ones found
"""
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = 'Checks every unpaid PDF/bundle order against Razorpay\'s own records to catch payments that succeeded but were never reflected locally.'

    def add_arguments(self, parser):
        parser.add_argument('--days', type=int, default=30, help='Only check orders created in the last N days (default: 30).')
        parser.add_argument('--apply', action='store_true', help='Automatically mark confirmed-stuck orders as paid. Without this, only reports them.')

    def handle(self, *args, **options):
        from apps.pdfs.models import PdfPurchase, PdfBundlePurchase
        from apps.pdfs.services import _razorpay_client

        cutoff = timezone.now() - timedelta(days=options['days'])
        client = _razorpay_client()

        stuck_singles = []
        stuck_bundles = []

        # ── Single-PDF purchases ────────────────────────────────────
        unpaid_singles = PdfPurchase.objects.filter(
            status='created', created_at__gte=cutoff, razorpay_order_id__isnull=False,
        ).select_related('user', 'pdf')

        self.stdout.write(f'Checking {unpaid_singles.count()} unpaid single-PDF order(s)...')
        for purchase in unpaid_singles:
            captured = self._order_has_captured_payment(client, purchase.razorpay_order_id)
            if captured:
                stuck_singles.append((purchase, captured))
                self.stdout.write(self.style.WARNING(
                    f'  STUCK: {purchase.user.email} — {purchase.pdf.title} — '
                    f'Razorpay shows payment {captured["id"]} captured, but local status is still "created"'
                ))

        # ── Bundle purchases ────────────────────────────────────────
        unpaid_bundles = PdfBundlePurchase.objects.filter(
            status='created', created_at__gte=cutoff, razorpay_order_id__isnull=False,
        ).select_related('user')

        self.stdout.write(f'\nChecking {unpaid_bundles.count()} unpaid bundle order(s)...')
        for bundle in unpaid_bundles:
            captured = self._order_has_captured_payment(client, bundle.razorpay_order_id)
            if captured:
                stuck_bundles.append((bundle, captured))
                self.stdout.write(self.style.WARNING(
                    f'  STUCK: {bundle.user.email} — {bundle.tier_count} PDFs, ₹{bundle.amount_inr} — '
                    f'Razorpay shows payment {captured["id"]} captured, but local status is still "created"'
                ))

        total_stuck = len(stuck_singles) + len(stuck_bundles)
        if total_stuck == 0:
            self.stdout.write(self.style.SUCCESS('\nNo stuck payments found — everything Razorpay shows as paid is correctly reflected locally.'))
            return

        self.stdout.write(self.style.ERROR(f'\n{total_stuck} stuck payment(s) found — real money collected, no access granted.'))

        if not options['apply']:
            self.stdout.write(self.style.WARNING(
                'Dry run only — re-run with --apply to automatically fix all of these, '
                'or fix individually with confirm_stuck_bundle for bundles.'
            ))
            return

        for purchase, captured in stuck_singles:
            purchase.mark_paid(captured['id'], '')
            self.stdout.write(self.style.SUCCESS(f'  Fixed: {purchase.user.email} — {purchase.pdf.title}'))

        for bundle, captured in stuck_bundles:
            bundle.mark_paid(captured['id'], '')
            self.stdout.write(self.style.SUCCESS(f'  Fixed: {bundle.user.email} — {bundle.tier_count} PDFs'))

        self.stdout.write(self.style.SUCCESS(f'\nDone. Fixed {total_stuck} stuck payment(s).'))

    def _order_has_captured_payment(self, client, order_id):
        """
        Real check against Razorpay's own records — not trusting local
        data at all here, since the whole point is finding cases where
        local data is wrong. Returns the captured payment dict if one
        exists for this order, else None.
        """
        try:
            payments = client.order.payments(order_id)
        except Exception as e:
            self.stderr.write(f'  Could not fetch Razorpay data for order {order_id}: {e}')
            return None

        for payment in payments.get('items', []):
            if payment.get('status') == 'captured':
                return payment
        return None