from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required

from .models import MusicTrack

def ensure_default_tracks():
    """Đảm bảo các track mặc định luôn tồn tại trong database"""
    default_tracks = [
        {
            "title": "Head Nod",
            "description": "Lo-fi beats for focus",
            "category": "lofi",
            "static_audio_path": "music/default/head-nod.mp3",
            "cover_color": "#6C63FF",
            "is_default": True,
        },
        {
            "title": "Hẹn Hò Nhưng Không Yêu",
            "description": "Chill Vietnamese lo-fi",
            "category": "lofi", 
            "static_audio_path": "music/default/hen-ho-nhung-khong-yeu.mp3",
            "cover_color": "#FF6B6B",
            "is_default": True,
        },
        {
            "title": "Home",
            "description": "Ambient home sounds",
            "category": "ambient",
            "static_audio_path": "music/default/home.mp3",
            "cover_color": "#4ECDC4",
            "is_default": True,
        },
        {
            "title": "Sad Beat", 
            "description": "Melancholic focus beats",
            "category": "lofi",
            "static_audio_path": "music/default/sad-beat.mp3",
            "cover_color": "#45B7D1",
            "is_default": True,
        }
    ]
    
    for track_data in default_tracks:
        MusicTrack.objects.get_or_create(
            title=track_data["title"],
            defaults=track_data
        )

@login_required
def music_player(request):
    """
    Trang Music chính – chỉ render template,
    data track sẽ được load qua API /music/api/tracks/
    """
    # Đảm bảo track mặc định tồn tại
    ensure_default_tracks()
    
    return render(request, "music/music_player.html", {
        "active_page": "music",
    })


@login_required
def api_tracks(request):
    """
    API trả về list track để hiển thị phần "Select your focus music"
    và dùng cho Now Playing player.
    """
    # Đảm bảo track mặc định tồn tại
    ensure_default_tracks()
    
    tracks = MusicTrack.objects.filter(is_active=True).order_by("id")

    data = []
    for t in tracks:
        audio_url = t.get_audio_url
        cover_image_url = t.cover_image.url if t.cover_image else ""

        data.append({
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "category": t.category,
            "audio_url": audio_url,
            "cover_color": t.cover_color,
            "cover_image_url": cover_image_url,
            "is_default": t.is_default,
        })

    return JsonResponse({
        "status": "success",
        "tracks": data,
    })
