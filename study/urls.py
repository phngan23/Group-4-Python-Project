from django.urls import path
from . import views

app_name = 'study'

urlpatterns = [
    # Trang Pomodoro UI
    path('timer/', views.pomodoro_view, name='timer'),

    # Lịch sử học
    path('history/', views.study_history, name='history'),

    # API: bắt đầu session
    path('api/start/', views.api_start_session, name='api_start_session'),

    # API: dừng session hiện tại
    path('api/stop/', views.api_stop_session, name='api_stop_session'),

    # API: add subject
    path("api/add-subject/", views.api_add_subject, name="add_subject"),
    
    # API: check session status
    path('api/session-status/', views.api_get_session_status, name='api_session_status'),
]
