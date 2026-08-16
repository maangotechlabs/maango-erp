from django.db import models
from django.conf import settings

class ProjectPriorityChoices(models.TextChoices):
    LOW = 'LOW', 'Low'
    MEDIUM = 'MEDIUM', 'Medium'
    HIGH = 'HIGH', 'High'
    CRITICAL = 'CRITICAL', 'Critical'


class ProjectStatusChoices(models.TextChoices):
    PLANNING = 'PLANNING', 'Planning'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    ON_HOLD = 'ON_HOLD', 'On Hold'
    COMPLETED = 'COMPLETED', 'Completed'
    CANCELLED = 'CANCELLED', 'Cancelled'


class Project(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    client = models.CharField(max_length=255, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    priority = models.CharField(
        max_length=20,
        choices=ProjectPriorityChoices.choices,
        default=ProjectPriorityChoices.MEDIUM
    )
    status = models.CharField(
        max_length=20,
        choices=ProjectStatusChoices.choices,
        default=ProjectStatusChoices.PLANNING
    )
    estimated_hours = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    actual_hours = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    project_manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_projects'
    )
    developers = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='dev_projects'
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='member_projects'
    )
    notes = models.TextField(blank=True)
    workflow = models.ForeignKey('Workflow', on_delete=models.SET_NULL, null=True, blank=True, related_name='projects')
    project_type = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'projects'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if not self.workflow:
            default_wf = Workflow.objects.filter(is_default=True).first()
            if default_wf:
                self.workflow = default_wf
                if not self.project_type:
                    self.project_type = default_wf.name
        super().save(*args, **kwargs)
        if is_new and self.workflow:
            self.initialize_stages()

    def initialize_stages(self):
        if self.stages.exists():
            return
        if not self.workflow:
            default_wf = Workflow.objects.filter(is_default=True).first()
            if default_wf:
                self.workflow = default_wf
                self.save()
            else:
                return
        stages_data = self.workflow.stages.all().order_by('sequence')
        for stage_template in stages_data:
            status_val = 'ACTIVE' if stage_template.sequence == 1 else 'PENDING'
            owner_val = None
            if stage_template.owner_role == 'MANAGEMENT' and self.project_manager:
                owner_val = self.project_manager
            
            project_stage = ProjectStage.objects.create(
                project=self,
                name=stage_template.name,
                sequence=stage_template.sequence,
                status=status_val,
                owner=owner_val
            )
            
            for del_template in stage_template.deliverables.all():
                ProjectDeliverable.objects.create(
                    stage=project_stage,
                    title=del_template.title,
                    description=del_template.description,
                    deliverable_type=del_template.deliverable_type,
                    is_required=del_template.is_required
                )
                
            if status_val == 'ACTIVE':
                from apps.tasks.models import Task
                for task_template in stage_template.task_templates.all():
                    # Check if task already exists to prevent duplicate seeding issues
                    if not Task.objects.filter(project=self, name=task_template.name).exists():
                        Task.objects.create(
                            name=task_template.name,
                            description=task_template.description,
                            project=self,
                            status='PENDING',
                            priority='MEDIUM',
                            completion_percentage=0
                        )


class Workflow(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'workflows'

    def __str__(self):
        return self.name


class WorkflowStage(models.Model):
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE, related_name='stages')
    name = models.CharField(max_length=255)
    sequence = models.PositiveIntegerField()
    owner_role = models.CharField(max_length=50, blank=True)  # Role that normally owns this stage
    approver_role = models.CharField(max_length=50, blank=True)  # Role that normally approves this stage

    class Meta:
        db_table = 'workflow_stages'
        ordering = ['sequence']

    def __str__(self):
        return f"{self.workflow.name} - Stage {self.sequence}: {self.name}"


class WorkflowDeliverable(models.Model):
    stage = models.ForeignKey(WorkflowStage, on_delete=models.CASCADE, related_name='deliverables')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    deliverable_type = models.CharField(max_length=50)  # e.g., FILE_UPLOAD, RICH_TEXT, URL, etc.
    is_required = models.BooleanField(default=True)

    class Meta:
        db_table = 'workflow_deliverables'

    def __str__(self):
        return f"{self.stage.name} - Deliverable: {self.title}"


class WorkflowTaskTemplate(models.Model):
    stage = models.ForeignKey(WorkflowStage, on_delete=models.CASCADE, related_name='task_templates')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'workflow_task_templates'

    def __str__(self):
        return f"{self.stage.name} - Task: {self.name}"


class ProjectStage(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='stages')
    name = models.CharField(max_length=255)
    sequence = models.PositiveIntegerField()
    status = models.CharField(
        max_length=20,
        default='PENDING',
        choices=[('PENDING', 'Pending'), ('ACTIVE', 'Active'), ('COMPLETED', 'Completed')]
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='owned_project_stages'
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_project_stages'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'project_stages'
        ordering = ['sequence']

    def __str__(self):
        return f"{self.project.name} - {self.name} ({self.status})"


class ProjectDeliverable(models.Model):
    stage = models.ForeignKey(ProjectStage, on_delete=models.CASCADE, related_name='deliverables')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    deliverable_type = models.CharField(max_length=50)
    is_required = models.BooleanField(default=True)
    status = models.CharField(
        max_length=20,
        default='PENDING',
        choices=[('PENDING', 'Pending'), ('SUBMITTED', 'Submitted'), ('APPROVED', 'Approved'), ('REJECTED', 'Rejected')]
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='submitted_deliverables'
    )
    submitted_date = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_deliverables'
    )
    remarks = models.TextField(blank=True)
    value_text = models.TextField(blank=True)
    value_file = models.FileField(upload_to='deliverables/', null=True, blank=True)

    class Meta:
        db_table = 'project_deliverables'

    def __str__(self):
        return f"{self.stage.project.name} - {self.stage.name} - {self.title} ({self.status})"


class ProjectDeliverableAttachment(models.Model):
    deliverable = models.ForeignKey(ProjectDeliverable, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='deliverables/attachments/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'project_deliverable_attachments'

    def __str__(self):
        return f"Attachment for {self.deliverable.title}"
