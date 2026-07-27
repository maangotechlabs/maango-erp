from rest_framework import serializers
from apps.projects.models import Project
from apps.authentication.serializers import UserSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class ProjectSerializer(serializers.ModelSerializer):
    project_manager_details = UserSerializer(source='project_manager', read_only=True)
    developers_details = UserSerializer(source='developers', many=True, read_only=True)
    members_details = UserSerializer(source='members', many=True, read_only=True)
    tasks_count = serializers.SerializerMethodField()
    members_count = serializers.SerializerMethodField()
    completion_percentage = serializers.SerializerMethodField()

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
