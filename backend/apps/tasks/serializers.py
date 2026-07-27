from rest_framework import serializers
from apps.tasks.models import Task, Comment
from apps.authentication.serializers import UserSerializer
from apps.projects.serializers import ProjectSerializer

class CommentSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)

    class Meta:
        model = Comment
        fields = '__all__'
        read_only_fields = ('user', 'created_at')


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_details = UserSerializer(source='assigned_to', read_only=True)
    project_details = ProjectSerializer(source='project', read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    dependency_details = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

    def get_dependency_details(self, obj):
        # Prevent infinite recursion by only serializing primary fields of dependencies
        return [{'id': dep.id, 'name': dep.name, 'status': dep.status} for dep in obj.dependencies.all()]
