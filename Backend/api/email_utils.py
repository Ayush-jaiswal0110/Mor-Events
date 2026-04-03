"""
email_utils.py — Email sending for MorEvents registrations.

Supports TWO transports (checked in order):
  1. Resend API  — set RESEND_API_KEY  (works on Render / cloud)
  2. Gmail SMTP  — set EMAIL_HOST_PASSWORD (works locally)

If RESEND_API_KEY is present it is always preferred.
"""

import os
import smtplib
import logging
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# ── Resend config ────────────────────────────────────────────────
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "MorEvents <onboarding@resend.dev>")

# ── SMTP config (fallback) ──────────────────────────────────────
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "moreventsofficial@gmail.com")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587


# ═══════════════════════════════════════════════════════════════
#  Unified email dispatcher
# ═══════════════════════════════════════════════════════════════

def _send_email(*, to: str, subject: str, html: str, plain_text: str) -> bool:
    """
    Send an email using the best available transport.
    Returns True on success, False on failure.
    """
    if RESEND_API_KEY:
        return _send_via_resend(to=to, subject=subject, html=html, plain_text=plain_text)
    elif EMAIL_HOST_PASSWORD:
        return _send_via_smtp(to=to, subject=subject, html=html, plain_text=plain_text)
    else:
        logger.warning("No email transport configured (set RESEND_API_KEY or EMAIL_HOST_PASSWORD)")
        return False


def _send_via_resend(*, to: str, subject: str, html: str, plain_text: str) -> bool:
    """Send email via Resend HTTP API (no SMTP needed)."""
    try:
        response = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": RESEND_FROM_EMAIL,
                "to": [to],
                "subject": subject,
                "html": html,
                "text": plain_text,
            },
            timeout=15,
        )
        if response.status_code in (200, 201):
            logger.info(f"[Resend] Email sent to {to} — {response.json()}")
            return True
        else:
            logger.error(f"[Resend] Failed to send to {to}: {response.status_code} {response.text}")
            return False
    except Exception as exc:
        logger.error(f"[Resend] Exception sending to {to}: {exc}")
        return False


