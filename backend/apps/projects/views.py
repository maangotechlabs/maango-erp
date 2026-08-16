from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from apps.projects.models import (
    Project, ProjectStage, ProjectDeliverable, ProjectDeliverableAttachment, WorkflowStage, Workflow
)
from apps.projects.serializers import (
    ProjectSerializer, ProjectStageSerializer, ProjectDeliverableSerializer
)
from apps.authentication.permissions import ProjectAccessPermission
from apps.tasks.serializers import TaskSerializer
from apps.team.serializers import DocumentSerializer
from apps.authentication.serializers import ActivityLogSerializer
from apps.authentication.models import ActivityLog

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().select_related('project_manager')
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated, ProjectAccessPermission]

    @action(detail=False, methods=['get'], url_path='workflows')
    def workflows(self, request):
        from apps.projects.serializers import WorkflowSerializer
        wfs = Workflow.objects.all()
        serializer = WorkflowSerializer(wfs, many=True)
        return Response(serializer.data)

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

    @action(detail=True, methods=['post'], url_path='submit-deliverable')
    def submit_deliverable(self, request, pk=None):
        project = self.get_object()
        deliverable_id = request.data.get('deliverable_id')
        if not deliverable_id:
            return Response({"error": "deliverable_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            deliverable = ProjectDeliverable.objects.get(id=deliverable_id, stage__project=project)
        except ProjectDeliverable.DoesNotExist:
            return Response({"error": "Deliverable not found"}, status=status.HTTP_404_NOT_FOUND)
            
        value_text = request.data.get('value_text', '')
        deliverable.value_text = value_text
        
        if 'value_file' in request.FILES:
            deliverable.value_file = request.FILES['value_file']
            
        deliverable.status = 'SUBMITTED'
        deliverable.uploaded_by = request.user
        from django.utils import timezone
        deliverable.submitted_date = timezone.now()
        deliverable.save()
        
        files = request.FILES.getlist('files')
        for f in files:
            ProjectDeliverableAttachment.objects.create(
                deliverable=deliverable,
                file=f
            )
            
        ActivityLog.objects.create(
            user=request.user,
            action=f"Submitted deliverable '{deliverable.title}' for projects/{project.id}",
            module="projects",
            details={"path": f"/projects/{project.id}", "deliverable_id": deliverable.id}
        )
        
        return Response(ProjectDeliverableSerializer(deliverable).data)

    @action(detail=True, methods=['post'], url_path='approve-deliverable')
    def approve_deliverable(self, request, pk=None):
        project = self.get_object()
        deliverable_id = request.data.get('deliverable_id')
        status_val = request.data.get('status')
        remarks = request.data.get('remarks', '')
        
        if not deliverable_id or not status_val:
            return Response({"error": "deliverable_id and status are required"}, status=status.HTTP_400_BAD_REQUEST)
            
        if status_val not in ['APPROVED', 'REJECTED']:
            return Response({"error": "Invalid status value"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            deliverable = ProjectDeliverable.objects.get(id=deliverable_id, stage__project=project)
        except ProjectDeliverable.DoesNotExist:
            return Response({"error": "Deliverable not found"}, status=status.HTTP_404_NOT_FOUND)
            
        deliverable.status = status_val
        deliverable.approved_by = request.user
        deliverable.remarks = remarks
        deliverable.save()
        
        ActivityLog.objects.create(
            user=request.user,
            action=f"{status_val.capitalize()} deliverable '{deliverable.title}' for projects/{project.id}",
            module="projects",
            details={"path": f"/projects/{project.id}", "deliverable_id": deliverable.id}
        )
        
        return Response(ProjectDeliverableSerializer(deliverable).data)

    @action(detail=True, methods=['post'], url_path='complete-stage')
    def complete_stage(self, request, pk=None):
        project = self.get_object()
        stage_id = request.data.get('stage_id')
        # Handle string or boolean 'override'
        override_val = request.data.get('override', False)
        override = str(override_val).lower() in ['true', '1', 'yes']
        
        if not stage_id:
            return Response({"error": "stage_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            stage = ProjectStage.objects.get(id=stage_id, project=project)
        except ProjectStage.DoesNotExist:
            return Response({"error": "Stage not found"}, status=status.HTTP_404_NOT_FOUND)
            
        if stage.status != 'ACTIVE':
            return Response({"error": "Only active stage can be completed"}, status=status.HTTP_400_BAD_REQUEST)
            
        is_pm = project.project_manager == request.user
        is_mgmt = request.user.role in ['ADMIN', 'CHIEF', 'MANAGEMENT']
        is_admin = request.user.role == 'ADMIN'
        
        if not (is_pm or is_mgmt):
            return Response({"error": "Only the Project Lead or management can complete this stage"}, status=status.HTTP_403_FORBIDDEN)
            
        missing_deliverables = stage.deliverables.filter(is_required=True).exclude(status='APPROVED')
        if missing_deliverables.exists() and not is_admin:
            if not override:
                return Response({
                    "error": "missing_deliverables",
                    "message": "Cannot complete stage. Some required deliverables are missing or unapproved.",
                    "missing": [d.title for d in missing_deliverables]
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not is_mgmt:
                return Response({"error": "Only management can override missing deliverables"}, status=status.HTTP_403_FORBIDDEN)
                
        from django.utils import timezone
        stage.status = 'COMPLETED'
        stage.completed_at = timezone.now()
        stage.approved_by = request.user
        stage.save()
        
        ActivityLog.objects.create(
            user=request.user,
            action=f"Completed stage '{stage.name}' for projects/{project.id}",
            module="projects",
            details={"path": f"/projects/{project.id}", "stage_id": stage.id, "overridden": override}
        )
        
        next_stage = ProjectStage.objects.filter(project=project, sequence__gt=stage.sequence).order_by('sequence').first()
        if next_stage:
            next_stage.status = 'ACTIVE'
            next_stage.save()
            
            from apps.projects.models import WorkflowStage
            wf_stage = WorkflowStage.objects.filter(workflow=project.workflow, name=next_stage.name).first()
            if wf_stage:
                from apps.tasks.models import Task
                for task_template in wf_stage.task_templates.all():
                    if not Task.objects.filter(project=project, name=task_template.name).exists():
                        Task.objects.create(
                            name=task_template.name,
                            description=task_template.description,
                            project=project,
                            status='PENDING',
                            priority='MEDIUM',
                            completion_percentage=0
                        )
            
            ActivityLog.objects.create(
                user=request.user,
                action=f"Moved to stage '{next_stage.name}' for projects/{project.id}",
                module="projects",
                details={"path": f"/projects/{project.id}", "stage_id": next_stage.id}
            )
            
            if next_stage.name == 'Completed':
                project.status = 'COMPLETED'
                project.save()
            elif project.status == 'PLANNING':
                project.status = 'IN_PROGRESS'
                project.save()
        else:
            project.status = 'COMPLETED'
            project.save()
            
        return Response(ProjectSerializer(project).data)

    @action(detail=True, methods=['post'], url_path='set-stage')
    def set_stage(self, request, pk=None):
        project = self.get_object()
        if request.user.role != 'ADMIN':
            return Response({"error": "Only Administrators can change the active stage directly."}, status=status.HTTP_403_FORBIDDEN)
            
        stage_id = request.data.get('stage_id')
        if not stage_id:
            return Response({"error": "stage_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            target_stage = ProjectStage.objects.get(id=stage_id, project=project)
        except ProjectStage.DoesNotExist:
            return Response({"error": "Stage not found"}, status=status.HTTP_404_NOT_FOUND)
            
        # Update stage statuses
        stages = project.stages.all().order_by('sequence')
        for stage in stages:
            if stage.sequence < target_stage.sequence:
                stage.status = 'COMPLETED'
            elif stage.sequence == target_stage.sequence:
                stage.status = 'ACTIVE'
                stage.completed_at = None
                stage.approved_by = None
            else:
                stage.status = 'LOCKED'
                stage.completed_at = None
                stage.approved_by = None
            stage.save()
            
        # Update project status if target stage is Completed
        if target_stage.name == 'Completed':
            project.status = 'COMPLETED'
            project.save()
        elif target_stage.sequence == 1:
            project.status = 'PLANNING'
            project.save()
        else:
            project.status = 'IN_PROGRESS'
            project.save()

        # Instantiate task templates for the newly active stage if they do not exist
        from apps.projects.models import WorkflowStage
        wf_stage = WorkflowStage.objects.filter(workflow=project.workflow, name=target_stage.name).first()
        if wf_stage:
            from apps.tasks.models import Task
            for task_template in wf_stage.task_templates.all():
                if not Task.objects.filter(project=project, name=task_template.name).exists():
                    Task.objects.create(
                        name=task_template.name,
                        description=task_template.description,
                        project=project,
                        status='PENDING',
                        priority='MEDIUM',
                        completion_percentage=0
                    )
                    
        # Log action
        ActivityLog.objects.create(
            user=request.user,
            action=f"Manually set active stage to '{target_stage.name}' for projects/{project.id}",
            module="projects",
            details={"path": f"/projects/{project.id}", "stage_id": target_stage.id}
        )
        
        return Response(ProjectSerializer(project).data)

    @action(detail=True, methods=['post'], url_path='assign-stage-owner')
    def assign_stage_owner(self, request, pk=None):
        project = self.get_object()
        stage_id = request.data.get('stage_id')
        owner_id = request.data.get('owner_id')
        
        if not stage_id:
            return Response({"error": "stage_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            stage = ProjectStage.objects.get(id=stage_id, project=project)
        except ProjectStage.DoesNotExist:
            return Response({"error": "Stage not found"}, status=status.HTTP_404_NOT_FOUND)
            
        if request.user.role not in ['ADMIN', 'CHIEF', 'MANAGEMENT'] and project.project_manager != request.user:
            return Response({"error": "Only the project manager or management can assign stage owners"}, status=status.HTTP_403_FORBIDDEN)
            
        if owner_id:
            try:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                owner = User.objects.get(id=owner_id)
                stage.owner = owner
            except User.DoesNotExist:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            stage.owner = None
            
        stage.save()
        
        ActivityLog.objects.create(
            user=request.user,
            action=f"Assigned owner {stage.owner.email if stage.owner else 'Unassigned'} to stage '{stage.name}' for projects/{project.id}",
            module="projects",
            details={"path": f"/projects/{project.id}", "stage_id": stage.id}
        )
        
        return Response(ProjectSerializer(project).data)
