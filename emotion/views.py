from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
import json

from accounts.models import Profile
from study.models import StudySession
from .models import EmotionEntry
from .models import EmotionStats


@login_required
def emotion_form(request, session_id):
    """Render giao diện form cảm xúc sau khi kết thúc StudySession"""
    session = get_object_or_404(StudySession, id=session_id, profile=request.user.profile)

    # Nếu đã có cảm xúc thì render để update
    existing = getattr(session, "emotion_entry", None)

    context = {
        "session": session,
        "existing": existing,
        "emotions": EmotionEntry.EMOTION_CHOICES,
    }
    return render(request, "emotion/emotion_form.html", context)


@login_required
def emotion_history(request):
    """Trang xem lịch sử & thống kê cảm xúc"""
    profile = request.user.profile

    weekly_history = EmotionStats.get_weekly_history(profile)
    stats = EmotionStats.get_emotion_statistics(profile)

    context = {
        "weekly_history": weekly_history,
        "stats": stats,
        "current_emotion": EmotionStats.get_current_emotion(profile),
        "active_page": "emotion",
    }

    return render(request, "emotion/emotion_view.html", context)


# ============================
# API LƯU CẢM XÚC
# ============================

@csrf_exempt
@require_POST
@login_required
def save_emotion(request):
    """API lưu hoặc cập nhật cảm xúc cho một StudySession"""
    try:
        data = json.loads(request.body)

        session_id = data.get("session_id")
        emotion = data.get("emotion")
        notes = data.get("notes", "")

        if not session_id or not emotion:
            return JsonResponse({"status": "error", "message": "Missing required fields"}, status=400)

        session = get_object_or_404(StudySession, id=session_id, profile=request.user.profile)

        # Nếu đã có cảm xúc → update
        entry, created = EmotionEntry.objects.update_or_create(
            study_session=session,
            defaults={
                "profile": request.user.profile,
                "emotion": emotion,
                "notes": notes,
            }
        )

        return JsonResponse({
            "status": "success",
            "created": created,
            "message": "Emotion saved successfully"
        })

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=400)


# ============================
# API TRẢ DỮ LIỆU THỐNG KÊ
# ============================
@login_required
def get_emotion_stats(request):
    """API trả về dữ liệu thống kê cảm xúc cho frontend"""
    profile = request.user.profile

    weekly = EmotionStats.get_weekly_history(profile)
    stats = EmotionStats.get_emotion_statistics(profile)
    current = EmotionStats.get_current_emotion(profile)

    return JsonResponse({
        "status": "success",
        "current_mood": current,
        "mood_history": weekly,
        "mood_stats": stats,
    })
