from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
import json
from .models import MusicPlaylist, MusicTrack, UserSpotifyProfile, FavoritePlaylist
from .spotify_client import spotify_service
from django.utils import timezone
from datetime import timedelta

@login_required
def music_player(request):
    """Trang music player chính"""
    return render(request, 'music/music_player.html', {
        "active_page": "music"
    })

@login_required
def connect_spotify(request):
    """Kết nối với Spotify"""
    auth_url = spotify_service.get_auth_url()
    return redirect(auth_url)

@login_required
def spotify_callback(request):
    """Xử lý callback từ Spotify"""
    code = request.GET.get('code')
    error = request.GET.get('error')
    
    if error:
        return redirect('/music/?error=auth_failed')
    
    if code:
        token_info = spotify_service.get_user_token(code)
        if token_info:
            # Lưu thông tin user
            sp = spotify_service.get_user_client(token_info['access_token'])
            if sp:
                try:
                    user_info = sp.current_user()
                    
                    # Lưu hoặc cập nhật profile
                    profile, created = UserSpotifyProfile.objects.get_or_create(
                        user=request.user
                    )
                    profile.spotify_user_id = user_info['id']
                    profile.access_token = token_info['access_token']
                    profile.refresh_token = token_info.get('refresh_token')
                    profile.token_expires = timezone.now() + timedelta(seconds=token_info['expires_in'])
                    profile.is_connected = True
                    profile.save()
                    
                    return redirect('/music/?spotify_connected=true')
                except Exception as e:
                    print(f"Error getting user info: {e}")
    
    return redirect('/music/?error=auth_failed')

@login_required
def get_playlists(request):
    """API lấy danh sách playlist"""
    try:
        # Lấy playlists từ database
        playlists = MusicPlaylist.objects.filter(is_active=True)

        # Kiểm tra nếu user đã kết nối Spotify
        spotify_connected = False
        spotify_playlists = []
        
        try:
            profile = UserSpotifyProfile.objects.get(user=request.user, is_connected=True)
            spotify_connected = True
            
            # Lấy playlists từ Spotify
            if profile.access_token:
                spotify_playlists = spotify_service.get_user_playlists(profile.access_token)
                
        except UserSpotifyProfile.DoesNotExist:
            pass
        
        # Chuẩn bị data
        playlist_data = []
        for playlist in playlists:
            tracks = playlist.tracks.all()
            tracks_data = [
                {
                    'title': track.title,
                    'artist': track.artist,
                    'duration': track.duration,
                    'audio_url': track.spotify_preview_url or (track.audio_file.url if track.audio_file else None),
                    'cover_url': track.spotify_cover_url
                } for track in tracks
            ]

            playlist_data.append({
                'id': playlist.id,
                'name': playlist.name,
                'type': playlist.music_type,
                'description': playlist.description,
                'cover_color': playlist.cover_color,
                'duration': playlist.duration,
                'track_count': tracks.count(),
                'tracks': tracks_data
            })
        
        # Thêm Spotify playlists
        for sp_playlist in spotify_playlists:
            cover_url = None
            if sp_playlist.get('images') and len(sp_playlist['images']) > 0:
                cover_url = sp_playlist['images'][0]['url']

            playlist_data.append({
                'id': f"spotify_{sp_playlist['id']}",
                'name': sp_playlist['name'],
                'type': 'spotify',
                'description': f"Spotify playlist with {sp_playlist['tracks']['total']} tracks",
                'cover_color': '#1DB954',  # Spotify green
                'cover_url': sp_playlist['images'][0]['url'] if sp_playlist['images'] else None,
                'duration': 0,
                'track_count': sp_playlist['tracks']['total'],
                'is_spotify': True,
                'spotify_id': sp_playlist['id'],
                'tracks': []  # Will load tracks when selected
            })
        
        return JsonResponse({
            'playlists': playlist_data,
            'spotify_connected': spotify_connected
        })
        
    except Exception as e:
        print(f"Error in get_playlists: {e}")
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def get_spotify_playlist_tracks(request, playlist_id):
    """API lấy tracks từ Spotify playlist"""
    try:
        profile = UserSpotifyProfile.objects.get(user=request.user, is_connected=True)
        sp = spotify_service.get_user_client(profile.access_token)
        
        if sp:
            results = sp.playlist_tracks(playlist_id)
            tracks = []
            
            for item in results['items']:
                track_info = item['track']
                if track_info and track_info['preview_url']:  # Only include tracks with preview
                    tracks.append({
                        'title': track_info['name'],
                        'artist': ', '.join([artist['name'] for artist in track_info['artists']]),
                        'duration': track_info['duration_ms'] // 1000,
                        'audio_url': track_info['preview_url'],
                        'cover_url': track_info['album']['images'][0]['url'] if track_info['album']['images'] else None
                    })
            
            return JsonResponse({'tracks': tracks})
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'tracks': []})

@login_required
def get_recommendations(request):
    """API lấy recommendations từ Spotify"""
    try:
        music_type = request.GET.get('type', 'lofi')
        
        # Map music types to Spotify genres
        genre_map = {
            'lofi': ['chill', 'lofi'],
            'classical': ['classical'],
            'ambient': ['ambient'],
            'nature': ['ambient'],  # Fallback
            'binaural': ['ambient']  # Fallback
        }
        
        genres = genre_map.get(music_type, ['chill'])
        
        # Try to get user-specific recommendations if connected
        access_token = None
        try:
            profile = UserSpotifyProfile.objects.get(user=request.user, is_connected=True)
            access_token = profile.access_token
        except UserSpotifyProfile.DoesNotExist:
            pass
        
        tracks = spotify_service.get_recommendations(
            seed_genres=genres, 
            limit=10, 
            access_token=access_token
        )
        
        return JsonResponse({'tracks': tracks})
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
@csrf_exempt
def toggle_favorite(request, playlist_id):
    """API thêm/xóa playlist yêu thích"""
    if request.method == 'POST':
        try:
            playlist = MusicPlaylist.objects.get(id=playlist_id)
            favorite, created = FavoritePlaylist.objects.get_or_create(
                user=request.user,
                playlist=playlist
            )
            
            if not created:
                favorite.delete()
                return JsonResponse({'status': 'removed'})
            else:
                return JsonResponse({'status': 'added'})
                
        except MusicPlaylist.DoesNotExist:
            return JsonResponse({'error': 'Playlist not found'}, status=404)
    
    return JsonResponse({'error': 'Invalid method'}, status=400)

@login_required
def get_favorites(request):
    """Lấy danh sách playlist yêu thích của user"""
    try:
        favorites = FavoritePlaylist.objects.filter(user=request.user)
        data = []

        for fav in favorites:
            playlist = fav.playlist
            tracks = playlist.tracks.all()

            data.append({
                'id': playlist.id,
                'name': playlist.name,
                'type': playlist.music_type,
                'description': playlist.description,
                'cover_color': playlist.cover_color,
                'track_count': tracks.count(),
                'duration': playlist.duration,
                'tracks': [
                    {
                        'title': t.title,
                        'artist': t.artist,
                        'duration': t.duration,
                        'audio_url': t.spotify_preview_url or (t.audio_file.url if t.audio_file else None),
                        'cover_url': t.spotify_cover_url
                    }
                    for t in tracks
                ]
            })

        return JsonResponse({'favorites': data})

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
