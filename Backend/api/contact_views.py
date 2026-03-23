from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

@api_view(['POST'])
def contact_form(request):
    data = request.data
    
    # Store in DB or send an email here in the real world
    # For now, just return success per API spec
    
    return Response({
        "success": True,
        "message": "Message sent successfully. We'll get back to you soon!"
    }, status=status.HTTP_200_OK)