def _send_via_smtp(*, to: str, subject: str, html: str, plain_text: str) -> bool:
    """Send email via Gmail SMTP (works locally)."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"MorEvents <{EMAIL_HOST_USER}>"
    msg["To"] = to
    msg["Reply-To"] = EMAIL_HOST_USER

    msg.attach(MIMEText(plain_text, "plain"))

    # Build related part for HTML + inline logo
    html_part = MIMEMultipart("related")
    html_part.attach(MIMEText(html, "html"))

    # Try to attach inline logo
    try:
        from email.mime.image import MIMEImage
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        root_dir = os.path.dirname(backend_dir)
        logo_path = os.path.join(root_dir, "src", "assets", "84eb31f383e3c5c569c8f83a91ad8f1d232586a2.png")
        if os.path.exists(logo_path):
            with open(logo_path, "rb") as f:
                img_data = f.read()
            image = MIMEImage(img_data, name="logo.png")
            image.add_header("Content-ID", "<logo_img>")
            image.add_header("Content-Disposition", "inline", filename="logo.png")
            html_part.attach(image)
    except Exception as e:
        logger.error(f"Failed to attach logo: {e}")

    msg.attach(html_part)

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
            server.sendmail(EMAIL_HOST_USER, [to], msg.as_string())
        logger.info(f"[SMTP] Email sent to {to}")
        return True
    except Exception as exc:
        logger.error(f"[SMTP] Failed to send to {to}: {exc}")
        return False


# ═══════════════════════════════════════════════════════════════
#  Helpers
# ═══════════════════════════════════════════════════════════════

def _format_date(date_str: str) -> str:
    """Convert ISO date to human-readable format, e.g. '2026-04-19' → '19 April 2026'."""
    try:
        from datetime import datetime
        dt = datetime.strptime(date_str[:10], "%Y-%m-%d")
        return dt.strftime("%-d %B %Y")
    except Exception:
        return date_str


def _logo_src() -> str:
    """
    Return the logo <img> src depending on transport.
    - SMTP  → cid:logo_img  (inline attachment)
    - Resend → empty string  (logo skipped in the email)
    """
    if RESEND_API_KEY:
        # Resend doesn't support CID inline images the same way.
        # We return an empty string; the img tag will just not display.
        return ""
    return "cid:logo_img"


# ═══════════════════════════════════════════════════════════════
#  HTML Templates
# ═══════════════════════════════════════════════════════════════

def _build_confirmation_html(reg: dict, event: dict) -> str:
    event_name = event.get("name", "the event")
    event_date = _format_date(event.get("date", ""))
    event_venue = event.get("venue", "the venue")
    amount = event.get("price", 0)
    user_name = reg.get("name", "Adventurer")
    reg_number = reg.get("registrationNumber", reg.get("_id", ""))
    logo = _logo_src()

    logo_block = ""
    if logo:
        logo_block = f'<img src="{logo}" alt="MorEvents Logo" style="width:80px;height:80px;border-radius:50%;margin-bottom:12px;border:3px solid rgba(255,255,255,0.5);" />'

    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Booking Confirmed — MorEvents</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0F3057 0%,#008080 100%);padding:36px 40px;text-align:center;">
              {logo_block}
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">MorEvents</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Travel. Explore. Experience.</p>
            </td>
          </tr>

          <!-- Hero message -->
          <tr>
            <td style="padding:40px 40px 0;text-align:center;">
              <div style="width:64px;height:64px;background:#dcffe4;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:32px;">✅</div>
              <h2 style="margin:0 0 8px;color:#0F3057;font-size:22px;font-weight:700;">Booking Confirmed!</h2>
              <p style="margin:0;color:#555;font-size:15px;line-height:1.6;">
                Hi <strong>{user_name}</strong>, your registration is complete and we've received your payment!<br/>
                Get ready for an unforgettable adventure. 🎒
              </p>
            </td>
          </tr>

          <!-- Event details card -->
          <tr>
            <td style="padding:32px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#f0f7ff;border-radius:12px;border:1px solid #d0e4f7;overflow:hidden;">
                <tr>
                  <td style="padding:24px 28px;">
                    <h3 style="margin:0 0 16px;color:#0F3057;font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">
                      📋 Event Details
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;color:#666;font-size:14px;width:130px;">🎪 Event</td>
                        <td style="padding:6px 0;color:#0F3057;font-size:14px;font-weight:600;">{event_name}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#666;font-size:14px;">📅 Date</td>
                        <td style="padding:6px 0;color:#0F3057;font-size:14px;font-weight:600;">{event_date}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#666;font-size:14px;">📍 Venue</td>
                        <td style="padding:6px 0;color:#0F3057;font-size:14px;font-weight:600;">{event_venue}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#666;font-size:14px;">💰 Amount Paid</td>
                        <td style="padding:6px 0;color:#008080;font-size:14px;font-weight:700;">₹{amount}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#666;font-size:14px;">🎫 Booking ID</td>
                        <td style="padding:6px 0;color:#4B0082;font-size:13px;font-weight:600;font-family:monospace;">{reg_number}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What's next -->
          <tr>
            <td style="padding:28px 40px 0;">
              <h3 style="margin:0 0 12px;color:#0F3057;font-size:15px;font-weight:700;">📌 What's Next?</h3>
              <ul style="margin:0;padding:0 0 0 20px;color:#555;font-size:14px;line-height:2;">
                <li>Our team will contact you with further instructions closer to the event date.</li>
                <li>Please keep your Booking ID handy for any queries.</li>
                <li>Join our WhatsApp group for event updates — link will be shared separately.</li>
              </ul>
            </td>
          </tr>

          <!-- Contact -->
          <tr>
            <td style="padding:28px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#fff8e1;border-radius:12px;border:1px solid #ffe082;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;color:#0F3057;font-size:14px;font-weight:700;">📞 Need Help?</p>
                    <p style="margin:0;color:#666;font-size:13px;line-height:1.7;">
                      📱 +91 70248 96018<br/>
                      📧 moreventsofficial@gmail.com
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 40px;text-align:center;">
              <p style="margin:0;color:#aaa;font-size:12px;line-height:1.8;">
                This is an automated confirmation email from MorEvents.<br/>
                © 2026 MorEvents — Travel. Explore. Experience.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def _build_whatsapp_html(user_name: str, event_name: str, whatsapp_link: str) -> str:
    logo = _logo_src()
    logo_block = ""
    if logo:
        logo_block = f'<img src="{logo}" alt="MorEvents Logo" style="width:64px;height:64px;border-radius:50%;margin-bottom:12px;border:2px solid rgba(255,255,255,0.4);" />'

    return f"""
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:#128C7E;padding:36px;text-align:center;">
              {logo_block}
              <h1 style="margin:0;color:#ffffff;font-size:24px;">💬 Join Our WhatsApp Community</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;text-align:center;">
              <h2 style="margin:0 0 16px;color:#333;">Hi {user_name}!</h2>
              <p style="margin:0 0 24px;color:#555;line-height:1.6;">
                The <strong>{event_name}</strong> is coming up and we are so excited! We have created a WhatsApp group to keep everyone easily updated, share itineraries, and connect before the event.
              </p>
              <a href="{whatsapp_link}" style="display:inline-block;padding:14px 28px;background:#25D366;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
                Join WhatsApp Group
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def _build_failed_html(reg: dict, event: dict) -> str:
    event_name = event.get("name", "the event")
    event_date = _format_date(event.get("date", ""))
    user_name = reg.get("name", "Adventurer")
    reg_number = reg.get("registrationNumber", reg.get("_id", ""))
    logo = _logo_src()

    logo_block = ""
    if logo:
        logo_block = f'<img src="{logo}" alt="MorEvents Logo" style="width:80px;height:80px;border-radius:50%;margin-bottom:12px;border:3px solid rgba(255,255,255,0.5);" />'

    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Registration Cancelled — MorEvents</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7f0000 0%,#c0392b 100%);padding:36px 40px;text-align:center;">
              {logo_block}
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">MorEvents</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Travel. Explore. Experience.</p>
            </td>
          </tr>

          <!-- Hero message -->
          <tr>
            <td style="padding:40px 40px 0;text-align:center;">
              <div style="width:64px;height:64px;background:#fde8e8;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:32px;">❌</div>
              <h2 style="margin:0 0 8px;color:#7f0000;font-size:22px;font-weight:700;">Registration Cancelled</h2>
              <p style="margin:0;color:#555;font-size:15px;line-height:1.6;">
                Hi <strong>{user_name}</strong>, unfortunately your registration for <strong>{event_name}</strong> has been <span style="color:#c0392b;font-weight:700;">cancelled</span>.
              </p>
            </td>
          </tr>

          <!-- Reason card -->
          <tr>
            <td style="padding:28px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#fff5f5;border-radius:12px;border:1px solid #f5c6c6;overflow:hidden;">
                <tr>
                  <td style="padding:24px 28px;">
                    <h3 style="margin:0 0 10px;color:#7f0000;font-size:16px;font-weight:700;">⚠️ Reason for Cancellation</h3>
                    <p style="margin:0;color:#555;font-size:14px;line-height:1.8;">
                      The payment screenshot you submitted could <strong>not be verified</strong>. It appears to be <strong>incorrect or invalid</strong>.
                      As a result, your registration has been cancelled.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Registration details card -->
          <tr>
            <td style="padding:24px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#f0f7ff;border-radius:12px;border:1px solid #d0e4f7;overflow:hidden;">
                <tr>
                  <td style="padding:24px 28px;">
                    <h3 style="margin:0 0 16px;color:#0F3057;font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">📋 Registration Info</h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;color:#666;font-size:14px;width:130px;">🎪 Event</td>
                        <td style="padding:6px 0;color:#0F3057;font-size:14px;font-weight:600;">{event_name}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#666;font-size:14px;">📅 Date</td>
                        <td style="padding:6px 0;color:#0F3057;font-size:14px;font-weight:600;">{event_date}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#666;font-size:14px;">🎫 Booking ID</td>
                        <td style="padding:6px 0;color:#4B0082;font-size:13px;font-weight:600;font-family:monospace;">{reg_number}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What to do next -->
          <tr>
            <td style="padding:28px 40px 0;">
              <h3 style="margin:0 0 12px;color:#0F3057;font-size:15px;font-weight:700;">🔄 What Can You Do?</h3>
              <ul style="margin:0;padding:0 0 0 20px;color:#555;font-size:14px;line-height:2;">
                <li>You may <strong>re-register</strong> with a valid payment screenshot.</li>
                <li>Ensure the screenshot clearly shows the <strong>transaction ID, amount, and recipient</strong>.</li>
                <li>If you believe this is a mistake, please contact us immediately.</li>
              </ul>
            </td>
          </tr>

          <!-- Contact -->
          <tr>
            <td style="padding:28px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#fff8e1;border-radius:12px;border:1px solid #ffe082;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;color:#0F3057;font-size:14px;font-weight:700;">📞 Need Help?</p>
                    <p style="margin:0;color:#666;font-size:13px;line-height:1.7;">
                      📱 +91 70248 96018<br/>
                      📧 moreventsofficial@gmail.com
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 40px;text-align:center;">
              <p style="margin:0;color:#aaa;font-size:12px;line-height:1.8;">
                This is an automated notification from MorEvents.<br/>
                © 2026 MorEvents — Travel. Explore. Experience.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


