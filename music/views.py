from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required

from .models import MusicTrack


@login_required
def music_player(request):
    """
    Trang Music chính – chỉ render template,
    data track sẽ được load qua API /music/api/tracks/
    """
    return render(request, "music/music_player.html", {
        "active_page": "music",
    })


@login_required
def api_tracks(request):
    """
    API trả về list track để hiển thị phần "Select your focus music"
    và dùng cho Now Playing player.
    """
    tracks = MusicTrack.objects.filter(is_active=True).order_by("id")

    data = []
    for t in tracks:
        audio_url = t.audio_file.url if t.audio_file else ""
        cover_image_url = t.cover_image.url if t.cover_image else ""

        data.append({
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "category": t.category,
            "audio_url": audio_url,
            "cover_color": t.cover_color,
            "cover_image_url": cover_image_url,
        })

    return JsonResponse({
        "status": "success",
        "tracks": data,
    })
