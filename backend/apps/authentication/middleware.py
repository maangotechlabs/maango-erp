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
            action_name = f"{method.lower()}d resource"
            
            if '/tasks/' in path:
                if method == 'POST':
                    action_name = "created task"
                elif method in ['PUT', 'PATCH']:
                    try:
                        body_data = json.loads(request.body.decode('utf-8')) if request.body else {}
                        if body_data.get('status') == 'COMPLETED':
                            action_name = "completed task"
                        else:
                            action_name = "updated task"
                    except Exception:
                        action_name = "updated task"
                elif method == 'DELETE':
                    action_name = "deleted task"
            elif '/projects/' in path:
                if method == 'POST':
                    action_name = "created project"
                elif method in ['PUT', 'PATCH']:
                    action_name = "updated project"
                elif method == 'DELETE':
                    action_name = "deleted project"
            elif '/announcements/' in path:
                if method == 'POST':
                    action_name = "posted announcement"
                elif method == 'DELETE':
                    action_name = "deleted announcement"
            elif '/team/profiles/' in path and 'identity' in path:
                action_name = "submitted identity document"
            elif '/team/profiles/' in path and 'verify-status' in path:
                try:
                    body_data = json.loads(request.body.decode('utf-8')) if request.body else {}
                    status_val = body_data.get('status', '').lower()
                    action_name = f"{status_val}ed team identity documents"
                except Exception:
                    action_name = "updated team verification status"
            elif '/team/documents/' in path:
                if method == 'POST':
                    action_name = "uploaded profile document"
                elif method == 'DELETE':
                    action_name = "deleted profile document"
            
            try:
                body_data = json.loads(request.body.decode('utf-8')) if request.body else {}
                name_val = body_data.get('name') or body_data.get('title') or body_data.get('file_name')
                if name_val:
                    action_name = f"{action_name} '{name_val}'"
            except Exception:
                pass
                
        elif method == 'GET' and 'identity-document' in path:
            should_log = True
            action_name = "viewed identity document"
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

            # Extract project_id metadata
            project_id = None
            if 'projects/' in path:
                parts = [p for p in path.split('/') if p]
                for i, part in enumerate(parts):
                    if part == 'projects' and i + 1 < len(parts):
                        try:
                            project_id = int(parts[i + 1])
                        except ValueError:
                            pass
            
            if not project_id:
                try:
                    body_data = json.loads(request.body.decode('utf-8')) if request.body else {}
                    p_val = body_data.get('project') or body_data.get('project_id')
                    if p_val:
                        project_id = int(p_val)
                except Exception:
                    pass

            if project_id:
                details['project_id'] = project_id

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
