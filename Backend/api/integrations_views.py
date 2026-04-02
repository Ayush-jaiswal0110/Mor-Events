import cloudinary.uploader
import cloudinary.api
from datetime import datetime
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status

from .utils import login_required
from .database import integration_setting_collection, events_collection, registrations_collection

# --- Cloudinary Uploads ---

@api_view(['POST'])
@login_required
@parser_classes([MultiPartParser, FormParser])
def upload_image(request):
    file_obj = request.FILES.get('file')
    type_val = request.data.get('type', 'event') # 'event' or 'review'
    event_id = request.data.get('eventId', 'general')
    
    # Get event name to create folder if provided
    folder_name = "mor_events_general"
    if event_id != 'general':
         evt = events_collection.find_one({"_id": event_id})
         if evt:
             # sanitize event name for folder
             folder_name = "".join([c if c.isalnum() else "_" for c in evt.get('name', 'event')])
             
    if not file_obj:
        return Response({"success": False, "message": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        upload_data = cloudinary.uploader.upload(
            file_obj, 
            folder=f"MorEvents/{folder_name}/images", 
            resource_type="image"
        )
        return Response({
            "success": True,
            "message": "Image uploaded successfully",
            "data": {
                "imageId": upload_data.get("public_id"),
                "url": upload_data.get("secure_url"),
                "thumbnailUrl": upload_data.get("secure_url") # Could use transformations for real thumbnails
            }
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def upload_payment_screenshot(request):
    file_obj = request.FILES.get('file')
    
    if not file_obj:
        return Response({"success": False, "message": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        upload_data = cloudinary.uploader.upload(
            file_obj, 
            folder="MorEvents/payment_screenshots", 
            resource_type="image"
        )
        return Response({
            "success": True,
            "message": "Screenshot uploaded successfully",
            "data": {
                "imageId": upload_data.get("public_id"),
                "url": upload_data.get("secure_url"),
            }
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@login_required
@parser_classes([MultiPartParser, FormParser])
def upload_video(request):
    file_obj = request.FILES.get('file')
    event_id = request.data.get('eventId', 'general')
    
    folder_name = "mor_events_general"
    if event_id != 'general':
         evt = events_collection.find_one({"_id": event_id})
         if evt:
             folder_name = "".join([c if c.isalnum() else "_" for c in evt.get('name', 'event')])
             
    if not file_obj:
        return Response({"success": False, "message": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        upload_data = cloudinary.uploader.upload(
            file_obj, 
            folder=f"MorEvents/{folder_name}/videos", 
            resource_type="video"
        )
        return Response({
            "success": True,
            "message": "Video uploaded successfully",
            "data": {
                "videoId": upload_data.get("public_id"),
                "url": upload_data.get("secure_url"),
                "thumbnailUrl": upload_data.get("secure_url") # Replace with a video poster later
            }
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@login_required
def delete_file(request, pk):
    # pk here is the public_id, note that cloudinary public_ids can contain slashes
    # so urls.py needs to capture the rest of the path
    try:
        # Determine resource type by some convention or just try image then video
        cloudinary.uploader.destroy(pk, resource_type="image")
        cloudinary.uploader.destroy(pk, resource_type="video")
        return Response({
            "success": True,
            "message": "File deleted successfully"
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- Google Sheets Integration ---

@api_view(['POST'])
@login_required
def connect_google_sheets(request):
    data = request.data
    sheet_link = data.get('spreadsheetId') # This could be full link or ID
    sheet_name = data.get('sheetName', 'Registrations')
    
    # Store settings in DB
    setting = {
        "_id": "google_sheets_config",
        "spreadsheetId": sheet_link,
        "sheetName": sheet_name,
        "status": "active",
        "lastConnected": datetime.utcnow().isoformat() + 'Z'
    }
    
    integration_setting_collection.update_one(
        {"_id": "google_sheets_config"}, 
        {"$set": setting}, 
        upsert=True
    )
    
    return Response({
        "success": True,
        "message": "Google Sheets connected successfully",
        "data": {
            "connectionId": "google_sheets_config",
            "status": "active"
        }
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@login_required
def sync_google_sheets(request):
    config = integration_setting_collection.find_one({"_id": "google_sheets_config"})
    if not config or config.get("status") != "active":
        return Response({"success": False, "message": "Google Sheets not connected"}, status=status.HTTP_400_BAD_REQUEST)
        
    # Real sync logic using gspread would go here using the service account credentials provided by user
    # For MVP, we will simulate the sync based on the API docs
    
    # Update last sync time
    integration_setting_collection.update_one(
        {"_id": "google_sheets_config"}, 
        {"$set": {"lastSyncAt": datetime.utcnow().isoformat() + 'Z'}}
    )
    
    return Response({
        "success": True,
        "message": "Sync completed successfully",
        "data": {
            "newRegistrations": 0,
            "updatedRegistrations": 0,
            "lastSyncAt": datetime.utcnow().isoformat() + 'Z'
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@login_required
def google_sheets_status(request):
    config = integration_setting_collection.find_one({"_id": "google_sheets_config"})
    if not config:
        return Response({
            "success": True,
            "data": {
                "connected": False,
                "lastSyncAt": None,
                "nextScheduledSync": None,
                "totalSynced": 0,
                "errors": []
            }
        }, status=status.HTTP_200_OK)
        
    return Response({
        "success": True,
        "data": {
            "connected": config.get("status") == "active",
            "lastSyncAt": config.get("lastSyncAt"),
            "nextScheduledSync": None,
            "totalSynced": registrations_collection.count_documents({}),
            "errors": []
        }
    }, status=status.HTTP_200_OK)
