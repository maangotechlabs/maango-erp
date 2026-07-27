from rest_framework import serializers
from apps.team.models import Profile, IdentityVerification
from apps.system_settings.serializers import DepartmentSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role')


class IdentityVerificationSerializer(serializers.ModelSerializer):
    verified_by_details = UserMiniSerializer(source='verified_by', read_only=True)
    
    class Meta:
        model = IdentityVerification
        fields = '__all__'
        read_only_fields = ('profile', 'verified_by', 'verified_date')


class ProfileSerializer(serializers.ModelSerializer):
    user_details = UserMiniSerializer(source='user', read_only=True)
    department_details = DepartmentSerializer(source='department', read_only=True)
    age = serializers.IntegerField(read_only=True)
    verification_status = serializers.SerializerMethodField()
    active_projects_count = serializers.SerializerMethodField()
    active_tasks_count = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = '__all__'
        read_only_fields = ('employee_id', 'age')

    def get_verification_status(self, obj):
        if hasattr(obj, 'identity_verification'):
            return obj.identity_verification.status
        return 'UNSUBMITTED'

    def get_active_projects_count(self, obj):
        from apps.projects.models import Project
        from django.db.models import Q
        return Project.objects.filter(
            Q(developers=obj.user) | Q(members=obj.user) | Q(project_manager=obj.user),
            status='IN_PROGRESS'
        ).distinct().count()

    def get_active_tasks_count(self, obj):
        from apps.tasks.models import Task
        return Task.objects.filter(assigned_to=obj.user).exclude(status='COMPLETED').count()


from apps.team.models import Document

class DocumentSerializer(serializers.ModelSerializer):
    uploader_details = UserMiniSerializer(source='uploader', read_only=True)

    class Meta:
        model = Document
        fields = '__all__'
        read_only_fields = ('uploader', 'version', 'created_at', 'updated_at')
