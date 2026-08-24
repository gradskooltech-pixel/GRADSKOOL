"""
GRADSKOOL — Audit stuck course/enrollment payments

Real equivalent of apps.pdfs.management.commands.audit_stuck_payments, but
for the general course checkout system (apps.payments.Order/Enrollment)
rather than PDFs. Same real reason this exists: GS does not control the
Razorpay account this project uses, so the webhook that's supposed to
report a successful payment either never fires or points somewhere
broken (see VerifyPaymentView's own docstring for the full story) — a
payment can genuinely succeed on Razorpay while the local Order stays
stuck at status='created' forever. Two real cases already found and
fixed this way (a SNAP+NMAT bundle order, and a duplicate-checkout-
attempt case) — this proactively checks for anyone ELSE in the same
situation, rather than waiting for each one to be individually reported.

For each unpaid order, calls Razorpay's real API (client.order.payments)
to check whether a payment actually completed for it. If Razorpay
confirms a captured payment but the local Order still says 'created',
that's the exact stuck-payment bug.

Usage:
    python manage.py audit_stuck_orders              # checks all unpaid orders from the last 30 days
    python manage.py audit_stuck_orders --days 90     # widen the window to catch older stuck orders too
    python manage.py audit_stuck_orders --apply       # automatically fix any confirmed-stuck ones found
"""
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = 'Checks every unpaid course Order against Razorpay\'s own records to catch payments that succeeded but were never reflected locally.'

    def add_arguments(self, parser):
        parser.add_argument('--days', type=int, default=30, help='Only check orders created in the last N days (default: 30).')
        parser.add_argument('--apply', action='store_true', help='Automatically confirm and enroll any confirmed-stuck orders. Without this, only reports them.')

    def handle(self, *args, **options):
        from apps.payments.models import Order
        from apps.payments.services import _razorpay_client, _handle_payment_captured

        cutoff = timezone.now() - timedelta(days=options['days'])
        client = _razorpay_client()

        unpaid = Order.objects.filter(
            status='created', created_at__gte=cutoff,
        ).select_related('user', 'plan').order_by('user_id', '-created_at')

        self.stdout.write(f'Checking {unpaid.count()} unpaid order(s) from the last {options["days"]} day(s)...')

        stuck = []
        seen_users_with_paid_dupe = set()  # tracks (user_id, plan_id) already flagged, so a duplicate abandoned attempt from the SAME user+plan doesn't get reported/fixed twice

        for order in unpaid:
            key = (order.user_id, order.plan_id)
            captured = self._order_has_captured_payment(client, order.razorpay_order_id)
            if captured:
                if key in seen_users_with_paid_dupe:
                    # Real case hit this session: a student had TWO
                    # unpaid orders for the same plan (one abandoned
                    # checkout attempt, one real payment). Only the ONE
                    # that actually matches a captured Razorpay payment
                    # should ever be fixed — flagging every match here
                    # rather than silently picking one, so a human
                    # decides, same as had to happen manually for
                    # Swayam's case.
                    self.stdout.write(self.style.WARNING(
                        f'  MULTIPLE STUCK-AND-PAID matches for {order.user.email} — {order.plan.slug}: '
                        f'order #{order.id} ({order.razorpay_order_id}) ALSO shows a captured payment. '
                        f'Do not --apply this automatically — verify manually which one is real (see confirm_stuck_order).'
                    ))
                    continue
                seen_users_with_paid_dupe.add(key)
                stuck.append((order, captured))
                self.stdout.write(self.style.WARNING(
                    f'  STUCK: {order.user.email} — {order.plan.name} (₹{order.total_amount}) — '
                    f'Razorpay shows payment {captured["id"]} captured, but local status is still "created"'
                ))

        if not stuck:
            self.stdout.write(self.style.SUCCESS('\nNo stuck orders found — everything Razorpay shows as paid is correctly reflected locally.'))
            return

        self.stdout.write(self.style.ERROR(f'\n{len(stuck)} stuck order(s) found — real money collected, no enrollment granted.'))

        if not options['apply']:
            self.stdout.write(self.style.WARNING(
                'Dry run only — re-run with --apply to automatically fix all of these, '
                'or fix individually with confirm_stuck_order.'
            ))
            return

        for order, captured in stuck:
            # Real webhook logic, called directly — creates the
            # Enrollment and sends the real confirmation email, exactly
            # as if the webhook itself had fired. Not just mark_paid()
            # alone, which would leave the order paid but nobody actually
            # enrolled.
            _handle_payment_captured({
                'order_id': order.razorpay_order_id,
                'id': captured['id'],
                'method': captured.get('method', ''),
                'signature': '',
            })
            self.stdout.write(self.style.SUCCESS(f'  Fixed: {order.user.email} — {order.plan.name}'))

        self.stdout.write(self.style.SUCCESS(f'\nDone. Fixed {len(stuck)} stuck order(s).'))

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