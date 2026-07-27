from rest_framework import serializers
from apps.announcements.models import Announcement
from apps.authentication.serializers import UserSerializer

class AnnouncementSerializer(serializers.ModelSerializer):
    author_details = UserSerializer(source='author', read_only=True)

    class Meta:
        model = Announcement
        fields = '__all__'
        read_only_fields = ('author', 'created_at')
