from rest_framework import viewsets, permissions, status
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

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def get_permissions(self):
        # Only Admins can delete users
        if self.action == 'destroy':
            return [IsAdmin()]
        return super().get_permissions()


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
            # Company Analytics
            active_projects = Project.objects.filter(status='IN_PROGRESS').count()
            pending_tasks = Task.objects.filter(status='PENDING').count()
            completed_today = Task.objects.filter(
                status='COMPLETED', 
                updated_at__date=timezone.now().date()
            ).count()
            team_members = User.objects.filter(is_active=True).count()
            
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
            for p in Project.objects.filter(status='IN_PROGRESS')[:5]:
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
                    'pending_tasks': pending_tasks,
                    'completed_today': completed_today,
                    'team_members': team_members
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
