from django.shortcuts import render

# Create your views here.
from django.contrib.auth.decorators import login_required
from django.db.models import Sum, Count
from django.db.models.functions import TruncDay
from django.utils import timezone
import datetime
import json
from users.models import Profile 
from study.models import StudySession
from emotion.models import EmotionEntry
from todo.models import ToDoItem
def get_study_time_by_day(profile, days_ago=30):
    start_date = timezone.now().date() - datetime.timedelta(days=days_ago)
    daily_study_data = StudySession.objects.filter(
        profile=profile, created_at__date__gte=start_date
    ).annotate(day=TruncDay('created_at')).values('day').annotate(
        total_duration=Sum('duration')
    ).order_by('day')
    labels = [entry['day'].strftime('%Y-%m-%d') for entry in daily_study_data]
    data = [entry['total_duration'] for entry in daily_study_data]
    return {'labels': labels, 'data': data}
def get_subject_performance(profile):
    subject_data = StudySession.objects.filter(profile=profile).values(
        'subject__name'
    ).annotate(total_duration=Sum('duration')).order_by('-total_duration')
    labels = [entry['subject__name'] for entry in subject_data]
    data = [entry['total_duration'] for entry in subject_data]
    return {'labels': labels, 'data': data}
def get_emotion_summary(profile):
    emotion_data = EmotionEntry.objects.filter(profile=profile).values(
        'emotion_type'
    ).annotate(count=Count('id')).order_by('emotion_type')
    labels = [entry['emotion_type'] for entry in emotion_data]
    data = [entry['count'] for entry in emotion_data]
    return {'labels': labels, 'data': data}
@login_required 
def dashboard_view(request):
    try:
        # Lấy profile của người dùng đang đăng nhập
        profile = request.user.profile
    except Profile.DoesNotExist:
        # Xử lý lỗi nếu không tìm thấy profile
        return render(request, 'error.html', {'message': 'Không tìm thấy hồ sơ người dùng.'})
    study_time_data = get_study_time_by_day(profile)
    subject_data = get_subject_performance(profile)
    emotion_data = get_emotion_summary(profile)
    context = {
        'study_data_json': json.dumps(study_time_data),
        'subject_data_json': json.dumps(subject_data),
        'emotion_data_json': json.dumps(emotion_data),
    }
    return render(request, 'visualization/dashboard.html', context)