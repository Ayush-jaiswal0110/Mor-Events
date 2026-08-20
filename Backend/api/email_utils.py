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


def _build_trip_share_html(trip: dict, share: dict, sender_name: str, trip_url: str) -> str:
    destination = trip.get("destination", "your destination")
    start_date = _format_date(trip.get("startDate", ""))
    end_date = _format_date(trip.get("endDate", ""))
    recipient_name = share.get("recipientName") or "there"
    message = share.get("message") or ""
    summary = trip.get("summary") or "A personalized day-wise itinerary planned with MorEvents' AI Trip Planner."

    message_block = ""
    if message:
        message_block = f"""
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#fff8e1;border-radius:12px;border:1px solid #ffe082;margin-top:20px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;color:#0F3057;font-size:13px;font-weight:700;">💬 Personal message from {sender_name}</p>
                    <p style="margin:0;color:#555;font-size:14px;line-height:1.6;font-style:italic;">"{message}"</p>
                  </td>
                </tr>
              </table>
        """

    return f"""
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#0F3057 0%,#4B0082 100%);padding:36px 40px;text-align:center;">
              <img src="cid:logo_img" alt="MorEvents Logo" style="width:72px;height:72px;border-radius:50%;margin-bottom:12px;border:3px solid rgba(255,255,255,0.5);" />
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">✈️ {sender_name} shared a trip with you!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 0;text-align:center;">
              <h2 style="margin:0 0 8px;color:#0F3057;font-size:22px;font-weight:700;">Hi {recipient_name},</h2>
              <p style="margin:0;color:#555;font-size:15px;line-height:1.6;">{sender_name} planned a trip to <strong>{destination}</strong> and wants to share it with you.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border-radius:12px;border:1px solid #d0e4f7;">
                <tr>
                  <td style="padding:24px 28px;">
                    <h3 style="margin:0 0 10px;color:#0F3057;font-size:16px;font-weight:700;">📍 {destination}</h3>
                    <p style="margin:0 0 10px;color:#666;font-size:14px;">📅 {start_date} – {end_date}</p>
                    <p style="margin:0;color:#555;font-size:14px;line-height:1.6;">{summary}</p>
                  </td>
                </tr>
              </table>
              {message_block}
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;text-align:center;">
              <a href="{trip_url}" style="display:inline-block;padding:14px 32px;background:#008080;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">View the Itinerary</a>
              <p style="margin:16px 0 0;color:#999;font-size:12px;">This link only shows the trip itinerary — no personal account information is visible.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;text-align:center;">
              <p style="margin:0;color:#aaa;font-size:12px;line-height:1.8;">Sent via MorEvents Trip Planner. © 2026 MorEvents — Travel. Explore. Experience.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def send_trip_share_email(trip: dict, share: dict, sender_name: str, trip_url: str) -> bool:
    """
    Sends a trip-share email pointing at a secure shared-trip link. Follows
    the same SMTP pattern as the registration emails above so it reuses the
    project's existing (and only) email infrastructure.
    """
    recipient = share.get("recipientEmail")
    if not recipient:
        logger.warning("No recipient email on trip share %s — skipping.", share.get("_id"))
        return False
    if not EMAIL_HOST_PASSWORD:
        logger.warning("EMAIL_HOST_PASSWORD not configured — skipping trip share email.")
        return False

    destination = trip.get("destination", "a trip")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"{sender_name} shared a trip to {destination} with you — MorEvents"
    msg["From"] = f"MorEvents <{EMAIL_HOST_USER}>"
    msg["To"] = recipient
    msg["Reply-To"] = EMAIL_HOST_USER

    plain_text = (
        f"Hi {share.get('recipientName') or 'there'},\n\n"
        f"{sender_name} planned a trip to {destination} and wants to share it with you.\n\n"
        f"View it here: {trip_url}\n\n"
        f"— Sent via MorEvents Trip Planner"
    )
    msg.attach(MIMEText(plain_text, "plain"))

    html_part = MIMEMultipart("related")
    html_part.attach(MIMEText(_build_trip_share_html(trip, share, sender_name, trip_url), "html"))

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
        logger.info(f"Trip share email sent to {recipient}")
        return True
    except Exception as exc:
        logger.error(f"Failed to send trip share email to {recipient}: {exc}")
        return False


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


def broadcast_event_notification(event: dict, is_update: bool = False) -> dict:
    """
    Broadcast email notification to all registered users when an event is created or updated.
    """
    if not EMAIL_HOST_PASSWORD:
        logger.warning("EMAIL_HOST_PASSWORD not configured — skipping event broadcast.")
        return {"success": False, "message": "Email not configured"}

    from .database import users_collection, registrations_collection

    # Fetch unique email addresses from both user accounts and event registrations
    user_emails = set()
    for user in users_collection.find({}, {"email": 1, "name": 1}):
        if user.get("email"):
            user_emails.add((user.get("email"), user.get("name") or "Explorer"))
            
    for reg in registrations_collection.find({}, {"email": 1, "name": 1}):
        if reg.get("email"):
            user_emails.add((reg.get("email"), reg.get("name") or "Explorer"))

    if not user_emails:
        logger.info("No registered users found to send event notification broadcast.")
        return {"success": True, "sent": 0}

    event_name = event.get("name", "New Mor Events Adventure")
    event_date = _format_date(event.get("date", ""))
    event_venue = event.get("venue", "TBA")
    event_price = event.get("price", 0)
    event_desc = event.get("shortDescription") or event.get("description", "")

    action_title = "Update on Event: " + event_name if is_update else "🎉 New Event Announcement: " + event_name
    subject = f"[{'Event Update' if is_update else 'New Event'}] {event_name} — MorEvents"

    sent_count = 0
    failed_count = 0

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)

            for email, name in user_emails:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = f"MorEvents <{EMAIL_HOST_USER}>"
                msg["To"] = email
                msg["Reply-To"] = EMAIL_HOST_USER

                plain_text = (
                    f"Hi {name},\n\n"
                    f"{'An event you might be interested in has been updated!' if is_update else 'Mor Events is excited to announce a new upcoming trip / event!'}\n\n"
                    f"Event: {event_name}\n"
                    f"Date: {event_date}\n"
                    f"Venue: {event_venue}\n"
                    f"Price: ₹{event_price}\n\n"
                    f"Details:\n{event_desc}\n\n"
                    f"Register now on our website to secure your spot!\n\n"
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
                        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
                          <tr>
                            <td style="background:linear-gradient(135deg,#0F3057 0%,#008080 100%);padding:36px;text-align:center;">
                              <h1 style="margin:0;color:#ffffff;font-size:22px;">{action_title}</h1>
                              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">MorEvents • Travel. Explore. Experience.</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:32px;">
                              <h2 style="margin:0 0 12px;color:#0F3057;font-size:18px;">Hello {name},</h2>
                              <p style="margin:0 0 20px;color:#555;line-height:1.6;">
                                {'We have updated the details for an upcoming event you might be looking forward to.' if is_update else 'We are thrilled to launch our next trip/event! Get ready to explore breathtaking destinations.'}
                              </p>
                              <div style="background:#f0f7ff;border:1px solid #d0e4f7;border-radius:12px;padding:20px;margin-bottom:24px;">
                                <h3 style="margin:0 0 10px;color:#0F3057;font-size:16px;">🎪 {event_name}</h3>
                                <p style="margin:4px 0;color:#555;font-size:14px;"><strong>📅 Date:</strong> {event_date}</p>
                                <p style="margin:4px 0;color:#555;font-size:14px;"><strong>📍 Venue:</strong> {event_venue}</p>
                                <p style="margin:4px 0;color:#008080;font-size:14px;"><strong>💰 Price:</strong> ₹{event_price}</p>
                                <p style="margin:12px 0 0;color:#666;font-size:13px;line-height:1.5;">{event_desc}</p>
                              </div>
                              <div style="text-align:center;">
                                <a href="http://localhost:5173" style="display:inline-block;padding:14px 28px;background:#0F3057;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px;">
                                  View Event & Register Now
                                </a>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:20px;text-align:center;background:#f9fafb;border-top:1px solid #eee;">
                              <p style="margin:0;color:#999;font-size:12px;">© 2026 MorEvents — All rights reserved.</p>
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
                msg.attach(MIMEText(html_content, "html"))

                try:
                    server.sendmail(EMAIL_HOST_USER, [email], msg.as_string())
                    sent_count += 1
                except Exception as e:
                    logger.error(f"Failed to send event notification to {email}: {e}")
                    failed_count += 1

        logger.info(f"Event broadcast complete: {sent_count} sent, {failed_count} failed.")
        return {"success": True, "sent": sent_count, "failed": failed_count}
    except Exception as exc:
        logger.error(f"Failed event broadcast SMTP: {exc}")
        return {"success": False, "message": str(exc)}

