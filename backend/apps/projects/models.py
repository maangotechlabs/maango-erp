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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'projects'
        ordering = ['-created_at']

    def __str__(self):
        return self.name
