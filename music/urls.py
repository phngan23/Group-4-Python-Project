from django.urls import path
from . import views

urlpatterns = [
    path('', views.music_player, name='music_player'),
    path('connect-spotify/', views.connect_spotify, name='connect_spotify'),
    path('spotify-callback/', views.spotify_callback, name='spotify_callback'),
    path('api/playlists/', views.get_playlists, name='get_playlists'),
    path('api/spotify-playlist/<str:playlist_id>/tracks/', views.get_spotify_playlist_tracks, name='get_spotify_playlist_tracks'),
    path('api/recommendations/', views.get_recommendations, name='get_recommendations'),
    path('api/favorite/<int:playlist_id>/', views.toggle_favorite, name='toggle_favorite'),
    path('api/favorites/', views.get_favorites, name='get_favorite_playlists'),

]