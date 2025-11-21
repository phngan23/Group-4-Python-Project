from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.db.models import Sum
from django.utils import timezone
from study.models import StudySession
from todo.models import ToDoItem
from emotion.models import EmotionEntry
from datetime import timedelta


def index(request):
    """Dashboard trang Home với dữ liệu thật từ database khi đăng nhập, nếu chưa hiển thị ở chế độ mặc định."""

    if not request.user.is_authenticated:
        # Trả về dữ liệu mặc định
        context = {
            "today_study_time": "0h 0m",
            "study_streak": 0,
            "tasks_completed": 0,
            "total_tasks": 0,
            "tasks_percent": 0,
            "last_emotion": "🙂",
            "tasks": [],
            "active_page": "home",
        }
        return render(request, "frontend/index.html", context)
    
    # Nếu đã đăng nhập → xử lý dữ liệu thật
    profile = request.user.profile
    today = timezone.now().date()

    # 1. Tính thời gian học hôm nay
    total_seconds = StudySession.objects.filter(
        profile=profile,
        start_time__date=today
    ).aggregate(total=Sum("duration_seconds"))["total"] or 0

    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    today_study_time = f"{hours}h {minutes}m"

    # 2. Tính streak
    streak = 0
    check_day = today

    while True:
        studied = StudySession.objects.filter(
            profile=profile,
            start_time__date=check_day
        ).exists()

        if studied:
            streak += 1
            check_day -= timedelta(days=1)
        else:
            break

    # 3. Tính task completion
    tasks_total = ToDoItem.objects.filter(profile=profile).count()
    tasks_done = ToDoItem.objects.filter(profile=profile, is_completed=True).count()

    if tasks_total == 0:
        tasks_percent = 0
    else:
        tasks_percent = round((tasks_done / tasks_total) * 100)

    # 4. Cảm xúc gần nhất
    last_emotion = EmotionEntry.objects.filter(
        profile=profile
    ).order_by("-created_at").first()

    last_emotion_icon = last_emotion.get_emotion_display_icon() if last_emotion else "🙂"

    # 5. Danh sách tasks hôm nay
    tasks = ToDoItem.objects.filter(profile=profile).order_by("created_at")

    # 6. Truyền context sang template
    context = {
        "today_study_time": today_study_time,
        "study_streak": streak,
        "tasks_completed": tasks_done,
        "total_tasks": tasks_total,
        "tasks_percent": tasks_percent,
        "last_emotion": last_emotion_icon,
        "tasks": tasks,
        'active_page': 'home',
    }

    return render(request, "frontend/index.html", context)
