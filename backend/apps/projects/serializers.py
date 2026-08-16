from rest_framework import serializers
from apps.projects.models import (
    Project, Workflow, WorkflowStage, WorkflowDeliverable,
    WorkflowTaskTemplate, ProjectStage, ProjectDeliverable, ProjectDeliverableAttachment
)
from apps.authentication.serializers import UserSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


class WorkflowDeliverableSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowDeliverable
        fields = '__all__'


class WorkflowStageSerializer(serializers.ModelSerializer):
    deliverables = WorkflowDeliverableSerializer(many=True, read_only=True)

    class Meta:
        model = WorkflowStage
        fields = '__all__'


class WorkflowSerializer(serializers.ModelSerializer):
    stages = WorkflowStageSerializer(many=True, read_only=True)

    class Meta:
        model = Workflow
        fields = '__all__'


class ProjectDeliverableAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectDeliverableAttachment
        fields = '__all__'


class ProjectDeliverableSerializer(serializers.ModelSerializer):
    uploaded_by_details = UserSerializer(source='uploaded_by', read_only=True)
    approved_by_details = UserSerializer(source='approved_by', read_only=True)
    attachments = ProjectDeliverableAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = ProjectDeliverable
        fields = '__all__'


class ProjectStageSerializer(serializers.ModelSerializer):
    owner_details = UserSerializer(source='owner', read_only=True)
    approved_by_details = UserSerializer(source='approved_by', read_only=True)
    deliverables = ProjectDeliverableSerializer(many=True, read_only=True)

    class Meta:
        model = ProjectStage
        fields = '__all__'


class ProjectSerializer(serializers.ModelSerializer):
    project_manager_details = UserSerializer(source='project_manager', read_only=True)
    developers_details = UserSerializer(source='developers', many=True, read_only=True)
    members_details = UserSerializer(source='members', many=True, read_only=True)
    stages = ProjectStageSerializer(many=True, read_only=True)
    workflow_details = WorkflowSerializer(source='workflow', read_only=True)
    tasks_count = serializers.SerializerMethodField()
    members_count = serializers.SerializerMethodField()
    completion_percentage = serializers.SerializerMethodField()
    health_status = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

    def get_tasks_count(self, obj):
        return obj.tasks.count()

    def get_members_count(self, obj):
        count = 1 if obj.project_manager else 0
        count += obj.developers.count()
        count += obj.members.count()
        return count

    def get_completion_percentage(self, obj):
        tasks = obj.tasks.all()
        if not tasks.exists():
            return 0
        total = sum(t.completion_percentage for t in tasks)
        return round(total / tasks.count())

    def get_health_status(self, obj):
        from django.utils import timezone
        from datetime import date
        
        if obj.status == 'COMPLETED':
            return 'ON_TRACK'
            
        progress = self.get_completion_percentage(obj)
        if not obj.end_date:
            return 'ON_TRACK'
            
        today = timezone.now().date()
        if obj.end_date < today:
            return 'DELAYED'
            
        remaining_days = (obj.end_date - today).days
        if remaining_days <= 7 and progress < 50:
            return 'DELAYED'
        elif remaining_days <= 14 and progress < 80:
            return 'AT_RISK'
            
        return 'ON_TRACK'
