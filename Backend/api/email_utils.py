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
              <img src="cid:logo_img" alt="MorEvents Logo" style="width:80px;height:80px;border-radius:50%;margin-bottom:12px;border:3px solid rgba(255,255,255,0.5);" />
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
    
    html_part = MIMEMultipart("related")
    html_part.attach(MIMEText(_build_html(reg, event), "html"))

    try:
        from email.mime.image import MIMEImage
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        root_dir = os.path.dirname(backend_dir)
        logo_path = os.path.join(root_dir, "src", "assets", "84eb31f383e3c5c569c8f83a91ad8f1d232586a2.png")
        if os.path.exists(logo_path):
            with open(logo_path, 'rb') as f:
                img_data = f.read()
            image = MIMEImage(img_data, name="logo.png")
            image.add_header('Content-ID', '<logo_img>')
            image.add_header('Content-Disposition', 'inline', filename='logo.png')
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
            server.sendmail(EMAIL_HOST_USER, [recipient], msg.as_string())
        logger.info(f"Confirmation email sent to {recipient}")
        return True
    except Exception as exc:
        logger.error(f"Failed to send confirmation email to {recipient}: {exc}")
        return False

def send_whatsapp_invite_email(registrations: list, event_name: str, whatsapp_link: str) -> dict:
    """
    Sends a WhatsApp community invite to a list of users.
    Returns tracking info.
    """
    if not EMAIL_HOST_PASSWORD:
        logger.warning("EMAIL_HOST_PASSWORD not configured — skipping whatsapp invite.")
        return {"success": False, "message": "Email not configured"}

    sent_count = 0
    failed_count = 0

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)

            for reg in registrations:
                recipient = reg.get("email")
                if not recipient:
                    continue

                user_name = reg.get("name", "Adventurer")

                msg = MIMEMultipart("alternative")
                msg["Subject"] = f"Join the WhatsApp Community! 💬 — {event_name} | MorEvents"
                msg["From"] = f"MorEvents <{EMAIL_HOST_USER}>"
                msg["To"] = recipient
                msg["Reply-To"] = EMAIL_HOST_USER

                plain_text = (
                    f"Hi {user_name},\n\n"
                    f"Get ready for {event_name}! 🎉\n\n"
                    f"Please join our official WhatsApp Community to get all the latest updates, connect with fellow travelers, and receive important instructions.\n\n"
                    f"Join here: {whatsapp_link}\n\n"
                    f"— Team MorEvents"
                )

                html_content = f"""
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
                              <img src="cid:logo_img" alt="MorEvents Logo" style="width:64px;height:64px;border-radius:50%;margin-bottom:12px;border:2px solid rgba(255,255,255,0.4);" />
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

                msg.attach(MIMEText(plain_text, "plain"))
                
                html_part = MIMEMultipart("related")
                html_part.attach(MIMEText(html_content, "html"))
                
                try:
                    from email.mime.image import MIMEImage
                    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                    root_dir = os.path.dirname(backend_dir)
                    logo_path = os.path.join(root_dir, "src", "assets", "84eb31f383e3c5c569c8f83a91ad8f1d232586a2.png")
                    if os.path.exists(logo_path):
                        with open(logo_path, 'rb') as f:
                            img_data = f.read()
                        image = MIMEImage(img_data, name="logo.png")
                        image.add_header('Content-ID', '<logo_img>')
                        image.add_header('Content-Disposition', 'inline', filename='logo.png')
                        html_part.attach(image)
                except Exception as e:
                    logger.error(f"Failed to attach logo: {e}")

                msg.attach(html_part)

                try:
                    server.sendmail(EMAIL_HOST_USER, [recipient], msg.as_string())
                    sent_count += 1
                except Exception as e:
                    logger.error(f"Failed to send WA invite to {recipient}: {e}")
                    failed_count += 1
                    
        return {"success": True, "sent": sent_count, "failed": failed_count}
    except Exception as exc:
        logger.error(f"SMTP Server connection failed for broadcast: {exc}")
        return {"success": False, "message": str(exc)}


def _build_failed_html(reg: dict, event: dict) -> str:
    event_name = event.get("name", "the event")
    event_date = _format_date(event.get("date", ""))
    user_name = reg.get("name", "Adventurer")
    reg_number = reg.get("registrationNumber", reg.get("_id", ""))

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
              <img src="cid:logo_img" alt="MorEvents Logo" style="width:80px;height:80px;border-radius:50%;margin-bottom:12px;border:3px solid rgba(255,255,255,0.5);" />
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


def send_payment_failed_email(reg: dict, event: dict) -> bool:
    """
    Send a payment-failed / registration-cancelled email to the registrant.
    Returns True on success, False on failure.
    """
    recipient = reg.get("email")
    if not recipient:
        logger.warning("No recipient email in registration — skipping failed payment mail.")
        return False

    if not EMAIL_HOST_PASSWORD:
        logger.warning("EMAIL_HOST_PASSWORD not configured — skipping failed payment mail.")
        return False

    event_name = event.get("name", "the event")
    user_name = reg.get("name", "Adventurer")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Registration Cancelled ❌ — {event_name} | MorEvents"
    msg["From"] = f"MorEvents <{EMAIL_HOST_USER}>"
    msg["To"] = recipient
    msg["Reply-To"] = EMAIL_HOST_USER

    plain_text = (
        f"Hi {user_name},\n\n"
        f"We regret to inform you that your registration for {event_name} has been CANCELLED.\n\n"
        f"Reason: The payment screenshot you submitted could not be verified. It appears to be incorrect or invalid.\n\n"
        f"What you can do:\n"
        f"  - Re-register with a valid payment screenshot.\n"
        f"  - Ensure the screenshot clearly shows the transaction ID, amount, and recipient.\n"
        f"  - If you believe this is a mistake, contact us immediately.\n\n"
        f"Booking ID: {reg.get('registrationNumber', reg.get('_id', ''))}\n\n"
        f"For queries: moreventsofficial@gmail.com | +91 70248 96018\n\n"
        f"— Team MorEvents"
    )
    msg.attach(MIMEText(plain_text, "plain"))

    html_part = MIMEMultipart("related")
    html_part.attach(MIMEText(_build_failed_html(reg, event), "html"))

    try:
        from email.mime.image import MIMEImage
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        root_dir = os.path.dirname(backend_dir)
        logo_path = os.path.join(root_dir, "src", "assets", "84eb31f383e3c5c569c8f83a91ad8f1d232586a2.png")
        if os.path.exists(logo_path):
            with open(logo_path, 'rb') as f:
                img_data = f.read()
            image = MIMEImage(img_data, name="logo.png")
            image.add_header('Content-ID', '<logo_img>')
            image.add_header('Content-Disposition', 'inline', filename='logo.png')
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
            server.sendmail(EMAIL_HOST_USER, [recipient], msg.as_string())
        logger.info(f"Payment-failed email sent to {recipient}")
        return True
    except Exception as exc:
        logger.error(f"Failed to send payment-failed email to {recipient}: {exc}")
        return False
