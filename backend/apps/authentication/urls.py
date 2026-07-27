from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from apps.authentication.views import (
    CustomTokenObtainPairView, 
    MeView, 
    UserViewSet, 
    NotificationViewSet, 
    ActivityLogViewSet,
    ChangePasswordView
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'logs', ActivityLogViewSet, basename='activity_log')

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='auth_me'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('', include(router.urls)),
]
