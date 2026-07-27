from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from apps.tasks.models import Task, Comment
from apps.tasks.serializers import TaskSerializer, CommentSerializer
from apps.authentication.permissions import TaskAccessPermission
from apps.authentication.models import Notification, NotificationTypeChoices

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().select_related('project', 'assigned_to')
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated, TaskAccessPermission]

    def get_queryset(self):
        user = self.request.user
        
        # Admin, Chief, and Management can view all tasks
        if user.role in ['ADMIN', 'CHIEF', 'MANAGEMENT']:
            return self.queryset
            
        # Fellows can only view tasks assigned to them
        if user.role == 'FELLOW':
            return self.queryset.filter(assigned_to=user)
            
        # Employees and Interns can view:
        # 1. Tasks assigned to them
        # 2. Tasks in projects they are developers or members of
        # 3. Standalone tasks
        return self.queryset.filter(
            models.Q(assigned_to=user) |
            models.Q(project__project_manager=user) |
            models.Q(project__developers=user) |
            models.Q(project__members=user) |
            models.Q(project__isnull=True)
        ).distinct()

    def perform_create(self, serializer):
        task = serializer.save()
        # Trigger notification if assigned
        if task.assigned_to and task.assigned_to != self.request.user:
            Notification.objects.create(
                recipient=task.assigned_to,
                sender=self.request.user,
                notification_type=NotificationTypeChoices.TASK_ASSIGNED,
                title="New Task Assigned",
                message=f"You have been assigned to task: '{task.name}'",
                link=f"/tasks"
            )

    def update(self, request, *args, **kwargs):
        task = self.get_object()
        user = request.user

        # Admin, Chief, Management can modify everything
        if user.role in ['ADMIN', 'CHIEF', 'MANAGEMENT']:
            response = super().update(request, *args, **kwargs)
            # Notification check on updates
            if task.assigned_to and task.assigned_to != user:
                Notification.objects.create(
                    recipient=task.assigned_to,
                    sender=user,
                    notification_type=NotificationTypeChoices.TASK_UPDATED,
                    title="Task Updated",
                    message=f"Task '{task.name}' has been updated.",
                    link=f"/tasks"
                )
            return response

        # Non-management users can only update completion percentage and status for their own tasks
        if task.assigned_to != user:
            return Response(
                {"detail": "You do not have permission to edit this task as you are not assigned to it."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Restrict parameters for employees/interns/fellows
        allowed_keys = ['status', 'completion_percentage', 'notes']
        for key in list(request.data.keys()):
            if key not in allowed_keys:
                request.data.pop(key, None)

        response = super().update(request, *args, **kwargs)
        
        # Notify managers or project manager on progress updates
        if task.project and task.project.project_manager:
            Notification.objects.create(
                recipient=task.project.project_manager,
                sender=user,
                notification_type=NotificationTypeChoices.TASK_UPDATED,
                title="Task Progress Updated",
                message=f"Task '{task.name}' has been updated to {task.completion_percentage}% ({task.status}).",
                link=f"/projects"
            )
            
        return response

    @action(detail=True, methods=['get', 'post'], url_path='comments')
    def comments(self, request, pk=None):
        task = self.get_object()
        
        if request.method == 'GET':
            comments = task.comments.all().select_related('user')
            serializer = CommentSerializer(comments, many=True)
            return Response(serializer.data)
            
        elif request.method == 'POST':
            serializer = CommentSerializer(data=request.data)
            if serializer.is_valid():
                comment = serializer.save(task=task, user=request.user)
                
                # Check for mentions in comment content e.g., @user_email
                content = comment.content
                import re
                mentions = re.findall(r'@(\S+)', content)
                for email in mentions:
                    from django.contrib.auth import get_user_model
                    UserModel = get_user_model()
                    try:
                        mentioned_user = UserModel.objects.get(email=email)
                        if mentioned_user != request.user:
                            Notification.objects.create(
                                recipient=mentioned_user,
                                sender=request.user,
                                notification_type=NotificationTypeChoices.MENTION,
                                title="You were mentioned",
                                message=f"{request.user.email} mentioned you in a comment on '{task.name}'",
                                link=f"/tasks"
                            )
                    except UserModel.DoesNotExist:
                        pass
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
