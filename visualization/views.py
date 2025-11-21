from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from datetime import timedelta, datetime
import json
from .models import StudySession, Subject, StudyStreak

@login_required
def study_stats(request):
    """Trang thống kê chính với data thật"""
    return render(request, 'visualization/study_stats.html', {
        "active_page": "statistics",
    })

@login_required
def study_sessions(request):
    """Lịch sử sessions với data thật"""
    return render(request, 'visualization/study_sessions.html')


@login_required
def subject_breakdown(request):
    """Phân tích môn học với data thật"""
    return render(request, 'visualization/subject_breakdown.html')

# API ENDPOINTS - Trả về JSON data thật
@login_required
@require_http_methods(["GET"])
def api_study_stats(request):
    """API lấy data thống kê tổng quan"""
    try:
        user = request.user
        
        # Tính tổng thời gian học
        total_sessions = StudySession.objects.filter(user=user)
        total_duration = sum((session.duration for session in total_sessions), timedelta())
        total_minutes = int(total_duration.total_seconds() / 60)
        
        # Định dạng thời gian
        hours = total_minutes // 60
        minutes = total_minutes % 60
        total_time_display = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"
        
        # Số môn học
        subjects_count = Subject.objects.filter(user=user).count()
        
        # Streak hiện tại
        streak = StudyStreak.objects.filter(user=user).first()
        current_streak = streak.current_streak if streak else 0
        
        # Thời gian trung bình mỗi session
        avg_session = total_minutes / len(total_sessions) if total_sessions else 0
        avg_session_display = f"{int(avg_session)}m"
        
        # Data tuần này
        weekly_data = get_weekly_study_data(user)
        
        # Sessions gần đây
        recent_sessions = StudySession.objects.filter(user=user).order_by('-start_time')[:5]
        sessions_data = []
        for session in recent_sessions:
            sessions_data.append({
                'subject': session.subject.name,
                'duration': session.duration_display,
                'date': session.start_time.strftime('%b %d, %Y'),
                'time_range': f"{session.start_time.strftime('%H:%M')} - {session.end_time.strftime('%H:%M')}"
            })
        
        return JsonResponse({
            'status': 'success',
            'data': {
                'total_study_time': total_time_display,
                'current_streak': current_streak,
                'subjects_count': subjects_count,
                'avg_session': avg_session_display,
                'weekly_data': weekly_data,
                'recent_sessions': sessions_data
            }
        })
        
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})

@login_required
@require_http_methods(["GET"])
def api_study_sessions(request):
    """API lấy lịch sử sessions"""
    try:
        user = request.user
        time_filter = request.GET.get('filter', 'all')
        subject_filter = request.GET.get('subject', 'all')
        
        # Base queryset
        sessions = StudySession.objects.filter(user=user)
        
        # Áp dụng bộ lọc thời gian
        if time_filter == 'week':
            start_date = timezone.now().date() - timedelta(days=7)
            sessions = sessions.filter(start_time__date__gte=start_date)
        elif time_filter == 'month':
            start_date = timezone.now().date() - timedelta(days=30)
            sessions = sessions.filter(start_time__date__gte=start_date)
        
        # Áp dụng bộ lọc môn học
        if subject_filter != 'all':
            sessions = sessions.filter(subject__name=subject_filter)
        
        sessions_data = []
        for session in sessions.order_by('-start_time'):
            sessions_data.append({
                'id': session.id,
                'subject': session.subject.name,
                'duration': session.duration_display,
                'date': session.start_time.strftime('%Y-%m-%d'),
                'display_date': session.start_time.strftime('%b %d, %Y'),
                'start_time': session.start_time.strftime('%H:%M'),
                'end_time': session.end_time.strftime('%H:%M'),
                'notes': session.notes or ''
            })
        
        # Danh sách môn học cho filter
        subjects = Subject.objects.filter(user=user).values_list('name', flat=True)
        
        return JsonResponse({
            'status': 'success',
            'sessions': sessions_data,
            'subjects': list(subjects)
        })
        
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})

@login_required
@require_http_methods(["GET"])
def api_subject_breakdown(request):
    """API lấy phân tích theo môn học"""
    try:
        user = request.user
        
        # Lấy tất cả sessions của user
        sessions = StudySession.objects.filter(user=user)
        
        # Nhóm theo môn học
        subject_totals = {}
        for session in sessions:
            subject_name = session.subject.name
            subject_color = session.subject.color
            
            if subject_name not in subject_totals:
                subject_totals[subject_name] = {
                    'total_duration': timedelta(),
                    'session_count': 0,
                    'color': subject_color
                }
            
            subject_totals[subject_name]['total_duration'] += session.duration
            subject_totals[subject_name]['session_count'] += 1
        
        # Tính phần trăm và định dạng data
        total_duration_all = sum((data['total_duration'] for data in subject_totals.values()), timedelta())
        total_minutes_all = total_duration_all.total_seconds() / 60
        
        subjects_data = []
        for subject_name, data in subject_totals.items():
            duration_minutes = data['total_duration'].total_seconds() / 60
            percentage = (duration_minutes / total_minutes_all * 100) if total_minutes_all > 0 else 0
            
            # Định dạng thời gian
            hours = int(duration_minutes // 60)
            minutes = int(duration_minutes % 60)
            time_display = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"
            
            # Thời gian trung bình mỗi session
            avg_time = duration_minutes / data['session_count'] if data['session_count'] > 0 else 0
            avg_display = f"{int(avg_time)}m"
            
            subjects_data.append({
                'name': subject_name,
                'total_time': time_display,
                'total_minutes': duration_minutes,
                'session_count': data['session_count'],
                'percentage': round(percentage, 1),
                'avg_time': avg_display,
                'color': data['color']
            })
        
        # Sắp xếp theo thời gian giảm dần
        subjects_data.sort(key=lambda x: x['total_minutes'], reverse=True)
        
        return JsonResponse({
            'status': 'success',
            'subjects': subjects_data
        })
        
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})

# Helper functions
def get_weekly_study_data(user):
    """Lấy data học tập trong tuần"""
    today = timezone.now().date()
    start_of_week = today - timedelta(days=today.weekday())  # Thứ 2
    
    week_days = []
    for i in range(7):
        day = start_of_week + timedelta(days=i)
        week_days.append({
            'day': day.strftime('%a'),  # Mon, Tue, etc.
            'date': day.strftime('%Y-%m-%d'),
            'minutes': 0
        })
    
    # Lấy sessions trong tuần
    sessions = StudySession.objects.filter(
        user=user,
        start_time__date__range=[start_of_week, today]
    )
    
    # Tính tổng thời gian mỗi ngày
    for session in sessions:
        session_date = session.start_time.date()
        day_index = (session_date - start_of_week).days
        
        if 0 <= day_index < 7:
            minutes = session.duration.total_seconds() / 60
            week_days[day_index]['minutes'] += minutes
    
    return week_days