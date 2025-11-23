from django.urls import path
from . import views

app_name = "music"

urlpatterns = [
    # Trang player chính: /music/
    path("", views.music_player, name="music_player"),

    # API load danh sách track: /music/api/tracks/
    path("api/tracks/", views.api_tracks, name="api_tracks"),
]
