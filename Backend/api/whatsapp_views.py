import os
import requests
import logging
import uuid
from datetime import datetime
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .utils import login_required
from .database import members_collection, events_collection

logger = logging.getLogger(__name__)

def normalize_phone(phone_str):
    if not phone_str:
        return ""
    # Strip spaces, plus, hyphens, and parentheses
    clean = "".join(c for c in phone_str if c.isdigit())
    
    # Strip leading zeros or 00
    if clean.startswith("00"):
        clean = clean[2:]
    elif clean.startswith("0"):
        clean = clean[1:]
        
    # If the number is 10 digits, default prefix to 91 (India)
    if len(clean) == 10:
        clean = "91" + clean
    return clean

def send_whatsapp_message(to_phone, payload):
    phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
    access_token = os.getenv("WHATSAPP_ACCESS_TOKEN")
    
    if not phone_id or not access_token:
        print("[WhatsApp ERROR] Credentials missing in environment variables.")
        return False, {"error": "Missing credentials"}
        
    url = f"https://graph.facebook.com/v25.0/{phone_id}/messages"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        res_data = response.json()
        print(f"[WhatsApp API] Status: {response.status_code} | To: {to_phone} | Response: {res_data}")
        success = response.status_code in [200, 201]
        return success, res_data
    except Exception as e:
        print(f"[WhatsApp EXCEPTION] {str(e)}")
        return False, {"error": str(e)}

def build_welcome_template_payload(to_phone, name, order_id=None, reg_date=None):
    """
    Builds the WhatsApp template payload for the welcome message.
    Automatically includes an image header component if WHATSAPP_TEMPLATE_HEADER_IMAGE_URL is set,
    matching the template structure created in Meta Business Manager.
    """
    template_name = os.getenv("WHATSAPP_TEMPLATE_NAME", "jaspers_market_order_confirmation_v1")
    header_image_url = os.getenv("WHATSAPP_TEMPLATE_HEADER_IMAGE_URL", "")
    
    components = []
    
    # Add image header component if the template has one
    if header_image_url:
        components.append({
            "type": "header",
            "parameters": [
                {
                    "type": "image",
                    "image": { "link": header_image_url }
                }
            ]
        })
    
    # Build body parameters based on template type
    if template_name == "jaspers_market_order_confirmation_v1":
        if not order_id:
            order_id = "ORDER"
        if not reg_date:
            reg_date = datetime.now().strftime("%b %d, %Y")
        body_params = [
            { "type": "text", "text": name },
            { "type": "text", "text": order_id },
            { "type": "text", "text": reg_date }
        ]
    else:
        # Custom template (e.g. mor_events_welcome_member) — only {{1}} = name
        body_params = [
            { "type": "text", "text": name }
        ]
    
    components.append({
        "type": "body",
        "parameters": body_params
    })
    
    payload = {
        "messaging_product": "whatsapp",
        "to": to_phone,
        "type": "template",
        "template": {
            "name": template_name,
            "language": { "code": "en" },
            "components": components
        }
    }
    print(f"[WhatsApp] Built payload for {to_phone}: header_image={'yes' if header_image_url else 'no'}, template={template_name}")
    return payload

def send_default_menu(to_phone):
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to_phone,
        "type": "interactive",
        "interactive": {
            "type": "button",
            "body": {
                "text": "How can we help you today? Please choose one of the options below to explore Mor Events:"
            },
            "action": {
                "buttons": [
                    {
                        "type": "reply",
                        "reply": {
                            "id": "previous_events",
                            "title": "Previous Events 📸"
                        }
                    },
                    {
                        "type": "reply",
                        "reply": {
                            "id": "upcoming_events",
                            "title": "Upcoming Events 📅"
                        }
                    }
                ]
            }
        }
    }
    success, _ = send_whatsapp_message(to_phone, payload)
    return success

