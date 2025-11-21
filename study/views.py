import json
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponseBadRequest
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from django.views.decorators.http import require_POST
from django.db.models import Sum

from .models import StudySession, Subject
from accounts.models import Profile
from collections import defaultdict
from emotion.models import EmotionEntry
from gamification.models import Inventory


@login_required
def pomodoro_view(request):
    """
    View trả về template Pomodoro UI.
    - Yêu cầu user đã login (login_required).
    - Template sẽ chứa JS gọi API start/stop.
    """
    # Lấy profile của người dùng hiện tại để hiển thị danh sách môn
    profile = get_object_or_404(Profile, user=request.user)

    # Lấy danh sách môn của user để chọn (nếu chưa có, frontend có thể xử lý)
    subjects = Subject.objects.filter(profile=profile)

    # Lấy tổng thời gian học hôm nay
    today = timezone.now().date()
    total_seconds = StudySession.objects.filter(
        profile=profile,
        start_time__date=today
    ).aggregate(duration=Sum('duration_seconds'))['duration'] or 0

    study_minutes = total_seconds // 60

    inv = Inventory.objects.filter(profile=profile, is_active=True).select_related("character").first()

    context = {
        'subjects': subjects,
        'profile': profile,
        'active_page': 'timer',
        'study_minutes': study_minutes,
        "active_character": inv.character if inv else None,
    }
    return render(request, 'study/timer.html', context)

# ============================
# API: Chọn môn học
# ============================
@require_POST
@login_required
def api_add_subject(request):
    data = json.loads(request.body.decode("utf-8"))
    name = data.get("name", "").strip()

    if not name:
        return JsonResponse({"status": "error", "message": "Invalid name"})

    profile = get_object_or_404(Profile, user=request.user)
    subject = Subject.objects.create(profile=profile, name=name)

    return JsonResponse({"status": "ok", "id": subject.id, "name": subject.name })

# ============================
# API: Bắt đầu 1 StudySession
# ============================
@require_POST
@login_required
def api_start_session(request):
    """
    API POST: /study/api/start/
    Payload (JSON) expected: {"subject_id": 1}
    - Tạo StudySession mới: profile, subject, start_time, is_active=True
    - Trả về JSON chứa session_id và trạng thái
    """
    try:
        # parse JSON body (frontend gửi JSON)
        data = json.loads(request.body.decode('utf-8'))
    except json.JSONDecodeError:
        return HttpResponseBadRequest("Invalid JSON")

    subject_id = data.get('subject_id')
    if not subject_id:
        return JsonResponse({'status': 'error', 'message': 'subject_id is required'}, status=400)

    # Lấy Profile & Subject tương ứng
    profile = get_object_or_404(Profile, user=request.user)
    subject = get_object_or_404(Subject, id=subject_id, profile=profile)

    # Nếu đã có session đang active của user, trả báo để tránh session chồng lên
    existing = StudySession.objects.filter(profile=profile, is_active=True).first()
    if existing:
        return JsonResponse({'status': 'error', 'message': 'already_active_session', 'session_id': existing.id}, status=400)

    # Tạo session mới và save
    session = StudySession.objects.create(
        profile=profile,
        subject=subject,
        start_time=timezone.now(),
        is_active=True
    )

    # Trả về JSON success, kèm session id
    return JsonResponse({'status': 'started', 'session_id': session.id, 'start_time': session.start_time.isoformat()})


