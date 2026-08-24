"""
GRADSKOOL — Manually confirm a stuck course/bundle Order payment

Real equivalent of apps.pdfs.management.commands.confirm_stuck_bundle, but
for the general course checkout system (apps.payments.Order/Enrollment —
used by CAT, XAT, SNAP, NMAT, the SNAP+NMAT bundle, etc. via /checkout?
course=<slug>) rather than the PDF bundle system. Same real root cause as
the PDF case this session already fixed: GS does not control the Razorpay
account this project uses, so the webhook that's supposed to report a
successful payment either never fires or points somewhere broken — a
payment can genuinely succeed on Razorpay's own dashboard while the local
Order row stays stuck at status='created' forever, since nothing ever
told this backend it happened.

This calls the REAL webhook logic directly (apps.payments.services.
_handle_payment_captured) rather than reimplementing mark_paid/Enrollment-
creation/rebuild_access by hand — guarantees this stays in sync with
whatever that real function actually does, including if it's ever changed
later. Only reached after a human has independently confirmed real
payment on Razorpay's own dashboard — there's no webhook signature to
verify here, this trusts the operator running it, not Razorpay.

Usage — find the stuck order two ways:

  1. If you have the Razorpay order_id and payment_id (both from
     Razorpay's dashboard, order_id starts with order_, payment_id
     starts with pay_):
     python manage.py confirm_stuck_order --order-id order_XXXXXXXXXXXX --payment-id pay_XXXXXXXXXXXX

  2. If you only have the student's email, search by that + the course
     slug (or amount) instead — lists every 'created' (unpaid) order
     matching, asks you to confirm which one before touching anything:
     python manage.py confirm_stuck_order --email student@example.com --course nmat-snap

Either way, nothing is written until you pass --apply.
"""
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = 'Manually confirms a course Order as paid when Razorpay shows the payment succeeded but the webhook never updated it.'

    def add_arguments(self, parser):
        parser.add_argument('--order-id', help='Razorpay order_id (starts with order_)')
        parser.add_argument('--payment-id', help='Razorpay payment_id (starts with pay_) — required with --order-id')
        parser.add_argument('--email', help='Student email — alternative to --order-id, searches by user + course')
        parser.add_argument('--course', help='Course/plan slug to narrow the search when using --email, e.g. nmat-snap')
        parser.add_argument('--apply', action='store_true', help='Actually confirm the payment. Without this, only shows what would happen.')

    def handle(self, *args, **options):
        from apps.payments.models import Order
        from apps.payments.services import _handle_payment_captured

        order_id = options.get('order_id')
        email = options.get('email')

        if not order_id and not email:
            raise CommandError('Provide either --order-id or --email to find the stuck order.')

        if order_id:
            try:
                order = Order.objects.select_related('user', 'plan').get(razorpay_order_id=order_id)
            except Order.DoesNotExist:
                raise CommandError(f'No Order found with razorpay_order_id={order_id!r}.')
            candidates = [order]
        else:
            qs = Order.objects.select_related('user', 'plan').filter(
                user__email__iexact=email, status='created',
            ).order_by('-id')
            course = options.get('course')
            if course:
                qs = qs.filter(plan__slug__icontains=course)
            candidates = list(qs[:10])
            if not candidates:
                raise CommandError(f'No unpaid order found for {email!r}' + (f' matching course {course!r}' if course else '') + '.')

        self.stdout.write(f'Found {len(candidates)} candidate(s):\n')
        for o in candidates:
            self.stdout.write(
                f'  id={o.id} user={o.user.email} plan={o.plan.slug} amount=₹{o.total_amount} '
                f'status={o.status} order_id={o.razorpay_order_id}'
            )

        if len(candidates) > 1:
            self.stdout.write(self.style.WARNING(
                '\nMultiple matches — re-run with --order-id to target exactly one, or narrow with --course.'
            ))
            return

        order = candidates[0]
        if order.status == 'paid':
            self.stdout.write(self.style.SUCCESS(f'\nOrder #{order.id} is already marked paid — nothing to do.'))
            return

        payment_id = options.get('payment_id') or ''
        if order_id and not payment_id:
            raise CommandError('--payment-id is required when using --order-id (get it from Razorpay\'s dashboard).')
        if not order_id and not payment_id:
            self.stdout.write(self.style.WARNING(
                '\nNo --payment-id given — proceeding with a placeholder. Re-run with the real '
                'pay_XXXXX from Razorpay for a complete, accurate record if you have it.'
            ))
            payment_id = f'manual-fix-{order.id}'

        self.stdout.write(f'\nWill mark order #{order.id} ({order.plan.slug}, ₹{order.total_amount}) as PAID for {order.user.email}.')
        self.stdout.write('This creates a real Enrollment and rebuilds course access, exactly as the webhook would have.')

        if not options['apply']:
            self.stdout.write(self.style.WARNING('\nDry run only — nothing written. Re-run with --apply to actually confirm this payment.'))
            return

        # Calls the REAL webhook handler directly — same function
        # process_webhook() itself calls on a genuine payment.captured
        # event, so this stays correct even if that function's internals
        # change later.
        _handle_payment_captured({
            'order_id': order.razorpay_order_id,
            'id': payment_id,
            'method': 'manual',
            'signature': '',
        })

        order.refresh_from_db()
        self.stdout.write(self.style.SUCCESS(
            f'\nDone. Order #{order.id} status is now {order.status!r} — {order.user.email} enrolled in {order.plan.slug}.'
        ))
