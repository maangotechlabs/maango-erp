from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.system_settings.views import (
    CompanyProfileView, 
    WorkingDaysView, 
    DepartmentViewSet, 
    HolidayViewSet
)

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'holidays', HolidayViewSet, basename='holiday')

urlpatterns = [
    path('company-profile/', CompanyProfileView.as_view(), name='company_profile'),
    path('working-days/', WorkingDaysView.as_view(), name='working_days'),
    path('', include(router.urls)),
]
