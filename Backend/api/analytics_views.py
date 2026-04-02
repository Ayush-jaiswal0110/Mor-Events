from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime

from .database import events_collection, registrations_collection, reviews_collection
from .utils import login_required

@api_view(['GET'])
@login_required
def dashboard_stats(request):
    total_registrations = registrations_collection.count_documents({})
    upcoming_events = events_collection.count_documents({"status": "upcoming"})
    completed_events = events_collection.count_documents({"status": "completed"})
    
    # Calculate revenue
    pipeline_rev = [
        {"$match": {"paymentStatus": "paid"}},
        {"$group": {"_id": None, "totalRevenue": {"$sum": "$amount"}}}
    ]
    rev_res = list(registrations_collection.aggregate(pipeline_rev))
    total_revenue = rev_res[0].get('totalRevenue') if (rev_res and rev_res[0].get('totalRevenue') is not None) else 0
    
    pending_payments = registrations_collection.count_documents({"paymentStatus": "pending"})
    
    # Calculate rating
    pipeline_rating = [
        {"$group": {"_id": None, "avgRating": {"$avg": "$rating"}}}
    ]
    rat_res = list(reviews_collection.aggregate(pipeline_rating))
    avg_rating = rat_res[0].get('avgRating') if (rat_res and rat_res[0].get('avgRating') is not None) else 0.0
    
    total_reviews = reviews_collection.count_documents({})
    
    return Response({
        "success": True,
        "data": {
            "totalRegistrations": total_registrations,
            "upcomingEvents": upcoming_events,
            "completedEvents": completed_events,
            "totalRevenue": total_revenue,
            "pendingPayments": pending_payments,
            "averageRating": round(avg_rating, 1),
            "totalReviews": total_reviews,
            "monthlyGrowth": 0.0 # Placeholder for advanced logic
        }
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@login_required
def monthly_registrations(request):
    year = request.GET.get('year', datetime.now().year)
    
    # Simplified mock/aggregate for now, ideally group by month of registeredAt
    # we'll return a stub format to match the frontend expectations. 
    # In production, use MongoDB $month operator on parsed registeredAt dates.
    
    # Just an example template response since accurate month aggregation 
    # requires properly configured ISODate objects in Mongo
    months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    data = []
    for i, month_name in enumerate(months):
        data.append({
             "month": month_name,
             "monthNumber": i + 1,
             "registrations": 0,
             "revenue": 0
        })
        
    return Response({
        "success": True,
        "data": data
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@login_required
def event_participation_stats(request):
    events = list(events_collection.find({}, {"_id": 1, "name": 1}))
    data = []
    
    for evt in events:
        # If the user created an event manually in MongoDB, it possesses an ObjectId which breaks JSON 
        evt_id_raw = evt.get('_id')
        evt_id = str(evt_id_raw)
        
        # In Registration DB, the eventId might be saved as string or object ID. Let's check both or primarily string
        query_match = {"eventId": {"$in": [evt_id, evt_id_raw]}}
        
        total_regs = registrations_collection.count_documents(query_match)
        paid_regs = registrations_collection.count_documents({"$or": [{"eventId": evt_id, "paymentStatus": "paid"}, {"eventId": evt_id_raw, "paymentStatus": "paid"}]})
        
        rev_pipeline = [
            {"$match": {"$or": [{"eventId": evt_id, "paymentStatus": "paid"}, {"eventId": evt_id_raw, "paymentStatus": "paid"}]}},
            {"$group": {"_id": None, "rev": {"$sum": "$amount"}}}
        ]
        rev_res = list(registrations_collection.aggregate(rev_pipeline))
        revenue = rev_res[0].get('rev') if (rev_res and rev_res[0].get('rev') is not None) else 0
        
        rat_pipeline = [
            {"$match": {"$or": [{"eventId": evt_id}, {"eventId": evt_id_raw}]}},
            {"$group": {"_id": None, "rating": {"$avg": "$rating"}}}
        ]
        rat_res = list(reviews_collection.aggregate(rat_pipeline))
        avg_rating = rat_res[0].get('rating') if (rat_res and rat_res[0].get('rating') is not None) else 0.0
        
        data.append({
            "eventId": evt_id,
            "eventName": evt.get('name', ''),
            "totalRegistrations": total_regs,
            "paidRegistrations": paid_regs,
            "revenue": revenue,
            "averageRating": round(avg_rating, 1)
        })
        
    return Response({
        "success": True,
        "data": data
    }, status=status.HTTP_200_OK)
