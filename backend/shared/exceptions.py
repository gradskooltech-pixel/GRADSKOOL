"""
GRADSKOOL — Shared: Custom Exception Handler

Wraps DRF's default handler to produce consistent error shapes:

Success:  { data: ... }
Error:    { error: { code, message, detail } }
"""
import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        # Unhandled exception — let Sentry capture it, return 500
        logger.exception(f'Unhandled exception in {context.get("view")}: {exc}')
        return Response(
            {'error': {'code': 'server_error', 'message': 'An unexpected error occurred.'}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # Normalize DRF validation errors
    error_data = response.data

    if isinstance(error_data, dict):
        # Check for DRF's standard 'detail' key
        if 'detail' in error_data:
            message = str(error_data['detail'])
            code = getattr(error_data['detail'], 'code', 'error')
            response.data = {'error': {'code': code, 'message': message}}
        else:
            # Validation error — field-level
            response.data = {
                'error': {
                    'code': 'validation_error',
                    'message': 'Please correct the errors below.',
                    'fields': error_data,
                }
            }
    elif isinstance(error_data, list):
        response.data = {
            'error': {
                'code': 'validation_error',
                'message': error_data[0] if error_data else 'Validation failed.',
            }
        }

    return response
