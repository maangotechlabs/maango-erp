from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from apps.authentication.views import DashboardView, ReportsView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # MaAngo ERP API version 1
    path('api/v1/auth/', include('apps.authentication.urls')),
    path('api/v1/settings/', include('apps.system_settings.urls')),
    path('api/v1/team/', include('apps.team.urls')),
    
    # Dashboard API routed directly from auth views
    path('api/v1/dashboard/', DashboardView.as_view(), name='dashboard_stats'),
    path('api/v1/reports/', ReportsView.as_view(), name='reports_stats'),
    
    # Flat routers registered at v1 root
    path('api/v1/', include('apps.projects.urls')),
    path('api/v1/', include('apps.tasks.urls')),
    path('api/v1/', include('apps.announcements.urls')),
]

# Serve media and static files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
