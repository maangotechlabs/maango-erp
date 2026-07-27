from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from apps.projects.models import Project
from apps.projects.serializers import ProjectSerializer
from apps.authentication.permissions import ProjectAccessPermission
from apps.tasks.serializers import TaskSerializer
from apps.team.serializers import DocumentSerializer
from apps.authentication.serializers import ActivityLogSerializer
from apps.authentication.models import ActivityLog

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().select_related('project_manager')
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated, ProjectAccessPermission]

    def get_queryset(self):
        user = self.request.user
        # Admin, Chief, and Management can view all projects
        if user.role in ['ADMIN', 'CHIEF', 'MANAGEMENT']:
            return self.queryset
        # Employees/Interns/Fellows can only view projects they are assigned to
        return self.queryset.filter(
            models.Q(project_manager=user) |
            models.Q(developers=user) |
            models.Q(members=user)
        ).distinct()

    @action(detail=True, methods=['get'])
    def tasks(self, request, pk=None):
        project = self.get_object()
        tasks = project.tasks.all()
        
        # Fellow role filtering
        if request.user.role == 'FELLOW':
            tasks = tasks.filter(assigned_to=request.user)
            
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def documents(self, request, pk=None):
        project = self.get_object()
        documents = project.documents.all()
        serializer = DocumentSerializer(documents, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def activity(self, request, pk=None):
        project = self.get_object()
        # Query logs relating to this project
        # Logs containing "/projects/<id>" or "/tasks/" (where task is in project)
        logs = ActivityLog.objects.filter(
            models.Q(action__icontains=f"projects/{project.id}") |
            models.Q(details__path__icontains=f"/projects/{project.id}")
        ).order_by('-created_at')[:50]
        
        serializer = ActivityLogSerializer(logs, many=True)
        return Response(serializer.data)
