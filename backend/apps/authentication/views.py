from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView
from apps.authentication.serializers import (
    CustomTokenObtainPairSerializer, 
    UserSerializer, 
    UserCreateSerializer
)
from apps.authentication.permissions import IsAdmin, IsManagementOrAbove

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user_serializer = UserSerializer(request.user)
        # Attempt to get profile details if they exist
        profile_data = {}
        if hasattr(request.user, 'profile'):
            from apps.team.serializers import ProfileSerializer
            profile_data = ProfileSerializer(request.user.profile).data
        
        return Response({
            'user': user_serializer.data,
            'profile': profile_data
        })


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    permission_classes = [permissions.IsAuthenticated, IsManagementOrAbove]

    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset
        if user.role != 'ADMIN':
            queryset = queryset.exclude(role='ADMIN')
        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def get_permissions(self):
        # Admins, Chiefs, and Managers can manage accounts
        if self.action == 'destroy':
            return [IsManagementOrAbove()]
        return super().get_permissions()

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.role == 'ADMIN':
            return Response({'error': 'Admin accounts cannot be modified.'}, status=status.HTTP_400_BAD_REQUEST)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        # Overridden to deactivate instead of deleting permanently
        instance = self.get_object()
        if instance.role == 'ADMIN':
            return Response({'error': 'Admin accounts cannot be deactivated.'}, status=status.HTTP_400_BAD_REQUEST)

        instance.is_active = False
        instance.save()

        # Update profile status to INACTIVE
        if hasattr(instance, 'profile'):
            instance.profile.status = 'INACTIVE'
            instance.profile.save()

        # Log deactivation action
        ActivityLog.objects.create(
            user=request.user,
            action=f"deactivated account of {instance.email}",
            module="AUTH",
            details={'deactivated_user_id': instance.id}
        )
        return Response({'status': 'Account deactivated successfully.'})

    @action(detail=True, methods=['post'], url_path='activate')
    def activate(self, request, pk=None):
        instance = self.get_object()
        if instance.role == 'ADMIN':
            return Response({'error': 'Admin accounts cannot be modified.'}, status=status.HTTP_400_BAD_REQUEST)

        instance.is_active = True
        instance.save()

        # Update profile status to ACTIVE
        if hasattr(instance, 'profile'):
            instance.profile.status = 'ACTIVE'
            instance.profile.save()

        ActivityLog.objects.create(
            user=request.user,
            action=f"activated account of {instance.email}",
            module="AUTH",
            details={'activated_user_id': instance.id}
        )
        return Response({'status': 'Account activated successfully.'})

    @action(detail=True, methods=['delete'], url_path='hard-delete')
    def hard_delete(self, request, pk=None):
        instance = self.get_object()
        
        # Only Admin can delete accounts permanently
        if request.user.role != 'ADMIN':
            return Response({'error': 'Only admins can permanently delete members.'}, status=status.HTTP_403_FORBIDDEN)
            
        if instance.role == 'ADMIN':
            return Response({'error': 'Admin accounts cannot be deleted.'}, status=status.HTTP_400_BAD_REQUEST)
            
        user_email = instance.email
        instance.delete()
        
        ActivityLog.objects.create(
            user=request.user,
            action=f"permanently deleted account and profile of {user_email}",
            module="AUTH"
        )
        return Response({'status': 'Member deleted permanently.'})

    @action(detail=False, methods=['get'], url_path='suggest-username')
    def suggest_username(self, request):
        name = request.query_params.get('name', '').strip()
        if not name:
            return Response({'username': ''})

        import re
        base_username = re.sub(r'[^a-zA-Z0-9]', '.', name.lower())
        base_username = re.sub(r'\.+', '.', base_username)
        base_username = base_username.strip('.')

        if not base_username:
            base_username = 'user'

        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        return Response({'username': username})

    @action(detail=False, methods=['post'], url_path='bulk-activate')
    def bulk_activate(self, request):
        user_ids = request.data.get('user_ids', [])
        if not user_ids:
            return Response({'error': 'No user ids provided.'}, status=400)

        User.objects.filter(id__in=user_ids).update(is_active=True)
        ActivityLog.objects.create(
            user=request.user,
            action=f"bulk activated {len(user_ids)} accounts",
            module="AUTH",
            details={'user_ids': user_ids}
        )
        return Response({'status': 'Users activated successfully.'})

    @action(detail=False, methods=['post'], url_path='bulk-deactivate')
    def bulk_deactivate(self, request):
        user_ids = request.data.get('user_ids', [])
        if not user_ids:
            return Response({'error': 'No user ids provided.'}, status=400)

        User.objects.filter(id__in=user_ids).update(is_active=False)
        ActivityLog.objects.create(
            user=request.user,
            action=f"bulk deactivated {len(user_ids)} accounts",
            module="AUTH",
            details={'user_ids': user_ids}
        )
        return Response({'status': 'Users deactivated successfully.'})

    @action(detail=False, methods=['post'], url_path='bulk-assign-department')
    def bulk_assign_department(self, request):
        user_ids = request.data.get('user_ids', [])
        dept_id = request.data.get('department_id')
        if not user_ids:
            return Response({'error': 'No user ids provided.'}, status=400)
        if not dept_id:
            return Response({'error': 'No department id provided.'}, status=400)

        from apps.team.models import Profile
        Profile.objects.filter(user_id__in=user_ids).update(department_id=dept_id)
        ActivityLog.objects.create(
            user=request.user,
            action=f"bulk assigned department to {len(user_ids)} users",
            module="AUTH",
            details={'user_ids': user_ids, 'department_id': dept_id}
        )
        return Response({'status': 'Departments assigned successfully.'})


