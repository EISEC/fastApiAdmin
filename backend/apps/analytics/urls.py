from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AnalyticsEventViewSet, DailyStatsViewSet, UserSessionViewSet

app_name = 'analytics'

router = DefaultRouter()
router.register(r'events', AnalyticsEventViewSet, basename='analytics-events')
router.register(r'daily-stats', DailyStatsViewSet, basename='daily-stats')
router.register(r'sessions', UserSessionViewSet, basename='user-sessions')

urlpatterns = [
    path('', include(router.urls)),
] 