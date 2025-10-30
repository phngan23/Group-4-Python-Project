from django.shortcuts import render

# Create your views here.
import json
import datetime
from django.contrib.auth.decorators import login_required
from django.db.models import Sum, Count
from django.db.models.functions import TruncDay
from django.utils import timezone
from accounts.models import Profile
from study.models import StudySession, Subject
from emotion.models import EmotionEntry
from todo.models import ToDoItem

def get_study_time_by_day(profile, days_ago = 30):
    start_date = timezone.now().date() - datetime.timedelta(days = days_ago)
    daily_study_data = StudySession.objects.filter(
        profile = profile,
        start_date__date__gte = start_date,
        is_active = False
    ).annotate(
        day = TruncDay('start_date')
    ).values('day').annotate(
        total_seconds = Sum('duration_seconds')
    ).order_by('day')
    labels = [entry['day'].strftime('%d/%m') for entry in daily_study_data]
    data = [round(entry['total_seconds'] / 60, 1) for entry in daily_study_data]

    return {'labels': labels, 'data': data}
def get_subject_performance(profile):
    subject_data = StudySession.objects.filter(
        profile = profile,
        is_active = False
    ).values(
        'subject__name',
        'subject__color'
    ).annotate(
        total_seconds = Sum('duration_seconds')
    ).order_by('-total_seconds')

    labels = labels = [entry['subject__name'] for entry in subject_data]
    data = [round(entry['total_seconds'] / 3600, 2) for entry in subject_data]
    colors = [entry['subject__color'] for entry in subject_data]

    return {'labels': labels, 'data': data, 'colors': colors}
def get_emotion_summary(profile):
    emotion_display_map = dict(EmotionEntry.EMOTION_CHOICES)
    emotion_data = EmotionEntry.objects.filter(
        profile = profile
    ).values('emotion').annotate(
        count = Count('id')
    ),order_by('emotion')

    labels = [emotion_display_map.get(entry['emotion'], entry['emotion']) for entry in emotion_data]
    data = [entry['count'] for entry in emotion_data]

    return {'labels': labels, 'data': data}

def get_task_completion_rate(profile):
    total_tasks = ToDoItem.objects.filter(profile=profile).count()
    if total_tasks == 0:
        return {'labels': ['Hoàn thành', 'Chưa hoàn thành'], 'data': [0, 0], 'rate': 0}
    completed_tasks = ToDoItem.objects.filter(
        profile = profile,
        is_completed = True
    ).count()

    pending_tasks = total_tasks - completed_tasks
    rate = (completed_tasks / total_tasks) * 100

    return {
        'labels': ['Hoàn thành', 'Chưa hoàn thành'],
        'data': [completed_tasks, pending_tasks],
        'rate': round(rate, 2)
    }
@login_required
def dashboard_view(request):
    try:
        profile = request.user.profile
    except Profile.DoesNotExist:
        return render(request, 'error.html', {'message': 'Không tìm thấy hồ sơ người dùng.'})
    
    study_time_data = get_study_time_by_day(profile)
    subject_data = get_subject_performance(profile)
    emotion_data = get_emotion_summary(profile)
    task_data = get_task_completion_rate(profile)
    context = {
        'study_data_json': json.dumps(study_time_data),
        'subject_data_json': json.dumps(subject_data),
        'emotion_data_json': json.dumps(emotion_data),
        'task_data_json': json.dumps(task_data),
        'task_data': task_data
    }
    return render(request, 'visualization/dashboard.html', context)