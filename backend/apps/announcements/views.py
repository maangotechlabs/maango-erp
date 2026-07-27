from rest_framework import viewsets, permissions
from apps.announcements.models import Announcement
from apps.announcements.serializers import AnnouncementSerializer
from apps.authentication.permissions import IsManagementOrAbove

class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all().select_related('author')
    serializer_class = AnnouncementSerializer

    def get_permissions(self):
        # Read-only for normal employees, Interns and Fellows
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        # Write operations restricted to Admin, Chief, and Management
        return [permissions.IsAuthenticated(), IsManagementOrAbove()]

    def perform_create(self, serializer):
        announcement = serializer.save(author=self.request.user)
        
        # Dispatch notification to all active team members
        from apps.authentication.models import User, Notification
        active_users = User.objects.filter(is_active=True).exclude(id=self.request.user.id)
        
        notifications = [
            Notification(
                recipient=u,
                title="New Announcement",
                message=f"Notice: '{announcement.title}' has been posted.",
                link="/announcements"
            )
            for u in active_users
        ]
        Notification.objects.bulk_create(notifications)
