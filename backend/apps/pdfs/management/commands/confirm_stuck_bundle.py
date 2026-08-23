"""
GRADSKOOL — Manually confirm a PDF bundle payment

Real, one-off fix for exactly this situation: a student paid via Razorpay
(confirmed paid on Razorpay's own dashboard), but the PdfBundlePurchase
never flipped to status='paid' because the webhook that's supposed to do
that (apps.pdfs.views.PdfWebhookView, see its own docstring — needs a
SEPARATE webhook URL configured in Razorpay pointing at .../pdfs/webhook/,
distinct from the general .../payments/webhook/ one) either never fired
or points somewhere that doesn't exist. GS could not immediately confirm
whether that second webhook URL is actually configured in Razorpay's
dashboard — this command is the safe, direct fix regardless of root
cause: manually run the exact same mark_paid() logic the webhook would
have triggered, once a human has independently confirmed real payment on
Razorpay's own dashboard (never do this without that confirmation first —
this command trusts the operator, not Razorpay, since there's no webhook
signature to verify here).

Usage — find the stuck order two ways:

  1. If you have the Razorpay order_id (starts with order_):
     python manage.py confirm_stuck_bundle --order-id order_XXXXXXXXXXXX --payment-id pay_XXXXXXXXXXXX

  2. If you don't have it handy, search by user email + amount instead —
     lists every 'created' (unpaid) bundle matching, asks you to confirm
     which one before touching anything:
     python manage.py confirm_stuck_bundle --email student@example.com --amount 510

Either way, nothing is written until you pass --apply.
"""
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = 'Manually marks a PdfBundlePurchase as paid when Razorpay shows the payment succeeded but the webhook never updated it.'

    def add_arguments(self, parser):
        parser.add_argument('--order-id', help='Razorpay order_id (starts with order_)')
        parser.add_argument('--payment-id', help='Razorpay payment_id (starts with pay_) — required with --order-id')
        parser.add_argument('--email', help='Student email — alternative to --order-id, searches by user + amount')
        parser.add_argument('--amount', type=float, help='Bundle total in ₹ — used with --email to narrow the search')
        parser.add_argument('--apply', action='store_true', help='Actually mark it paid. Without this, only shows what would happen.')

    def handle(self, *args, **options):
        from apps.pdfs.models import PdfBundlePurchase

        order_id = options.get('order_id')
        email = options.get('email')

        if not order_id and not email:
            raise CommandError('Provide either --order-id or --email to find the stuck purchase.')

        if order_id:
            try:
                bundle = PdfBundlePurchase.objects.select_related('user').get(razorpay_order_id=order_id)
            except PdfBundlePurchase.DoesNotExist:
                raise CommandError(f'No PdfBundlePurchase found with razorpay_order_id={order_id!r}.')
            candidates = [bundle]
        else:
            qs = PdfBundlePurchase.objects.select_related('user').filter(
                user__email__iexact=email, status='created',
            ).order_by('-created_at')
            amount = options.get('amount')
            if amount is not None:
                qs = qs.filter(amount_inr=amount)
            candidates = list(qs[:10])
            if not candidates:
                raise CommandError(f'No unpaid bundle found for {email!r}' + (f' at ₹{amount}' if amount else '') + '.')

        self.stdout.write(f'Found {len(candidates)} candidate(s):\n')
        for b in candidates:
            self.stdout.write(
                f'  id={b.id} user={b.user.email} tier={b.tier_count} amount=₹{b.amount_inr} '
                f'status={b.status} order_id={b.razorpay_order_id} created={b.created_at}'
            )

        if len(candidates) > 1:
            self.stdout.write(self.style.WARNING(
                '\nMultiple matches — re-run with --order-id to target exactly one, or narrow with --amount.'
            ))
            return

        bundle = candidates[0]
        if bundle.status == 'paid':
            self.stdout.write(self.style.SUCCESS(f'\nBundle #{bundle.id} is already marked paid — nothing to do.'))
            return

        payment_id = options.get('payment_id') or ''
        if order_id and not payment_id:
            self.stdout.write(self.style.WARNING(
                '\nNo --payment-id given — proceeding without recording the Razorpay payment_id. '
                'Pass --payment-id pay_XXXXX for a complete record if you have it.'
            ))

        self.stdout.write(f'\nWill mark bundle #{bundle.id} ({bundle.tier_count} PDFs, ₹{bundle.amount_inr}) as PAID for {bundle.user.email}.')
        self.stdout.write('This will create real PdfPurchase rows for every PDF in this bundle, exactly as the webhook would have.')

        if not options['apply']:
            self.stdout.write(self.style.WARNING('\nDry run only — nothing written. Re-run with --apply to actually confirm this payment.'))
            return

        # The exact same real logic the webhook calls — see
        # apps.pdfs.models.PdfBundlePurchase.mark_paid and apps.pdfs.
        # services._handle_bundle_captured. Only reached here after a
        # human has independently confirmed real payment on Razorpay's
        # own dashboard.
        bundle.mark_paid(payment_id, '')
        self.stdout.write(self.style.SUCCESS(
            f'\nDone. Bundle #{bundle.id} marked paid — {bundle.tier_count} PDF(s) now owned by {bundle.user.email}.'
        ))