# ============================
# API: Dừng StudySession (Stop)
# ============================
@require_POST
@login_required
def api_stop_session(request):
    """
    API POST: /study/api/stop/
    - Tìm session đang active của user
    - Ghi end_time, tính duration_seconds, points_awarded, cập nhật profile.coins
    - Trả về JSON chứa duration và points
    """
    profile = get_object_or_404(Profile, user=request.user)

    # Tìm session đang active (nếu có nhiều, lấy cái gần nhất)
    session = StudySession.objects.filter(profile=profile, is_active=True).order_by('-start_time').first()

    if not session:
        # Không có session đang chạy
        return JsonResponse({'status': 'error', 'message': 'no_active_session'}, status=400)

    # Nếu model StudySession đã có method stop() thì gọi; nếu không làm thủ công
    try:
        # Nếu bạn đã implement method stop() trong model, dùng nó (nó sẽ tính duration và cộng coins)
        stop_method = getattr(session, 'stop', None)
        if callable(stop_method):
            session.stop()  # method model tự handle save() và cập nhật profile nếu thiết kế như vậy
            # Sau stop(), assume session.duration_seconds and session.points_awarded were set
            return JsonResponse({
                'status': 'stopped',
                'session_id': session.id,
                'duration_seconds': session.duration_seconds,
                'points_awarded': session.points_awarded
            })
    except Exception:
        # Nếu method stop có lỗi, fallback xuống xử lý thủ công
        pass

    # Xử lý dừng session thủ công (an toàn)
    session.end_time = timezone.now()
    session.duration_seconds = int((session.end_time - session.start_time).total_seconds())
    # Tính điểm dựa trên phương thức calculate_points() (nếu có)
    points = 0
    if hasattr(session, 'calculate_points') and callable(getattr(session, 'calculate_points')):
        try:
            points = session.calculate_points()
        except Exception:
            points = int(session.duration_seconds / 360)  # fallback: 0.1 coin per second (ví dụ)
    session.points_awarded = points

    # Cập nhật xu vào Profile (nếu thiết kế model để update profile ở model thì chú ý không double-add)
    profile.coins = getattr(profile, 'coins', 0) + points
    profile.save()

    # Lưu session
    session.is_active = False
    session.save()

    return JsonResponse({
        'status': 'stopped',
        'session_id': session.id,
        'duration_seconds': session.duration_seconds,
        'points_awarded': session.points_awarded
    })

# ============================
# Xem lịch sử học
# ============================
def _format_duration(seconds):
    """Chuyển seconds -> '25m 00s' hoặc '1h 05m 22s'."""
    if seconds is None:
        return "—"
    try:
        seconds = int(seconds)
    except (TypeError, ValueError):
        return "—"
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    if h > 0:
        return f"{h}h {m:02d}m {s:02d}s"
    return f"{m}m {s:02d}s"

@login_required
def study_history(request):
    profile = request.user.profile

    sessions = (
        StudySession.objects.filter(profile=profile)
        .select_related("subject")
        .order_by("-start_time")
    )

    # nhóm theo ngày nhưng tạo cấu trúc dễ render: list of dicts
    history = defaultdict(list)

    for s in sessions:
        day = s.start_time.date()
        # đảm bảo có end_time/duration_seconds xử lý an toàn
        
        duration_seconds = getattr(s, "duration_seconds", None)
        # If duration_seconds not set but end_time exists, compute

        emotion_entry = getattr(s, "emotion", None)
        if emotion_entry:
            mood_display = emotion_entry.get_emotion_display_icon()
        else:
            mood_display = "—"
        
        if (not duration_seconds or duration_seconds == 0) and s.end_time:
            try:
                duration_seconds = int((s.end_time - s.start_time).total_seconds())
            except Exception:
                duration_seconds = None

        history[day].append({
            "id": s.id,
            "subject_name": s.subject.name if s.subject else "—",
            "start_time": s.start_time,
            "end_time": s.end_time,
            "duration_seconds": duration_seconds,
            "duration_text": _format_duration(duration_seconds),
            "points": s.points_awarded,
            "emotion": mood_display,
        })
    
    # Convert to list sorted by date desc (so template iterates in order)
    history_list = []
    for day in sorted(history.keys(), reverse=True):
        history_list.append({
            "date": day,
            "sessions": history[day]
        })

    context = {
        "history": history_list,
        "active_page": "timer",
    }

    return render(request, "study/history.html", context)