# ═══════════════════════════════════════════════════════════════
#  Public API — unchanged signatures
# ═══════════════════════════════════════════════════════════════

def send_confirmation_email(reg: dict, event: dict) -> bool:
    """
    Send a booking confirmation email to the registrant.
    Returns True on success, False on failure (caller should not raise).
    """
    recipient = reg.get("email")
    if not recipient:
        logger.warning("No recipient email in registration — skipping confirmation mail.")
        return False

    event_name = event.get("name", "the event")
    user_name = reg.get("name", "Adventurer")

    subject = f"Booking Confirmed! 🎉 — {event_name} | MorEvents"
    plain_text = (
        f"Hi {user_name},\n\n"
        f"Your booking for {event_name} is confirmed! 🎉\n\n"
        f"Event Date: {event.get('date', '')}\n"
        f"Venue: {event.get('venue', '')}\n"
        f"Amount Paid: ₹{event.get('price', 0)}\n"
        f"Booking ID: {reg.get('registrationNumber', reg.get('_id', ''))}\n\n"
        f"Our team will contact you with further details.\n\n"
        f"For queries: moreventsofficial@gmail.com | +91 70248 96018\n\n"
        f"— Team MorEvents"
    )
    html = _build_confirmation_html(reg, event)

    return _send_email(to=recipient, subject=subject, html=html, plain_text=plain_text)