from rest_framework.decorators import action
from apps.authentication.models import Notification, ActivityLog
from apps.authentication.serializers import NotificationSerializer, ActivityLogSerializer

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(recipient=self.request.user)

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'marked as read'})

    @action(detail=False, methods=['post'], url_path='read-all')
    def read_all(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'status': 'all marked as read'})

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': count})


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.all().select_related('user')
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsManagementOrAbove]

    def get_queryset(self):
        queryset = self.queryset
        user_id = self.request.query_params.get('user_id')
        module = self.request.query_params.get('module')
        action_name = self.request.query_params.get('action')

        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if module:
            queryset = queryset.filter(module__iexact=module)
        if action_name:
            queryset = queryset.filter(action__icontains=action_name)

        return queryset


from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q as dj_Q

class DashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Lazy imports to avoid circular dependencies
        from apps.projects.models import Project
        from apps.projects.serializers import ProjectSerializer
        from apps.tasks.models import Task
        from apps.tasks.serializers import TaskSerializer
        from apps.authentication.models import User
        
        # Check if user is Admin, Chief, or Management
        is_management = user.role in ['ADMIN', 'CHIEF', 'MANAGEMENT']
        
        if is_management:
            today = timezone.now().date()
            
            # Company Analytics (Six Cards)
            active_projects = Project.objects.exclude(status__in=['COMPLETED', 'CANCELLED']).count()
            completed_projects = Project.objects.filter(status='COMPLETED').count()
            pending_tasks = Task.objects.exclude(status='COMPLETED').count()
            overdue_tasks = Task.objects.exclude(status='COMPLETED').filter(due_date__lt=today).count()
            team_members = User.objects.filter(is_active=True).count()
            fellowship_projects = Project.objects.filter(
                dj_Q(developers__role='FELLOW') | dj_Q(members__role='FELLOW')
            ).distinct().count()
            
            # Today's Priority collections
            overdue_tasks_list = Task.objects.exclude(status='COMPLETED').filter(due_date__lt=today).order_by('due_date')[:5]
            projects_ending_today = Project.objects.exclude(status__in=['COMPLETED', 'CANCELLED']).filter(end_date=today)[:5]
            review_requests = Task.objects.filter(status='REVIEW').order_by('-updated_at')[:5]
            
            from apps.team.models import IdentityVerification
            pending_verifs = IdentityVerification.objects.filter(status='PENDING', profile__user__role='FELLOW')
            fellows_waiting_approval = [
                {
                    'id': v.profile.user.id,
                    'name': v.profile.name,
                    'email': v.profile.user.email,
                    'document_type': v.document_type
                }
                for v in pending_verifs
            ][:5]
            
            # Recent collections
            recent_tasks = Task.objects.order_by('-created_at')[:5]
            recent_projects = Project.objects.order_by('-created_at')[:5]
            upcoming_deadlines = Task.objects.exclude(status='COMPLETED').filter(
                due_date__isnull=False
            ).order_by('due_date')[:5]
            recent_activity = ActivityLog.objects.order_by('-created_at')[:10]
            
            # Calculate company-wide status distribution
            status_distribution = {
                'pending': Task.objects.filter(status='PENDING').count(),
                'in_progress': Task.objects.filter(status='IN_PROGRESS').count(),
                'review': Task.objects.filter(status='REVIEW').count(),
                'completed': Task.objects.filter(status='COMPLETED').count()
            }

            # Calculate project progress for active projects
            project_progress = []
            for p in Project.objects.exclude(status__in=['COMPLETED', 'CANCELLED'])[:5]:
                proj_tasks = p.tasks.all()
                pct = 0
                if proj_tasks.exists():
                    pct = round(sum(t.completion_percentage for t in proj_tasks) / proj_tasks.count())
                project_progress.append({
                    'name': p.name,
                    'completion': pct
                })

            return Response({
                'is_management': True,
                'status_distribution': status_distribution,
                'project_progress': project_progress,
                'metrics': {
                    'active_projects': active_projects,
                    'completed_projects': completed_projects,
                    'pending_tasks': pending_tasks,
                    'overdue_tasks': overdue_tasks,
                    'team_members': team_members,
                    'fellowship_projects': fellowship_projects
                },
                'todays_priority': {
                    'overdue_tasks': TaskSerializer(overdue_tasks_list, many=True).data,
                    'projects_ending_today': ProjectSerializer(projects_ending_today, many=True).data,
                    'review_requests': TaskSerializer(review_requests, many=True).data,
                    'fellows_waiting_approval': fellows_waiting_approval
                },
                'recent_tasks': TaskSerializer(recent_tasks, many=True).data,
                'recent_projects': ProjectSerializer(recent_projects, many=True).data,
                'upcoming_deadlines': TaskSerializer(upcoming_deadlines, many=True).data,
                'recent_activity': ActivityLogSerializer(recent_activity, many=True).data
            })
        else:
            # Employee / Intern / Fellow Personal Workspace
            my_tasks = Task.objects.filter(assigned_to=user).exclude(status='COMPLETED')[:5]
            my_projects = Project.objects.filter(
                dj_Q(developers=user) | dj_Q(members=user) | dj_Q(project_manager=user)
            ).distinct()[:5]
            due_today = Task.objects.filter(
                assigned_to=user, 
                due_date=timezone.now().date()
            ).exclude(status='COMPLETED')
            recent_updates = Notification.objects.filter(recipient=user)[:5]
            
            # Calculate personal task distribution
            all_user_tasks = Task.objects.filter(assigned_to=user)
            status_distribution = {
                'pending': all_user_tasks.filter(status='PENDING').count(),
                'in_progress': all_user_tasks.filter(status='IN_PROGRESS').count(),
                'review': all_user_tasks.filter(status='REVIEW').count(),
                'completed': all_user_tasks.filter(status='COMPLETED').count()
            }
            
            return Response({
                'is_management': False,
                'status_distribution': status_distribution,
                'my_tasks': TaskSerializer(my_tasks, many=True).data,
                'my_projects': ProjectSerializer(my_projects, many=True).data,
                'due_today': TaskSerializer(due_today, many=True).data,
                'recent_updates': NotificationSerializer(recent_updates, many=True).data
            })


class ReportsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        from apps.projects.models import Project
        from apps.tasks.models import Task
        from apps.authentication.models import User
        from django.utils import timezone
        from datetime import timedelta

        is_management = user.role in ['ADMIN', 'CHIEF', 'MANAGEMENT']

        # Query params for managers
        report_type = request.query_params.get('type') # 'weekly', 'monthly', 'individual'
        target_user_id = request.query_params.get('user_id')

        # If user is not management, force their own individual report
        if not is_management:
            report_type = 'individual'
            target_user_id = user.id

        if report_type in ['weekly', 'monthly']:
            # Time delta calculation
            days = 7 if report_type == 'weekly' else 30
            cutoff = timezone.now() - timedelta(days=days)
            
            # Fetch tasks matching cutoff
            tasks_created = Task.objects.filter(created_at__gte=cutoff)
            tasks_completed = Task.objects.filter(updated_at__gte=cutoff, status='COMPLETED')
            
            # Group by projects
            project_stats = []
            for p in Project.objects.all():
                p_tasks = p.tasks.filter(created_at__gte=cutoff)
                p_completed = p.tasks.filter(updated_at__gte=cutoff, status='COMPLETED')
                project_stats.append({
                    'id': p.id,
                    'name': p.name,
                    'created_count': p_tasks.count(),
                    'completed_count': p_completed.count()
                })
                
            return Response({
                'is_management': is_management,
                'report_type': report_type,
                'period_days': days,
                'total_created': tasks_created.count(),
                'total_completed': tasks_completed.count(),
                'project_stats': project_stats,
                'tasks': [{
                    'id': t.id,
                    'name': t.name,
                    'project': t.project.name if t.project else "None",
                    'assigned_to': t.assigned_to.email if t.assigned_to else "None",
                    'status': t.status,
                    'priority': t.priority,
                    'completion_percentage': t.completion_percentage,
                    'due_date': t.due_date
                } for t in tasks_created]
            })

        elif report_type == 'individual' and target_user_id:
            try:
                emp = User.objects.get(id=target_user_id)
            except User.DoesNotExist:
                return Response({'error': 'User not found'}, status=404)
                
            # Restrict normal users to only see their own report
            if not is_management and emp.id != user.id:
                return Response({'error': 'Permission denied.'}, status=403)
                
            emp_tasks = Task.objects.filter(assigned_to=emp)
            pending_tasks = emp_tasks.exclude(status='COMPLETED')
            completed_tasks = emp_tasks.filter(status='COMPLETED')
            
            # Fellowship info
            fellowship_info = {}
            if emp.role == 'FELLOW':
                f_projects = Project.objects.filter(developers=emp)
                primary_proj = f_projects.first()
                if primary_proj:
                    proj_tasks = primary_proj.tasks.filter(assigned_to=emp)
                    progress = 0
                    if proj_tasks.exists():
                        progress = round(sum(t.completion_percentage for t in proj_tasks) / proj_tasks.count())
                    
                    mentor_val = "None"
                    if primary_proj.project_manager:
                        mentor_val = primary_proj.project_manager.first_name or primary_proj.project_manager.email.split('@')[0]
                        
                    fellowship_info = {
                        'project_name': primary_proj.name,
                        'mentor_name': mentor_val,
                        'deadline': primary_proj.end_date,
                        'progress_pct': progress
                    }

            from django.core.exceptions import ObjectDoesNotExist
            try:
                emp_profile = emp.profile
            except ObjectDoesNotExist:
                emp_profile = None

            return Response({
                'is_management': is_management,
                'report_type': 'individual',
                'employee': {
                    'id': emp.id,
                    'name': emp.first_name + " " + emp.last_name if emp.first_name else emp.email.split('@')[0],
                    'email': emp.email,
                    'role': emp.role,
                    'department': emp_profile.department.name if emp_profile and emp_profile.department else 'No Department',
                    'status': emp_profile.status if emp_profile else 'ACTIVE'
                },
                'stats': {
                    'total': emp_tasks.count(),
                    'completed': completed_tasks.count(),
                    'pending': pending_tasks.count(),
                    'completion_pct': round((completed_tasks.count() / emp_tasks.count() * 100) if emp_tasks.exists() else 0)
                },
                'fellowship': fellowship_info,
                'completed_tasks': [{
                    'id': t.id,
                    'name': t.name,
                    'project': t.project.name if t.project else "None",
                    'priority': t.priority,
                    'due_date': t.due_date
                } for t in completed_tasks],
                'pending_tasks': [{
                    'id': t.id,
                    'name': t.name,
                    'project': t.project.name if t.project else "None",
                    'priority': t.priority,
                    'status': t.status,
                    'due_date': t.due_date
                } for t in pending_tasks]
            })

        # Default executive report for managers
        # 1. Employee Productivity
        employees = User.objects.filter(role__in=['EMPLOYEE', 'INTERN', 'FELLOW'])
        employee_productivity = []
        for emp in employees:
            total = Task.objects.filter(assigned_to=emp).count()
            completed = Task.objects.filter(assigned_to=emp, status='COMPLETED').count()
            name_label = emp.first_name or emp.email.split('@')[0]
            if not emp.is_active:
                name_label += " (Deactivated)"
            employee_productivity.append({
                'name': name_label,
                'completed': completed,
                'total': total,
                'productivity_pct': round((completed / total * 100) if total > 0 else 0)
            })
            
        # 2. Project Progress
        projects = Project.objects.all()
        project_progress = []
        for p in projects:
            proj_tasks = p.tasks.all()
            pct = 0
            if proj_tasks.exists():
                pct = round(sum(t.completion_percentage for t in proj_tasks) / proj_tasks.count())
            project_progress.append({
                'name': p.name,
                'completion': pct,
                'status': p.status
            })
            
        # 3. Task Completion
        task_completion = {
            'pending': Task.objects.filter(status='PENDING').count(),
            'in_progress': Task.objects.filter(status='IN_PROGRESS').count(),
            'review': Task.objects.filter(status='REVIEW').count(),
            'completed': Task.objects.filter(status='COMPLETED').count()
        }
        
        # 4. Fellowship Progress
        fellows = User.objects.filter(role='FELLOW')
        fellowship_progress = []
        for f in fellows:
            f_projects = Project.objects.filter(developers=f)
            primary_proj = f_projects.first()
            
            progress = 0
            deadline = None
            mentor_name = "None"
            if primary_proj:
                proj_tasks = primary_proj.tasks.filter(assigned_to=f)
                if proj_tasks.exists():
                    progress = round(sum(t.completion_percentage for t in proj_tasks) / proj_tasks.count())
                deadline = primary_proj.end_date
                mentor_name = primary_proj.project_manager.first_name if primary_proj.project_manager else "None"
                
            name_label = f.first_name or f.email.split('@')[0]
            if not f.is_active:
                name_label += " (Deactivated)"
            from django.core.exceptions import ObjectDoesNotExist
            try:
                f_profile = f.profile
            except ObjectDoesNotExist:
                f_profile = None

            fellowship_progress.append({
                'name': name_label,
                'project': primary_proj.name if primary_proj else "None",
                'progress': progress,
                'mentor': mentor_name,
                'deadline': deadline,
                'status': f_profile.status if f_profile else "ACTIVE"
            })
            
        return Response({
            'is_management': is_management,
            'employee_productivity': employee_productivity,
            'project_progress': project_progress,
            'task_completion': task_completion,
            'fellowship_progress': fellowship_progress
        })


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        new_password = request.data.get('new_password')
        if not new_password or len(new_password) < 8:
            return Response({'error': 'Password must be at least 8 characters long.'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        user.set_password(new_password)
        user.must_change_password = False
        user.save()
        
        # Log action
        ActivityLog.objects.create(
            user=user,
            action="changed password",
            module="AUTH"
        )
        
        return Response({'status': 'Password changed successfully.'})
