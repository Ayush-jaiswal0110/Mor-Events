import math
import uuid
from datetime import datetime
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.utils.dateparse import parse_date

from .database import events_collection, registrations_collection
from .utils import login_required

def clean_mongo_dict(d):
    # Convert ObjectId to string safely if needed, but we use string IDs manually for frontend ease
    if '_id' in d:
        d['id'] = str(d['_id'])
        del d['_id']
    return d

@api_view(['GET', 'POST'])
def events_list(request):
    if request.method == 'GET':
        query = {}
        status_param = request.GET.get('status')
        if status_param and status_param != 'all':
            query['status'] = status_param

        limit = int(request.GET.get('limit', 10))
        page = int(request.GET.get('page', 1))
        skip = (page - 1) * limit

        total_items = events_collection.count_documents(query)
        cursor = events_collection.find(query).skip(skip).limit(limit)
        
        # Sort by creation date DESC
        cursor.sort([("createdAt", -1)])
        
        events = [clean_mongo_dict(doc) for doc in cursor]
        
        return Response({
            "success": True,
            "data": events,
            "pagination": {
                "currentPage": page,
                "totalPages": math.ceil(total_items / limit) if limit else 1,
                "totalItems": total_items,
                "itemsPerPage": limit
            }
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        # Admin required
        @login_required
        def create_event(req):
            data = req.data
            # Generate a new string ID starting with evt_
            event_id = f"evt_{uuid.uuid4().hex[:8]}"
            date_field = parse_date(data.get('date'))
            
            new_event = {
                "_id": event_id,
                "name": data.get('name'),
                "description": data.get('description', ''),
                "shortDescription": data.get('shortDescription', ''),
                "venue": data.get('venue', ''),
                "date": str(date_field) if date_field else data.get('date', ''),
                "price": float(data.get('price', 0)),
                "images": data.get('images', []),
                "videos": data.get('videos', []),
                "itinerary": data.get('itinerary', []),
                "status": data.get('status', 'upcoming'),
                "googleMapUrl": data.get('googleMapUrl', ''),
                "registrationLink": data.get('registrationLink', ''),
                "maxParticipants": int(data.get('maxParticipants', 50)),
                "createdAt": datetime.utcnow().isoformat() + 'Z',
                "updatedAt": datetime.utcnow().isoformat() + 'Z'
            }
            
            events_collection.insert_one(new_event)
            return Response({
                "success": True,
                "message": "Event created successfully",
                "data": clean_mongo_dict(new_event)
            }, status=status.HTTP_201_CREATED)
            
        return create_event(request)


@api_view(['GET', 'PUT', 'DELETE'])
def event_detail(request, pk):
    if request.method == 'GET':
        event = events_collection.find_one({"_id": pk})
        if not event:
             return Response({"success": False, "message": "Event not found"}, status=status.HTTP_404_NOT_FOUND)
             
        # Optional: Add registration count
        reg_count = registrations_collection.count_documents({"eventId": pk})
        event['registrationCount'] = reg_count
        event['availableSlots'] = max(0, int(event.get('maxParticipants', 50)) - reg_count)
        
        return Response({
            "success": True,
            "data": clean_mongo_dict(event)
        }, status=status.HTTP_200_OK)

    elif request.method == 'PUT':
        @login_required
        def update_event(req):
            data = req.data.copy()
            data['updatedAt'] = datetime.utcnow().isoformat() + 'Z'
            
            # Avoid overwriting id
            if 'id' in data:
                del data['id']
            if '_id' in data:
                del data['_id']
                
            result = events_collection.update_one({"_id": pk}, {"$set": data})
            if result.matched_count == 0:
                return Response({"success": False, "message": "Event not found"}, status=status.HTTP_404_NOT_FOUND)
                
            updated_event = events_collection.find_one({"_id": pk})
            return Response({
                "success": True,
                "message": "Event updated successfully",
                "data": clean_mongo_dict(updated_event)
            }, status=status.HTTP_200_OK)
            
        return update_event(request)

    elif request.method == 'DELETE':
        @login_required
        def delete_event(req):
            result = events_collection.delete_one({"_id": pk})
            if result.deleted_count == 0:
                return Response({"success": False, "message": "Event not found"}, status=status.HTTP_404_NOT_FOUND)
                
            return Response({
                "success": True,
                "message": "Event deleted successfully"
            }, status=status.HTTP_200_OK)
            
        return delete_event(request)
