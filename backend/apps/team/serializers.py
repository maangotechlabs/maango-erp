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
    workload_indicator = serializers.SerializerMethodField()
    fellowship_details = serializers.SerializerMethodField()

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

    def get_workload_indicator(self, obj):
        count = self.get_active_tasks_count(obj)
        if count <= 2:
            return 'Low'
        elif count <= 5:
            return 'Normal'
        else:
            return 'High'

    def get_fellowship_details(self, obj):
        if obj.user.role != 'FELLOW':
            return None
        from apps.projects.models import Project
        f_projects = Project.objects.filter(developers=obj.user)
        primary_proj = f_projects.first()
        if not primary_proj:
            return {
                'project_id': None,
                'project_name': 'No Fellowship Project',
                'progress_pct': 0,
                'mentor_name': 'None',
                'deadline': None
            }
        
        proj_tasks = primary_proj.tasks.filter(assigned_to=obj.user)
        pct = 0
        if proj_tasks.exists():
            pct = round(sum(t.completion_percentage for t in proj_tasks) / proj_tasks.count())
        
        mentor_name = primary_proj.project_manager.first_name if primary_proj.project_manager else "None"
        
        return {
            'project_id': primary_proj.id,
            'project_name': primary_proj.name,
            'progress_pct': pct,
            'mentor_name': mentor_name,
            'deadline': primary_proj.end_date
        }


from apps.team.models import Document

class DocumentSerializer(serializers.ModelSerializer):
    uploader_details = UserMiniSerializer(source='uploader', read_only=True)

    class Meta:
        model = Document
        fields = '__all__'
        read_only_fields = ('uploader', 'version', 'created_at', 'updated_at')
