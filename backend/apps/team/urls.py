from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.team.views import ProfileViewSet, DocumentViewSet

router = DefaultRouter()
router.register(r'profiles', ProfileViewSet, basename='profile')
router.register(r'documents', DocumentViewSet, basename='document')

urlpatterns = [
    path('', include(router.urls)),
]
