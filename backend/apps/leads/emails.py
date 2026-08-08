"""
GRADSKOOL — Leads Email Sender

Renders a DripEmail for a Lead and sends via Resend.
Wraps every Resend call in try/except — email failure
should never crash the drip send loop.

Also contains the HTML wrapper that applies GRADSKOOL branding
to every drip email body.
"""
import logging
import resend
from django.conf import settings

logger = logging.getLogger(__name__)

UNSUBSCRIBE_BASE_URL = 'https://gradskool.in/unsubscribe'


def send_drip_email(lead, drip_email) -> bool:
    """
    Render the DripEmail template for the given lead and send via Resend.
    Returns True on success, False on failure.
    """
    unsubscribe_url = f'{UNSUBSCRIBE_BASE_URL}?token={lead.unsubscribe_token}'
    html_body = drip_email.render(lead, unsubscribe_url)
    wrapped   = _wrap_in_brand_shell(
        body_html=html_body,
        preview_text=drip_email.preview_text,
        unsubscribe_url=unsubscribe_url,
    )

    if not settings.RESEND_API_KEY:
        logger.info(
            f'[EMAIL DEV] Drip: {lead.email} | '
            f'Step {drip_email.step}: {drip_email.subject}'
        )
        return True

    try:
        resend.api_key = settings.RESEND_API_KEY
        result = resend.Emails.send({
            'from':    'GRADSKOOL <hello@gradskool.in>',
            'to':      lead.email,
            'subject': drip_email.subject,
            'html':    wrapped,
            'headers': {
                'List-Unsubscribe': f'<{unsubscribe_url}>',
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
            'tags': [
                {'name': 'sequence', 'value': drip_email.sequence.slug},
                {'name': 'step',     'value': str(drip_email.step)},
                {'name': 'exam',     'value': lead.target_exam or 'general'},
            ],
        })
        logger.info(
            f'Drip sent: {lead.email} | '
            f'"{drip_email.subject}" | id={result.get("id","?")}'
        )
        return True
    except Exception as exc:
        logger.exception(
            f'Drip send failed: {lead.email} | '
            f'sequence={drip_email.sequence.slug} step={drip_email.step}: {exc}'
        )
        return False


def _wrap_in_brand_shell(body_html: str, preview_text: str, unsubscribe_url: str) -> str:
    """
    Wraps email body in the GRADSKOOL HTML shell.
    Includes: logo, body content, footer with unsubscribe link.
    """
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>GRADSKOOL</title>
  {'<div style="display:none;max-height:0;overflow:hidden;">' + preview_text + '&zwnj;&nbsp;' * 40 + '</div>' if preview_text else ''}
</head>
<body style="margin:0;padding:0;background:#f5f5f3;font-family:Georgia,'Times New Roman',serif;
             -webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

  <!-- Preheader spacer -->
  <div style="display:none;max-height:0;overflow:hidden;"></div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background:#f5f5f3;padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border:1px solid #e8e8e6;
                    border-radius:4px;overflow:hidden;max-width:560px;width:100%;">

        <!-- ── HEADER ───────────────────────────────────────────────────── -->
        <tr>
          <td style="background:#0f0f0f;padding:24px 40px;">
            <a href="https://gradskool.in" style="text-decoration:none;">
              <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                           font-size:18px;font-weight:700;letter-spacing:0.05em;color:#ffffff;">
                GRAD<span style="color:#ff5e5f;">SKOOL</span>
              </span>
            </a>
          </td>
        </tr>

        <!-- ── BODY ─────────────────────────────────────────────────────── -->
        <tr>
          <td style="padding:36px 40px 32px;">
            {body_html}
          </td>
        </tr>

        <!-- ── FOOTER ───────────────────────────────────────────────────── -->
        <tr>
          <td style="padding:20px 40px;background:#fafaf9;
                     border-top:1px solid #e8e8e6;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                           font-size:11px;color:#aaaaaa;line-height:1.5;">
                  <p style="margin:0 0 6px;">
                    GRADSKOOL · India's most structured MBA entrance preparation ·
                    <a href="https://gradskool.in" style="color:#aaa;">gradskool.in</a>
                  </p>
                  <p style="margin:0;">
                    You're receiving this because you used a GRADSKOOL free tool or
                    signed up for an account.
                    <a href="{unsubscribe_url}"
                       style="color:#ff5e5f;text-decoration:underline;">
                      Unsubscribe
                    </a>
                    &nbsp;·&nbsp;
                    <a href="https://gradskool.in/privacy-policy"
                       style="color:#aaa;text-decoration:underline;">
                      Privacy Policy
                    </a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>"""
