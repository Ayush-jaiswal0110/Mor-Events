import math
import uuid
from datetime import datetime
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .database import reviews_collection, events_collection
from .utils import login_required
from .events_views import clean_mongo_dict

@api_view(['GET', 'POST'])
def reviews_list(request):
    if request.method == 'GET':
        query = {}
        event_id = request.GET.get('eventId')
        if event_id:
            query['eventId'] = event_id

        limit = int(request.GET.get('limit', 10))
        page = int(request.GET.get('page', 1))
        skip = (page - 1) * limit

        total_reviews = reviews_collection.count_documents(query)
        cursor = reviews_collection.find(query).skip(skip).limit(limit)
        cursor.sort([("createdAt", -1)])
        
        reviews = [clean_mongo_dict(doc) for doc in cursor]
        
        # Calculate average rating
        pipeline = [
            {"$match": query},
            {"$group": {"_id": None, "avgRating": {"$avg": "$rating"}}}
        ]
        avg_result = list(reviews_collection.aggregate(pipeline))
        avg_rating = avg_result[0]['avgRating'] if avg_result else 0.0

        return Response({
            "success": True,
            "data": reviews,
            "averageRating": round(avg_rating, 1),
            "totalReviews": total_reviews
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        data = request.data
        review_id = f"rev_{uuid.uuid4().hex[:8]}"
        
        new_review = {
            "_id": review_id,
            "userId": data.get('userId', 'anonymous'),
            "userName": data.get('name', 'Anonymous'),
            "eventId": data.get('eventId'),
            "registrationId": data.get('registrationId', ''),
            "rating": int(data.get('rating', 5)),
            "text": data.get('text', ''),
            "image": data.get('image', ''),
            "status": "pending_approval",
            "verified": False,
            "createdAt": datetime.utcnow().isoformat() + 'Z'
        }
        
        # Optionally link event name
        event = events_collection.find_one({"_id": data.get('eventId')})
        if event:
             new_review["eventName"] = event.get("name")
             
        reviews_collection.insert_one(new_review)
        
        return Response({
            "success": True,
            "message": "Review submitted successfully",
            "data": {
                "id": review_id,
                "status": "pending_approval"
            }
        }, status=status.HTTP_201_CREATED)

@api_view(['PATCH'])
@login_required
def update_review_status(request, pk):
    data = request.data
    status_val = data.get('status')
    
    result = reviews_collection.update_one(
        {"_id": pk}, 
        {"$set": {"status": status_val}}
    )
    
    if result.matched_count == 0:
        return Response({"success": False, "message": "Review not found"}, status=status.HTTP_404_NOT_FOUND)
        
    return Response({
        "success": True,
        "message": "Review status updated"
    }, status=status.HTTP_200_OK)

@api_view(['DELETE'])
@login_required
def delete_review(request, pk):
    result = reviews_collection.delete_one({"_id": pk})
    if result.deleted_count == 0:
        return Response({"success": False, "message": "Review not found"}, status=status.HTTP_404_NOT_FOUND)
        
    return Response({
        "success": True,
        "message": "Review deleted successfully"
    }, status=status.HTTP_200_OK)
