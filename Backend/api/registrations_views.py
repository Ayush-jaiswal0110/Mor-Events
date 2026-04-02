import math
import uuid
import csv
from datetime import datetime
from django.http import HttpResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .database import registrations_collection, events_collection
from .utils import login_required
from .events_views import clean_mongo_dict
from .email_utils import send_confirmation_email, send_whatsapp_invite_email, send_payment_failed_email
import threading

@api_view(['GET', 'POST'])
def registrations_list(request):
    if request.method == 'GET':
        @login_required
        def get_regs(req):
            query = {}
            event_id = req.GET.get('eventId')
            payment_status = req.GET.get('paymentStatus')
            
            if event_id:
                query['eventId'] = event_id
            if payment_status:
                query['paymentStatus'] = payment_status

            limit = int(req.GET.get('limit', 20))
            page = int(req.GET.get('page', 1))
            skip = (page - 1) * limit

            total_items = registrations_collection.count_documents(query)
            cursor = registrations_collection.find(query).skip(skip).limit(limit)
            
            cursor.sort([("registeredAt", -1)])
            regs = [clean_mongo_dict(doc) for doc in cursor]
            
            return Response({
                "success": True,
                "data": regs,
                "pagination": {
                    "currentPage": page,
                    "totalPages": math.ceil(total_items / limit) if limit else 1,
                    "totalItems": total_items,
                    "itemsPerPage": limit
                }
            }, status=status.HTTP_200_OK)
        return get_regs(request)

    elif request.method == 'POST':
        data = request.data
        reg_id = f"reg_{uuid.uuid4().hex[:8]}"
        reg_num = f"MOR{datetime.now().year}{str(registrations_collection.count_documents({}) + 1).zfill(3)}"
        
        event = events_collection.find_one({"_id": data.get('eventId')})
        if not event:
            return Response({"success": False, "message": "Event not found"}, status=status.HTTP_404_NOT_FOUND)
            
        new_reg = {
            "_id": reg_id,
            "registrationNumber": reg_num,
            "name": data.get('name'),
            "email": data.get('email'),
            "phone": data.get('phone'),
            "eventId": data.get('eventId'),
            "eventName": event.get('name', ''),
            "paymentStatus": data.get('paymentStatus', 'pending'), # Might be provided by external integrations initially or purely pending
            "paymentId": data.get('paymentId', ''),
            "paymentMethod": data.get('paymentMethod', 'pending'),
            "paymentScreenshot": data.get('paymentScreenshot', ''),
            "amount": event.get('price', 0),
            "emergencyContact": data.get('emergencyContact', ''),
            "medicalConditions": data.get('medicalConditions', ''),
            "dietaryRestrictions": data.get('dietaryRestrictions', ''),
            "registeredAt": datetime.utcnow().isoformat() + 'Z'
        }
        
        registrations_collection.insert_one(new_reg)
        
        # Send confirmation email asynchronously so it doesn't block the response
        def send_email_task():
            send_confirmation_email(new_reg, event)
            
        threading.Thread(target=send_email_task).start()

        return Response({
            "success": True,
            "message": "Registration successful",
            "data": clean_mongo_dict(new_reg)
        }, status=status.HTTP_201_CREATED)

@api_view(['GET', 'DELETE'])
@login_required
def registration_detail(request, pk):
    if request.method == 'GET':
        reg = registrations_collection.find_one({"_id": pk})
        if not reg:
            return Response({"success": False, "message": "Registration not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            "success": True,
            "data": clean_mongo_dict(reg)
        }, status=status.HTTP_200_OK)
        
    elif request.method == 'DELETE':
        result = registrations_collection.delete_one({"_id": pk})
        if result.deleted_count == 0:
            return Response({"success": False, "message": "Registration not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            "success": True,
            "message": "Registration cancelled successfully"
        }, status=status.HTTP_200_OK)

@api_view(['PATCH'])
@login_required
def registration_payment(request, pk):
    data = request.data
    updates = {
        "paymentStatus": data.get('paymentStatus'),
        "paymentId": data.get('paymentId'),
        "transactionDate": data.get('transactionDate', datetime.utcnow().isoformat() + 'Z')
    }
    # clean None values
    updates = {k: v for k, v in updates.items() if v is not None}
    
    result = registrations_collection.update_one({"_id": pk}, {"$set": updates})
    if result.matched_count == 0:
        return Response({"success": False, "message": "Registration not found"}, status=status.HTTP_404_NOT_FOUND)

    # If payment was marked as failed, send cancellation email asynchronously
    if data.get('paymentStatus') == 'failed':
        reg = registrations_collection.find_one({"_id": pk})
        if reg:
            event = events_collection.find_one({"_id": reg.get("eventId")})
            if event:
                def send_failed_email_task():
                    send_payment_failed_email(reg, event)
                threading.Thread(target=send_failed_email_task).start()

    return Response({
        "success": True,
        "message": "Payment status updated successfully"
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@login_required
def export_registrations(request):
    event_id = request.GET.get('eventId')
    query = {}
    if event_id:
        query['eventId'] = event_id
        
    regs = list(registrations_collection.find(query))
    
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="registrations.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['Registration ID', 'Name', 'Email', 'Phone', 'Event', 'Payment Status', 'Payment Method', 'Screenshot URL', 'Amount', 'Registered At'])
    
    for r in regs:
        writer.writerow([
            r.get('registrationNumber', r.get('_id')),
            r.get('name'),
            r.get('email'),
            r.get('phone'),
            r.get('eventName'),
            r.get('paymentStatus'),
            r.get('paymentMethod', 'unknown'),
            r.get('paymentScreenshot', ''),
            r.get('amount'),
            r.get('registeredAt')
        ])
        
    return response

@api_view(['POST'])
@login_required
def invite_whatsapp(request):
    event_id = request.data.get('eventId')
    whatsapp_link = request.data.get('link')
    
    if not event_id or not whatsapp_link:
        return Response({"success": False, "message": "eventId and WhatsApp link are required"}, status=status.HTTP_400_BAD_REQUEST)
        
    event = events_collection.find_one({"id": event_id}) # Note: wait, in previous code event is searched by `{"_id": pk}` or `{"id": pk}` depending on context. Let's use `find_one` properly.
    if not event:
        # Some endpoints used format {"_id": event_id}. Let's fall back gracefully.
        event = events_collection.find_one({"_id": event_id})
        
    if not event:
        return Response({"success": False, "message": "Event not found"}, status=status.HTTP_404_NOT_FOUND)
        
    event_name = event.get('name', 'MorEvents Adventure')
    
    # Get all users for this event
    regs = list(registrations_collection.find({"eventId": event_id}))
    if len(regs) == 0:
        return Response({"success": False, "message": "No registrations found for this event"}, status=status.HTTP_400_BAD_REQUEST)
        
    # Start thread to prevent connection block
    def trigger_emails():
        send_whatsapp_invite_email(regs, event_name, whatsapp_link)
        
    threading.Thread(target=trigger_emails).start()
    
    return Response({
        "success": True,
        "message": f"WhatsApp community invite queued for {len(regs)} attendees."
    }, status=status.HTTP_200_OK)
