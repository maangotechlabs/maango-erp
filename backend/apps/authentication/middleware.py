from apps.authentication.models import ActivityLog
import json

class AuditLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if not request.path.startswith('/api/v1/'):
            return response

        user = request.user if request.user and request.user.is_authenticated else None
        method = request.method
        path = request.path
        status_code = response.status_code

        should_log = False
        action_name = ""
        module_name = ""

        parts = [p for p in path.split('/') if p]
        if len(parts) >= 3:
            module_name = parts[2].upper()
        else:
            module_name = "SYSTEM"

        if method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            should_log = True
            action_name = f"{method} request to {path}"
        elif method == 'GET' and 'identity-document' in path:
            should_log = True
            action_name = "Viewed Identity Document"
            module_name = "TEAM"

        if should_log and status_code < 400:
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0].strip()
            else:
                ip = request.META.get('REMOTE_ADDR')

            user_agent = request.META.get('HTTP_USER_AGENT', '')

            details = {
                'method': method,
                'path': path,
                'status_code': status_code,
                'query_params': dict(request.GET.items())
            }

            try:
                ActivityLog.objects.create(
                    user=user,
                    action=action_name,
                    module=module_name,
                    details=details,
                    ip_address=ip,
                    user_agent=user_agent
                )
            except Exception:
                pass

        return response
