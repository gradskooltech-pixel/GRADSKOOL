"""GRADSKOOL — Tools Email Service"""
import logging
import resend
from django.conf import settings

logger = logging.getLogger(__name__)


def send_tool_welcome_email(lead):
    if not settings.RESEND_API_KEY:
        logger.info(f'[EMAIL DEV] Tool welcome → {lead.email} / {lead.tool.slug}')
        return

    resend.api_key = settings.RESEND_API_KEY
    html = f"""
    <!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f3;font-family:Georgia,serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f3;padding:40px 20px;">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
               style="background:#fff;border:1px solid #e8e8e6;border-radius:4px;overflow:hidden;">
          <tr><td style="background:#0f0f0f;padding:28px 40px;">
            <p style="margin:0;font-family:sans-serif;font-size:20px;font-weight:700;
                       letter-spacing:.05em;color:#fff;">
              GRAD<span style="color:#ff5e5f;">SKOOL</span></p>
          </td></tr>
          <tr><td style="padding:40px;">
            <p style="margin:0 0 6px;font-family:sans-serif;font-size:11px;font-weight:600;
                       letter-spacing:.1em;text-transform:uppercase;color:#ff5e5f;">Free Tool Access</p>
            <h1 style="margin:0 0 16px;font-size:26px;color:#0f0f0f;font-weight:700;line-height:1.15;">
              Hi {lead.name.split()[0]}, your access is ready.</h1>
            <p style="margin:0 0 24px;font-family:sans-serif;font-size:14px;color:#555;line-height:1.7;">
              You now have full access to <strong>{lead.tool.name}</strong>.
              Start practising and track your progress as you go.
            </p>
            <a href="https://gradskool.in/tools/{lead.tool.slug}"
               style="display:inline-block;padding:14px 28px;background:#ff5e5f;color:#fff;
                      border-radius:3px;font-family:sans-serif;font-size:14px;font-weight:600;
                      text-decoration:none;">Open {lead.tool.name} →</a>
            <hr style="margin:32px 0;border:none;border-top:1px solid #e8e8e6;">
            <p style="margin:0;font-family:sans-serif;font-size:12px;color:#999;line-height:1.6;">
              GRADSKOOL · gradskool.in · WhatsApp: +91 6360597966
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
    </body></html>
    """
    try:
        resend.Emails.send({
            'from':    settings.DEFAULT_FROM_EMAIL,
            'to':      lead.email,
            'subject': f'Your free access to {lead.tool.name} is ready',
            'html':    html,
        })
    except Exception as e:
        logger.exception(f'Tool email failed for {lead.email}: {e}')