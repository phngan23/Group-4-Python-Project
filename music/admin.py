from django.contrib import admin
from .models import MusicPlaylist, MusicTrack, UserSpotifyProfile, UserMusicSession, FavoritePlaylist

@admin.register(MusicPlaylist)
class MusicPlaylistAdmin(admin.ModelAdmin):
    list_display = ['name', 'music_type', 'duration', 'is_active', 'created_at']
    list_filter = ['music_type', 'is_active']
    search_fields = ['name', 'description']

@admin.register(MusicTrack)
class MusicTrackAdmin(admin.ModelAdmin):
    list_display = ['title', 'artist', 'playlist', 'duration', 'track_order']
    list_filter = ['playlist__music_type']
    search_fields = ['title', 'artist']

@admin.register(UserSpotifyProfile)
class UserSpotifyProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'spotify_user_id', 'is_connected', 'created_at']
    list_filter = ['is_connected']

@admin.register(UserMusicSession)
class UserMusicSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'playlist', 'start_time', 'duration']
    list_filter = ['start_time']

@admin.register(FavoritePlaylist)
class FavoritePlaylistAdmin(admin.ModelAdmin):
    list_display = ['user', 'playlist', 'created_at']
    list_filter = ['created_at']