def send_previous_events(to_phone):
    # Fetch up to 3 completed events
    cursor = events_collection.find({"status": "completed"}).sort("date", -1).limit(3)
    events = list(cursor)
    
    if not events:
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to_phone,
            "type": "text",
            "text": {
                "body": "We don't have any past events recorded in our system yet. Stay tuned!"
            }
        }
        send_whatsapp_message(to_phone, payload)
        return
        
    intro_payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to_phone,
        "type": "text",
        "text": {
            "body": "📸 Here are some of our previous amazing adventures:"
        }
    }
    send_whatsapp_message(to_phone, intro_payload)
    
    for event in events:
        name = event.get('name', 'Adventure Tour')
        date_str = event.get('date', 'Past')
        venue = event.get('venue', 'Various locations')
        desc = event.get('shortDescription', event.get('description', ''))
        
        caption = f"\U0001f31f {name}\n\U0001f4c5 Date: {date_str}\n\U0001f4cd Venue: {venue}\n\n{desc}"
        
        images = event.get('images', [])
        image_url = images[0] if images else None
        
        if image_url:
            payload = {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": to_phone,
                "type": "image",
                "image": {
                    "link": image_url,
                    "caption": caption[:1024]
                }
            }
        else:
            payload = {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": to_phone,
                "type": "text",
                "text": {
                    "body": caption[:4096]
                }
            }
        send_whatsapp_message(to_phone, payload)

def send_upcoming_events(to_phone):
    # Fetch up to 3 upcoming events
    cursor = events_collection.find({"status": "upcoming"}).sort("date", 1).limit(3)
    events = list(cursor)
    
    if not events:
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to_phone,
            "type": "text",
            "text": {
                "body": "No upcoming events scheduled at the moment. Please visit our website morevents.in to stay updated!"
            }
        }
        send_whatsapp_message(to_phone, payload)
        return
        
    intro_payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to_phone,
        "type": "text",
        "text": {
            "body": "📅 Here are our upcoming events. Register now to secure your spot!"
        }
    }
    send_whatsapp_message(to_phone, intro_payload)
    
    for event in events:
        event_id = event.get('_id', event.get('id'))
        name = event.get('name', 'Adventure Tour')
        date_str = event.get('date', 'Coming Soon')
        venue = event.get('venue', 'Various locations')
        price = event.get('price', 0)
        desc = event.get('shortDescription', event.get('description', ''))
        
        registration_url = f"https://morevents.in/events/{event_id}"
        caption = f"🚀 {name}\n📅 Date: {date_str}\n📍 Venue: {venue}\n💰 Price: ₹{price}\n\n{desc}\n\n👉 Register here: {registration_url}"
        
        images = event.get('images', [])
        image_url = images[0] if images else None
        
        if image_url:
            payload = {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": to_phone,
                "type": "image",
                "image": {
                    "link": image_url,
                    "caption": caption[:1024]
                }
            }
        else:
            payload = {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": to_phone,
                "type": "text",
                "text": {
                    "body": caption[:4096]
                }
            }
        send_whatsapp_message(to_phone, payload)

