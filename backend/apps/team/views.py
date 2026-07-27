from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.http import FileResponse, Http404
from django.utils import timezone
from apps.team.models import Profile, IdentityVerification
from apps.team.serializers import ProfileSerializer, IdentityVerificationSerializer
from apps.authentication.permissions import IsManagementOrAbove, IsAdmin
from apps.authentication.models import ActivityLog
import os

class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all().select_related('user', 'department')
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Employees/Interns/Fellows can see all profiles (for directory search)
        return self.queryset

    def update(self, request, *args, **kwargs):
        profile = self.get_object()
        user = request.user

        # Admin, Chief, Management can modify anything
        if user.role in ['ADMIN', 'CHIEF', 'MANAGEMENT']:
            return super().update(request, *args, **kwargs)

        # Other users can only update their own profile
        if profile.user != user:
            return Response(
                {"detail": "You do not have permission to edit this profile."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Restrict editable fields for normal users
        allowed_fields = ['phone', 'address', 'emergency_contact', 'skills', 'github', 'linkedin', 'bio']
        for key in list(request.data.keys()):
            if key not in allowed_fields:
                request.data.pop(key, None)

        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=['get', 'post'], url_path='identity')
    def identity(self, request, pk=None):
        profile = self.get_object()
        user = request.user

        # View identity status/document
        if request.method == 'GET':
            # Check permissions: profile owner or Admin/Chief/Management
            if profile.user != user and user.role not in ['ADMIN', 'CHIEF', 'MANAGEMENT']:
                return Response(
                    {"detail": "You are not authorized to view this document detail."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            try:
                verification = profile.identity_verification
                serializer = IdentityVerificationSerializer(verification)
                return Response(serializer.data)
            except IdentityVerification.DoesNotExist:
                return Response({"detail": "No identity document has been uploaded yet."}, status=status.HTTP_404_NOT_FOUND)

        # Upload identity document
        elif request.method == 'POST':
            # Only profile owner can upload their own document
            if profile.user != user:
                return Response(
                    {"detail": "You can only upload identity documents for your own profile."},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Create or update verification
            verification, created = IdentityVerification.objects.get_or_create(profile=profile)
            serializer = IdentityVerificationSerializer(verification, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save(status='PENDING')  # Reset status to pending upon new upload
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='verify-status')
    def verify_status(self, request, pk=None):
        # Action to verify or reject by Admin/Chief/Management
        profile = self.get_object()
        user = request.user

        if user.role not in ['ADMIN', 'CHIEF', 'MANAGEMENT']:
            return Response(
                {"detail": "Only Admin, Chief, and Management roles can verify identity documents."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            verification = profile.identity_verification
        except IdentityVerification.DoesNotExist:
            return Response({"detail": "No identity document to verify."}, status=status.HTTP_400_BAD_REQUEST)

        new_status = request.data.get('status')
        if new_status not in ['VERIFIED', 'REJECTED']:
            return Response({"detail": "Invalid status choice. Must be 'VERIFIED' or 'REJECTED'."}, status=status.HTTP_400_BAD_REQUEST)

        verification.status = new_status
        verification.verified_by = user
        verification.verified_date = timezone.now()
        verification.save()

        # Explicitly log identity verification action
        ActivityLog.objects.create(
            user=user,
            action=f"Changed Identity status of {profile.name} to {new_status}",
            module="TEAM",
            details={'profile_id': profile.id, 'status': new_status}
        )

        return Response(IdentityVerificationSerializer(verification).data)

    @action(detail=True, methods=['get'], url_path='identity-document')
    def download_identity_document(self, request, pk=None):
        profile = self.get_object()
        user = request.user

        # Access check: owner or Admin/Chief/Management
        if profile.user != user and user.role not in ['ADMIN', 'CHIEF', 'MANAGEMENT']:
            return Response(
                {"detail": "Access Denied. You do not have permissions to view this identity document."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            verification = profile.identity_verification
            if not verification.document_file:
                raise Http404("No file attached.")
        except IdentityVerification.DoesNotExist:
            raise Http404("No identity document uploaded.")

        # Log document access
        ActivityLog.objects.create(
            user=user,
            action=f"Downloaded/Viewed Identity Document of {profile.name}",
            module="TEAM",
            details={'profile_id': profile.id, 'doc_type': verification.document_type}
        )

        file_path = verification.document_file.path
        if os.path.exists(file_path):
            response = FileResponse(open(file_path, 'rb'))
            response['Content-Disposition'] = f'attachment; filename="{os.path.basename(file_path)}"'
            return response
        else:
            raise Http404("Document file not found on disk.")


from django.db import models as dj_models
from apps.team.models import Document
from apps.team.serializers import DocumentSerializer

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset
        
        # Filtering parameters
        profile_user_id = self.request.query_params.get('profile_user_id')
        project_id = self.request.query_params.get('project_id')
        task_id = self.request.query_params.get('task_id')
        scope = self.request.query_params.get('scope')

        if profile_user_id:
            queryset = queryset.filter(profile_user_id=profile_user_id)
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        if task_id:
            queryset = queryset.filter(task_id=task_id)
        if scope:
            queryset = queryset.filter(scope=scope)

        if user.role in ['ADMIN', 'CHIEF', 'MANAGEMENT']:
            return queryset
        
        # Normal users can only see documents they uploaded or documents related to their profile_user
        return queryset.filter(dj_models.Q(uploader=user) | dj_models.Q(profile_user=dj_models.F('uploader')) | dj_models.Q(profile_user=user))

    def perform_create(self, serializer):
        parent_id = self.request.data.get('parent_document')
        version = 1
        if parent_id:
            try:
                parent = Document.objects.get(id=parent_id)
                if parent.uploader == self.request.user or self.request.user.role in ['ADMIN', 'CHIEF', 'MANAGEMENT']:
                    version = parent.version + 1
            except Document.DoesNotExist:
                pass
        
        serializer.save(
            uploader=self.request.user,
            version=version
        )
