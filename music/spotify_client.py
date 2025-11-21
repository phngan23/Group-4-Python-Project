import os
import spotipy
from spotipy.oauth2 import SpotifyOAuth, SpotifyClientCredentials
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

class SpotifyService:
    def __init__(self):
        self.client_id = getattr(settings, 'SPOTIFY_CLIENT_ID', '')
        self.client_secret = getattr(settings, 'SPOTIFY_CLIENT_SECRET', '')
        self.redirect_uri = getattr(settings, 'SPOTIFY_REDIRECT_URI', 'http://localhost:8000/music/spotify-callback/')
    
    def get_auth_url(self):
        """Tạo URL xác thực Spotify"""
        scope = 'user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing streaming'
        
        sp_oauth = SpotifyOAuth(
            client_id=self.client_id,
            client_secret=self.client_secret,
            redirect_uri=self.redirect_uri,
            scope=scope,
            cache_path=None
        )
        
        return sp_oauth.get_authorize_url()
    
    def get_user_token(self, code):
        """Lấy token từ authorization code"""
        sp_oauth = SpotifyOAuth(
            client_id=self.client_id,
            client_secret=self.client_secret,
            redirect_uri=self.redirect_uri
        )
        
        try:
            token_info = sp_oauth.get_access_token(code, as_dict=True)
            return token_info
        except Exception as e:
            logger.error(f"Error getting user token: {e}")
            return None
    
    def get_user_client(self, access_token):
        """Tạo Spotify client với user token"""
        try:
            return spotipy.Spotify(auth=access_token)
        except Exception as e:
            logger.error(f"Error creating user client: {e}")
            return None
    
    def search_tracks(self, query, limit=10, access_token=None):
        """Tìm kiếm track trên Spotify"""
        if access_token:
            sp = self.get_user_client(access_token)
        else:
            # Use client credentials for public data
            auth_manager = SpotifyClientCredentials(
                client_id=self.client_id,
                client_secret=self.client_secret
            )
            sp = spotipy.Spotify(auth_manager=auth_manager)
        
        if not sp:
            return []
        
        try:
            results = sp.search(q=query, limit=limit, type='track')
            tracks = []
            
            for item in results['tracks']['items']:
                track = {
                    'id': item['id'],
                    'title': item['name'],
                    'artist': ', '.join([artist['name'] for artist in item['artists']]),
                    'duration': item['duration_ms'] // 1000,  # Convert to seconds
                    'preview_url': item['preview_url'],
                    'cover_url': item['album']['images'][0]['url'] if item['album']['images'] else None,
                    'external_url': item['external_urls']['spotify']
                }
                tracks.append(track)
            
            return tracks
        except Exception as e:
            logger.error(f"Error searching tracks: {e}")
            return []
    
    def get_recommendations(self, seed_tracks=None, seed_genres=None, limit=20, access_token=None):
        """Lấy recommendations từ Spotify"""
        if access_token:
            sp = self.get_user_client(access_token)
        else:
            auth_manager = SpotifyClientCredentials(
                client_id=self.client_id,
                client_secret=self.client_secret
            )
            sp = spotipy.Spotify(auth_manager=auth_manager)
        
        if not sp:
            return []
        
        try:
            recommendations = sp.recommendations(
                seed_tracks=seed_tracks or [],
                seed_genres=seed_genres or ['lofi', 'classical', 'ambient'],
                limit=limit
            )
            
            tracks = []
            for item in recommendations['tracks']:
                track = {
                    'id': item['id'],
                    'title': item['name'],
                    'artist': ', '.join([artist['name'] for artist in item['artists']]),
                    'duration': item['duration_ms'] // 1000,
                    'preview_url': item['preview_url'],
                    'cover_url': item['album']['images'][0]['url'] if item['album']['images'] else None,
                    'external_url': item['external_urls']['spotify']
                }
                tracks.append(track)
            
            return tracks
        except Exception as e:
            logger.error(f"Error getting recommendations: {e}")
            return []
    
    def get_user_playlists(self, access_token):
        """Lấy playlists của user từ Spotify"""
        sp = self.get_user_client(access_token)
        if not sp:
            return []
        
        try:
            playlists = sp.current_user_playlists(limit=20)
            return playlists['items']
        except Exception as e:
            logger.error(f"Error getting user playlists: {e}")
            return []

# Global instance
spotify_service = SpotifyService()