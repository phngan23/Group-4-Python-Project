from django.urls import path
from . import views

app_name = 'visualization'

urlpatterns = [
    # Pages
    path('stats/', views.study_stats, name='study_stats'),
    path('sessions/', views.study_sessions, name='study_sessions'),
    path('subjects/', views.subject_breakdown, name='subject_breakdown'),
    
    # APIs
    path('api/stats/', views.api_study_stats, name='api_study_stats'),
    path('api/sessions/', views.api_study_sessions, name='api_study_sessions'),
    path('api/subjects/', views.api_subject_breakdown, name='api_subject_breakdown'),
]