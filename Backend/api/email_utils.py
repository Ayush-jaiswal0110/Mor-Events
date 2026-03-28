"""
email_utils.py — Gmail SMTP confirmation email for MorEvents registrations.
Uses Python's built-in smtplib — no extra pip packages required.
"""

import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "moreventsofficial@gmail.com")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587


def _format_date(date_str: str) -> str:
    """Convert ISO date to human-readable format, e.g. '2026-04-19' → '19 April 2026'."""
    try:
        from datetime import datetime
        dt = datetime.strptime(date_str[:10], "%Y-%m-%d")
        return dt.strftime("%-d %B %Y")
    except Exception:
        return date_str


def _build_html(reg: dict, event: dict) -> str:
    event_name = event.get("name", "the event")
    event_date = _format_date(event.get("date", ""))
    event_venue = event.get("venue", "the venue")
    amount = event.get("price", 0)
    user_name = reg.get("name", "Adventurer")
    reg_number = reg.get("registrationNumber", reg.get("_id", ""))

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
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">🏕️ MorEvents</h1>
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


def send_confirmation_email(reg: dict, event: dict) -> bool:
    """
    Send a booking confirmation email to the registrant.
    Returns True on success, False on failure (caller should not raise).
    """
    recipient = reg.get("email")
    if not recipient:
        logger.warning("No recipient email in registration — skipping confirmation mail.")
        return False

    if not EMAIL_HOST_PASSWORD:
        logger.warning("EMAIL_HOST_PASSWORD not configured — skipping confirmation mail.")
        return False

    event_name = event.get("name", "the event")
    user_name = reg.get("name", "Adventurer")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Booking Confirmed! 🎉 — {event_name} | MorEvents"
    msg["From"] = f"MorEvents <{EMAIL_HOST_USER}>"
    msg["To"] = recipient
    msg["Reply-To"] = EMAIL_HOST_USER

    # Plain-text fallback
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
    msg.attach(MIMEText(plain_text, "plain"))
    msg.attach(MIMEText(_build_html(reg, event), "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
            server.sendmail(EMAIL_HOST_USER, [recipient], msg.as_string())
        logger.info(f"Confirmation email sent to {recipient}")
        return True
    except Exception as exc:
        logger.error(f"Failed to send confirmation email to {recipient}: {exc}")
        return False
