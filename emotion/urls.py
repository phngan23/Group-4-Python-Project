from django.urls import path
from . import views

app_name = 'emotion'

urlpatterns = [
    # Form nhập cảm xúc (ví dụ popup sau khi stop session)
    path('form/<int:session_id>/', views.emotion_form, name='emotion_form'),

    # Trang xem lịch sử + thống kê cảm xúc
    path('history/', views.emotion_history, name='emotion_history'),

    # API lưu cảm xúc
    path('save-mood/', views.save_emotion, name='save_emotion'),

    # API lấy dữ liệu thống kê cảm xúc
    path('stats/', views.get_emotion_stats, name='get_emotion_stats'),

    path('get-mood-data/', views.get_emotion_stats, name='get_mood_data'),
]
