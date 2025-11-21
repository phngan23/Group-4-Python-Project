from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class MusicPlaylist(models.Model):
    """Playlist nhạc focus"""
    MUSIC_TYPES = [
        ('lofi', 'Lo-Fi Beats'),
        ('nature', 'Nature Sounds'),
        ('classical', 'Classical'),
        ('ambient', 'Ambient'),
        ('binaural', 'Binaural Beats'),
    ]
    
    name = models.CharField(max_length=100)
    music_type = models.CharField(max_length=20, choices=MUSIC_TYPES)
    description = models.TextField(blank=True)
    cover_color = models.CharField(max_length=7, default='#6C63FF')
    duration = models.IntegerField(default=3600)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Spotify integration fields
    spotify_playlist_id = models.CharField(max_length=100, blank=True, null=True)
    spotify_cover_url = models.URLField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.name} ({self.get_music_type_display()})"

class MusicTrack(models.Model):
    """Track nhạc trong playlist"""
    playlist = models.ForeignKey(MusicPlaylist, on_delete=models.CASCADE, related_name='tracks')
    title = models.CharField(max_length=200)
    artist = models.CharField(max_length=100, blank=True)
    audio_file = models.FileField(upload_to='music/', blank=True, null=True)
    duration = models.IntegerField()
    track_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Spotify integration fields
    spotify_track_id = models.CharField(max_length=100, blank=True, null=True)
    spotify_preview_url = models.URLField(blank=True, null=True)
    spotify_cover_url = models.URLField(blank=True, null=True)
    
    class Meta:
        ordering = ['track_order']
    
    def __str__(self):
        return f"{self.title} - {self.artist}"

class UserSpotifyProfile(models.Model):
    """Thông tin Spotify của user"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='spotify_profile')
    spotify_user_id = models.CharField(max_length=100, blank=True, null=True)
    access_token = models.TextField(blank=True, null=True)
    refresh_token = models.TextField(blank=True, null=True)
    token_expires = models.DateTimeField(blank=True, null=True)
    is_connected = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - Spotify"

class UserMusicSession(models.Model):
    """Session nghe nhạc của user"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='music_sessions')
    playlist = models.ForeignKey(MusicPlaylist, on_delete=models.CASCADE)
    start_time = models.DateTimeField(default=timezone.now)
    end_time = models.DateTimeField(null=True, blank=True)
    duration = models.DurationField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.playlist.name}"

class FavoritePlaylist(models.Model):
    """Playlist yêu thích của user"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorite_playlists')
    playlist = models.ForeignKey(MusicPlaylist, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'playlist']
    
    def __str__(self):
        return f"{self.user.username} - {self.playlist.name}"