def send_whatsapp_invite_email(registrations: list, event_name: str, whatsapp_link: str) -> dict:
    """
    Sends a WhatsApp community invite to a list of users.
    Returns tracking info.
    """
    sent_count = 0
    failed_count = 0

    for reg in registrations:
        recipient = reg.get("email")
        if not recipient:
            continue

        user_name = reg.get("name", "Adventurer")

        subject = f"Join the WhatsApp Community! 💬 — {event_name} | MorEvents"
        plain_text = (
            f"Hi {user_name},\n\n"
            f"Get ready for {event_name}! 🎉\n\n"
            f"Please join our official WhatsApp Community to get all the latest updates, "
            f"connect with fellow travelers, and receive important instructions.\n\n"
            f"Join here: {whatsapp_link}\n\n"
            f"— Team MorEvents"
        )
        html = _build_whatsapp_html(user_name, event_name, whatsapp_link)

        ok = _send_email(to=recipient, subject=subject, html=html, plain_text=plain_text)
        if ok:
            sent_count += 1
        else:
            failed_count += 1

    return {"success": sent_count > 0, "sent": sent_count, "failed": failed_count}


def send_payment_failed_email(reg: dict, event: dict) -> bool:
    """
    Send a payment-failed / registration-cancelled email to the registrant.
    Returns True on success, False on failure.
    """
    recipient = reg.get("email")
    if not recipient:
        logger.warning("No recipient email in registration — skipping failed payment mail.")
        return False

    event_name = event.get("name", "the event")
    user_name = reg.get("name", "Adventurer")

    subject = f"Registration Cancelled ❌ — {event_name} | MorEvents"
    plain_text = (
        f"Hi {user_name},\n\n"
        f"We regret to inform you that your registration for {event_name} has been CANCELLED.\n\n"
        f"Reason: The payment screenshot you submitted could not be verified. "
        f"It appears to be incorrect or invalid.\n\n"
        f"What you can do:\n"
        f"  - Re-register with a valid payment screenshot.\n"
        f"  - Ensure the screenshot clearly shows the transaction ID, amount, and recipient.\n"
        f"  - If you believe this is a mistake, contact us immediately.\n\n"
        f"Booking ID: {reg.get('registrationNumber', reg.get('_id', ''))}\n\n"
        f"For queries: moreventsofficial@gmail.com | +91 70248 96018\n\n"
        f"— Team MorEvents"
    )
    html = _build_failed_html(reg, event)

    return _send_email(to=recipient, subject=subject, html=html, plain_text=plain_text)
