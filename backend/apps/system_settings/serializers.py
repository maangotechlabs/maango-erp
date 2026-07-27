from rest_framework import serializers
from apps.system_settings.models import CompanyProfile, Department, WorkingDays, Holiday

class CompanyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyProfile
        fields = '__all__'


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'


class WorkingDaysSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkingDays
        fields = '__all__'


class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = '__all__'
