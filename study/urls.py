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

    # API: stop session hiện tại và LƯU kết quả (Dùng khi học xong hoặc Reset > 1 phút)
    path('api/stop/', views.api_stop_session, name='api_stop_session'),

    # Hủy session và XÓA khỏi DB (Dùng khi Reset < 1 phút)
    path('api/cancel/', views.api_cancel_session, name='api_cancel_session'),

    # API: pause session
    path('api/pause/', views.api_pause_session, name='api_pause'), 

    # API: resume session
    path('api/resume/', views.api_resume_session, name='api_resume'),

    # API: add subject
    path("api/add-subject/", views.api_add_subject, name="add_subject"),
    
    # API: check session status
    path('api/session-status/', views.api_get_session_status, name='api_session_status'),
]
