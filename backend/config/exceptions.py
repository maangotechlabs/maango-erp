from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first
    # to get the standard error response.
    response = exception_handler(exc, context)

    if response is not None:
        # Format the standard DRF error
        custom_data = {
            'success': False,
            'message': 'Validation or operational error occurred.',
            'errors': response.data
        }
        
        # If there's a detail message, bubble it up to the main message
        if isinstance(response.data, dict) and 'detail' in response.data:
            custom_data['message'] = response.data['detail']
            
        response.data = custom_data
    else:
        # This is a non-DRF exception (unhandled 500 error)
        logger.exception("Unhandled server error:", exc_info=exc)
        
        response = Response({
            'success': False,
            'message': 'An unexpected server error occurred.',
            'errors': {'server': str(exc) if settings_debug_enabled() else 'Internal server error'}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response

def settings_debug_enabled():
    from django.conf import settings
    return getattr(settings, 'DEBUG', False)
