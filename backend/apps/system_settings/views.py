from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.system_settings.models import CompanyProfile, Department, WorkingDays, Holiday
from apps.system_settings.serializers import (
    CompanyProfileSerializer, 
    DepartmentSerializer, 
    WorkingDaysSerializer, 
    HolidaySerializer
)
from apps.authentication.permissions import IsManagementOrAbove

class CompanyProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH']:
            return [permissions.IsAuthenticated(), IsManagementOrAbove()]
        return super().get_permissions()

    def get(self, request):
        profile, created = CompanyProfile.objects.get_or_create(id=1)
        serializer = CompanyProfileSerializer(profile)
        return Response(serializer.data)

    def put(self, request):
        profile, created = CompanyProfile.objects.get_or_create(id=1)
        serializer = CompanyProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WorkingDaysView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH']:
            return [permissions.IsAuthenticated(), IsManagementOrAbove()]
        return super().get_permissions()

    def get(self, request):
        config, created = WorkingDays.objects.get_or_create(id=1)
        serializer = WorkingDaysSerializer(config)
        return Response(serializer.data)

    def put(self, request):
        config, created = WorkingDays.objects.get_or_create(id=1)
        serializer = WorkingDaysSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsManagementOrAbove()]
        return super().get_permissions()


class HolidayViewSet(viewsets.ModelViewSet):
    queryset = Holiday.objects.all().order_by('date')
    serializer_class = HolidaySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsManagementOrAbove()]
        return super().get_permissions()
