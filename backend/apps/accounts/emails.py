"""
GRADSKOOL — Email Service

All transactional emails for M1 (Auth):
  - Email verification
  - Password reset
  - Welcome (post-verification)

Uses Resend API. Falls back gracefully in dev (console).
HTML templates are inline here for portability — move to
templates/email/*.html when the template library grows.
"""
import logging
import resend
from django.conf import settings

logger = logging.getLogger(__name__)


def _send(to: str, subject: str, html: str) -> bool:
    """
    Thin wrapper around resend.Emails.send.
    Returns True on success, False on failure (never raises —
    email failure should NOT block the user-facing response).
    """
    if not settings.RESEND_API_KEY:
        # Dev fallback: log to console
        logger.info(f'[EMAIL DEV] To: {to} | Subject: {subject}')
        logger.debug(f'[EMAIL DEV] Body:\n{html}')
        return True

    try:
        resend.api_key = settings.RESEND_API_KEY
        resend.Emails.send({
            'from': settings.DEFAULT_FROM_EMAIL,
            'to': to,
            'subject': subject,
            'html': html,
        })
        return True
    except Exception as exc:
        logger.exception(f'Resend failed for {to}: {exc}')
        # Captured by Sentry automatically via its Django integration
        return False


def send_verification_email(user, token: str, redirect_path: str = '') -> bool:
    """Send email verification link."""
    verify_url = f"{settings.EMAIL_VERIFICATION_URL}?token={token}"
    # Only accept a genuine relative path — rejects absolute URLs and
    # protocol-relative ones like '//evil.com' that browsers still treat
    # as external, which would otherwise let this become an open redirect
    # embedded in a real, trusted-looking GRADSKOOL email.
    if redirect_path and redirect_path.startswith('/') and not redirect_path.startswith('//'):
        from urllib.parse import quote
        verify_url += f"&redirect={quote(redirect_path, safe='')}"

    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify your GRADSKOOL account</title>
    </head>
    <body style="margin:0;padding:0;background:#f5f5f3;font-family:Georgia,'Times New Roman',serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f3;padding:40px 20px;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e8e8e6;border-radius:4px;overflow:hidden;">

            <!-- Header -->
            <tr>
              <td style="background:#0f0f0f;padding:28px 40px;">
                <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:20px;font-weight:700;letter-spacing:0.05em;color:#ffffff;">
                  GRAD<span style="color:#ff5e5f;">SKOOL</span>
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:40px;">
                <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#ff5e5f;">
                  Verify Your Email
                </p>
                <h1 style="margin:0 0 20px;font-size:26px;line-height:1.15;color:#0f0f0f;font-weight:700;">
                  Hi {user.first_name or 'there'},<br>one step to go.
                </h1>
                <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#555;">
                  Click the button below to verify your email address and activate your GRADSKOOL account.
                  This link expires in <strong>24 hours</strong>.
                </p>
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:#0f0f0f;border-radius:3px;">
                      <a href="{verify_url}"
                         style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.02em;">
                        Verify Email Address →
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:28px 0 0;font-size:13px;color:#999;line-height:1.6;">
                  Or copy this link into your browser:<br>
                  <a href="{verify_url}" style="color:#ff5e5f;word-break:break-all;">{verify_url}</a>
                </p>
                <hr style="margin:32px 0;border:none;border-top:1px solid #e8e8e6;">
                <p style="margin:0;font-size:13px;color:#999;line-height:1.6;">
                  If you didn't create a GRADSKOOL account, ignore this email — your address will not be used.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:20px 40px;background:#fafaf9;border-top:1px solid #e8e8e6;">
                <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;color:#aaa;text-align:center;">
                  GRADSKOOL · India's most structured MBA entrance preparation ·
                  <a href="https://gradskool.in" style="color:#aaa;">gradskool.in</a>
                </p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """

    return _send(user.email, 'Verify your GRADSKOOL account', html)


def send_welcome_email(user) -> bool:
    """Sent after email is successfully verified."""
    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Welcome to GRADSKOOL</title></head>
    <body style="margin:0;padding:0;background:#f5f5f3;font-family:Georgia,'Times New Roman',serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f3;padding:40px 20px;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e8e8e6;border-radius:4px;overflow:hidden;">
            <tr>
              <td style="background:#0f0f0f;padding:28px 40px;">
                <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:20px;font-weight:700;letter-spacing:0.05em;color:#ffffff;">
                  GRAD<span style="color:#ff5e5f;">SKOOL</span>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:40px;">
                <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#ff5e5f;">
                  Account Verified
                </p>
                <h1 style="margin:0 0 20px;font-size:26px;line-height:1.15;color:#0f0f0f;font-weight:700;">
                  Welcome to GRADSKOOL,<br>{user.first_name or 'Aspirant'}.
                </h1>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#555;">
                  Your account is now active. Explore free tools, browse courses,
                  or WhatsApp us to find the right plan for your preparation.
                </p>
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:#ff5e5f;border-radius:3px;">
                      <a href="https://gradskool.in/tools"
                         style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">
                        Explore Free Tools →
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 40px;background:#fafaf9;border-top:1px solid #e8e8e6;">
                <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;color:#aaa;text-align:center;">
                  GRADSKOOL · <a href="https://gradskool.in" style="color:#aaa;">gradskool.in</a>
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """

    return _send(user.email, f'Welcome to GRADSKOOL, {user.first_name}!', html)


def send_password_reset_email(user, token: str) -> bool:
    """Send password reset link."""
    reset_url = f"{settings.PASSWORD_RESET_URL}?token={token}"

    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Reset your GRADSKOOL password</title></head>
    <body style="margin:0;padding:0;background:#f5f5f3;font-family:Georgia,'Times New Roman',serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f3;padding:40px 20px;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e8e8e6;border-radius:4px;overflow:hidden;">
            <tr>
              <td style="background:#0f0f0f;padding:28px 40px;">
                <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:20px;font-weight:700;letter-spacing:0.05em;color:#ffffff;">
                  GRAD<span style="color:#ff5e5f;">SKOOL</span>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:40px;">
                <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#ff5e5f;">
                  Password Reset
                </p>
                <h1 style="margin:0 0 20px;font-size:26px;line-height:1.15;color:#0f0f0f;font-weight:700;">
                  Reset your password
                </h1>
                <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#555;">
                  We received a request to reset the password for your account (<strong>{user.email}</strong>).
                  This link expires in <strong>1 hour</strong>.
                </p>
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:#0f0f0f;border-radius:3px;">
                      <a href="{reset_url}"
                         style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">
                        Reset Password →
                      </a>
                    </td>
                  </tr>
                </table>
                <hr style="margin:32px 0;border:none;border-top:1px solid #e8e8e6;">
                <p style="margin:0;font-size:13px;color:#999;line-height:1.6;">
                  If you didn't request a password reset, you can safely ignore this email.
                  Your password will not be changed.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 40px;background:#fafaf9;border-top:1px solid #e8e8e6;">
                <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;color:#aaa;text-align:center;">
                  GRADSKOOL · <a href="https://gradskool.in" style="color:#aaa;">gradskool.in</a>
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """

    return _send(user.email, 'Reset your GRADSKOOL password', html)