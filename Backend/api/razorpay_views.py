import os
import razorpay
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .database import registrations_collection, events_collection
from .events_views import clean_mongo_dict
from .email_utils import send_confirmation_email
import threading
from datetime import datetime
import uuid

# Initialize Razorpay Client
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

client = None
if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

@api_view(['POST'])
def create_order(request):
    if not client:
        return Response({"success": False, "message": "Razorpay keys not configured"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    amount = request.data.get('amount') # in rupees
    if not amount:
        return Response({"success": False, "message": "Amount is required"}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        # Razorpay expects amount in paise (multiply by 100)
        data = { "amount": int(amount) * 100, "currency": "INR", "receipt": str(uuid.uuid4()) }
        payment = client.order.create(data=data)
        
        return Response({
            "success": True,
            "data": payment,
            "keyId": RAZORPAY_KEY_ID
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def verify_payment(request):
    """
    Verifies the payment and inserts the registration into MongoDB
    """
    if not client:
        return Response({"success": False, "message": "Razorpay keys not configured"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    data = request.data
    razorpay_payment_id = data.get('razorpay_payment_id')
    razorpay_order_id = data.get('razorpay_order_id')
    razorpay_signature = data.get('razorpay_signature')
    registration_data = data.get('registrationData')
    
    if not all([razorpay_payment_id, razorpay_order_id, razorpay_signature, registration_data]):
        return Response({"success": False, "message": "Missing necessary payload elements"}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        # Verify the signature
        client.utility.verify_payment_signature({
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        })
        
        # Payment verified, now create registration
        event_id = registration_data.get('eventId')
        event = events_collection.find_one({"_id": event_id})
        if not event:
             return Response({"success": False, "message": "Event not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Generate registration numbers
        prefix = event.get('name', 'MOR')[:3].upper()
        count = registrations_collection.count_documents({"eventId": event_id})
        reg_num = f"{prefix}-{datetime.utcnow().year}-{count + 1:04d}"
        
        reg_id = str(uuid.uuid4())
        
        new_reg = {
            "_id": reg_id,
            "registrationNumber": reg_num,
            "name": registration_data.get('name'),
            "email": registration_data.get('email'),
            "phone": registration_data.get('phone'),
            "eventId": event_id,
            "eventName": event.get('name', ''),
            "paymentStatus": "paid", 
            "paymentId": razorpay_payment_id,
            "paymentMethod": "razorpay",
            "paymentScreenshot": "",
            "amount": event.get('price', 0),
            "emergencyContact": registration_data.get('emergencyContact', ''),
            "medicalConditions": registration_data.get('medicalConditions', ''),
            "dietaryRestrictions": registration_data.get('dietaryRestrictions', ''),
            "registeredAt": datetime.utcnow().isoformat() + 'Z'
        }
        
        registrations_collection.insert_one(new_reg)
        
        # Send email asynchronously
        def send_email_task():
            send_confirmation_email(new_reg, event)
            
        threading.Thread(target=send_email_task).start()

        return Response({
            "success": True,
            "message": "Payment successful and registration complete",
            "data": clean_mongo_dict(new_reg)
        }, status=status.HTTP_201_CREATED)
        
    except razorpay.errors.SignatureVerificationError:
        return Response({"success": False, "message": "Payment verification failed"}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