@api_view(['POST'])
def register_member(request):
    data = request.data
    name = data.get('name')
    email = data.get('email')
    phone_raw = data.get('phone')
    
    if not name or not phone_raw:
        return Response({"success": False, "message": "Name and Phone number are required."}, status=status.HTTP_400_BAD_REQUEST)
        
    phone = normalize_phone(phone_raw)
    
    # Check if already exists
    existing = members_collection.find_one({"phone": phone})
    if existing:
        return Response({"success": True, "message": "You are already registered as a lifetime member!"}, status=status.HTTP_200_OK)
        
    member_id = f"mem_{uuid.uuid4().hex[:8]}"
    new_member = {
        "_id": member_id,
        "name": name,
        "email": email or "",
        "phone": phone,
        "whatsappStatus": "pending",
        "registeredAt": datetime.utcnow().isoformat() + 'Z'
    }
    
    members_collection.insert_one(new_member)
    
    return Response({
        "success": True,
        "message": "Registered successfully! Welcome to Mor Events.",
        "data": {
            "id": member_id,
            "name": name,
            "phone": phone
        }
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@login_required
def broadcast_welcome(request):
    # Fetch members with status 'pending' OR 'failed' to allow retries
    pending_members = list(members_collection.find({"whatsappStatus": {"$in": ["pending", "failed"]}}))
    
    if not pending_members:
        return Response({"success": True, "message": "No pending or failed members to broadcast to."}, status=status.HTTP_200_OK)
        
    success_count = 0
    fail_count = 0
    
    # Default to the sandbox test template
    template_name = os.getenv("WHATSAPP_TEMPLATE_NAME", "jaspers_market_order_confirmation_v1")
    
    for member in pending_members:
        # Dynamically normalize retrieved number and clean database if stored with a leading zero
        to_phone = normalize_phone(member.get('phone'))
        if to_phone != member.get('phone'):
            members_collection.update_one({"_id": member["_id"]}, {"$set": {"phone": to_phone}})
            
        name = member.get('name', 'Explorer')
        order_id = member.get('_id', '').replace("mem_", "").upper()
        reg_date = datetime.now().strftime("%b %d, %Y")
        
        payload = build_welcome_template_payload(to_phone, name, order_id, reg_date)
            
        is_sent, _ = send_whatsapp_message(to_phone, payload)
        if is_sent:
            members_collection.update_one({"_id": member["_id"]}, {"$set": {"whatsappStatus": "initiated"}})
            success_count += 1
        else:
            members_collection.update_one({"_id": member["_id"]}, {"$set": {"whatsappStatus": "failed"}})
            fail_count += 1
            
    return Response({
        "success": True,
        "message": f"Broadcast complete. Successfully sent: {success_count}, Failed: {fail_count}."
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@login_required
def list_members(request):
    limit = int(request.GET.get('limit', 50))
    page = int(request.GET.get('page', 1))
    skip = (page - 1) * limit
    
    total = members_collection.count_documents({})
    cursor = members_collection.find({}).skip(skip).limit(limit).sort("registeredAt", -1)
    
    from .events_views import clean_mongo_dict
    members = [clean_mongo_dict(m) for m in cursor]
    
    return Response({
        "success": True,
        "data": members,
        "pagination": {
            "currentPage": page,
            "totalPages": (total // limit) + (1 if total % limit > 0 else 0),
            "totalItems": total
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET', 'POST'])
def whatsapp_webhook(request):
    print("=" * 50)
    print("WEBHOOK HIT")
    print(request.method)
    if request.method == 'GET':
        mode = request.GET.get('hub.mode')
        token = request.GET.get('hub.verify_token')
        challenge = request.GET.get('hub.challenge')
        expected_token = os.getenv("WHATSAPP_VERIFY_TOKEN", "morevents_whatsapp_verify_token_2026")
        
        if mode == 'subscribe' and token == expected_token:
            logger.info("Webhook verified successfully!")
            from django.http import HttpResponse
            return HttpResponse(challenge, content_type="text/plain")
        else:
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
            
    elif request.method == 'POST':
        data = request.data
        logger.info(f"Received WhatsApp webhook data: {data}")
        
        try:
            entry = data.get('entry', [])[0]
            change = entry.get('changes', [])[0]
            value = change.get('value', {})
            messages = value.get('messages', [])
            
            if messages:
                message = messages[0]
                from_phone = message.get('from')
                msg_type = message.get('type')
                
                # Check user intent from reply button payload or text
                user_intent = None
                
                if msg_type == 'button':
                    payload = message.get('button', {}).get('payload', '')
                    user_intent = payload
                elif msg_type == 'interactive':
                    interactive = message.get('interactive', {})
                    interactive_type = interactive.get('type')
                    if interactive_type == 'button_reply':
                        user_intent = interactive.get('button_reply', {}).get('id', '')
                elif msg_type == 'text':
                    body = message.get('text', {}).get('body', '').strip().lower()
                    if 'prev' in body or 'past' in body or '1' == body:
                        user_intent = 'previous_events'
                    elif 'up' in body or 'next' in body or '2' == body:
                        user_intent = 'upcoming_events'
                
                # Update status in db if we get any message back from them
                members_collection.update_one(
                    {"phone": from_phone},
                    {"$set": {"whatsappStatus": "active"}}
                )
                
                # Route request
                if user_intent == 'previous_events':
                    send_previous_events(from_phone)
                elif user_intent == 'upcoming_events':
                    send_upcoming_events(from_phone)
                else:
                    send_default_menu(from_phone)
        except Exception as e:
            logger.error(f"Error processing webhook message: {str(e)}")
            
        return Response({"status": "ok"}, status=status.HTTP_200_OK)

@api_view(['PATCH'])
@login_required
def update_member_phone(request, pk):
    data = request.data
    phone_raw = data.get('phone')
    if not phone_raw:
        return Response({"success": False, "message": "Phone number is required."}, status=status.HTTP_400_BAD_REQUEST)
        
    phone = normalize_phone(phone_raw)
    result = members_collection.update_one({"_id": pk}, {"$set": {"phone": phone, "whatsappStatus": "pending"}})
    
    if result.matched_count == 0:
        return Response({"success": False, "message": "Member not found"}, status=status.HTTP_404_NOT_FOUND)
        
    return Response({
        "success": True, 
        "message": "Phone number updated successfully and status reset to pending.", 
        "data": {"phone": phone}
    }, status=status.HTTP_200_OK)

@api_view(['DELETE'])
@login_required
def delete_member(request, pk):
    result = members_collection.delete_one({"_id": pk})
    if result.deleted_count == 0:
        return Response({"success": False, "message": "Member not found"}, status=status.HTTP_404_NOT_FOUND)
    return Response({"success": True, "message": "Member deleted successfully."}, status=status.HTTP_200_OK)

@api_view(['POST'])
@login_required
def retry_member(request, pk):
    import traceback
    try:
        member = members_collection.find_one({"_id": pk})
        if not member:
            return Response({"success": False, "message": "Member not found"}, status=status.HTTP_404_NOT_FOUND)
            
        to_phone = normalize_phone(member.get('phone', ''))
        if not to_phone:
            return Response({"success": False, "message": "Member has no phone number."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Fix DB if phone was stored incorrectly
        if to_phone != member.get('phone'):
            members_collection.update_one({"_id": pk}, {"$set": {"phone": to_phone}})
            print(f"[WhatsApp] Fixed phone {member.get('phone')} -> {to_phone} for member {pk}")
            
        name = member.get('name', 'Explorer')
        order_id = member.get('_id', '').replace("mem_", "").upper()
        reg_date = datetime.now().strftime("%b %d, %Y")
        
        payload = build_welcome_template_payload(to_phone, name, order_id, reg_date)
            
        is_sent, api_response = send_whatsapp_message(to_phone, payload)

        print(f"[WhatsApp Retry] is_sent={is_sent} | api_response={api_response}")
        
        if is_sent:
            members_collection.update_one({"_id": pk}, {"$set": {"whatsappStatus": "initiated"}})
            return Response({"success": True, "message": f"Welcome greeting sent successfully to {to_phone}."})
        else:
            members_collection.update_one({"_id": pk}, {"$set": {"whatsappStatus": "failed"}})
            error_msg = api_response.get('error', {}).get('message', str(api_response)) if isinstance(api_response, dict) else str(api_response)
            return Response({"success": False, "message": f"Meta API Error: {error_msg}"}, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        tb = traceback.format_exc()
        print(f"[WhatsApp RETRY EXCEPTION]\n{tb}")
        return Response({"success": False, "message": f"Server error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
