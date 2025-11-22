from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from datetime import timedelta
from study.models import StudySession, Subject  # Import từ app study thật

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

# API ENDPOINTS - Trả về JSON data thật từ app study
@login_required
@require_http_methods(["GET"])
def api_study_stats(request):
    """API lấy data thống kê tổng quan từ app study"""
    try:
        user = request.user
        
        # Lấy sessions từ app study - SỬA: dùng profile__user
        total_sessions = StudySession.objects.filter(profile__user=user)
        total_duration_seconds = sum(session.duration_seconds for session in total_sessions)
        
        # Định dạng thời gian
        hours = total_duration_seconds // 3600
        minutes = (total_duration_seconds % 3600) // 60
        total_time_display = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"
        
        # Số môn học - SỬA: dùng profile__user
        subjects_count = Subject.objects.filter(profile__user=user).count()
        
        # Streak (tạm tính)
        today = timezone.now().date()
        streak = 0
        current_date = today
        
        # Tính streak đơn giản - kiểm tra 7 ngày gần nhất
        for i in range(7):
            if StudySession.objects.filter(
                profile__user=user, 
                start_time__date=current_date
            ).exists():
                streak += 1
            else:
                break
            current_date -= timedelta(days=1)
        
        # Thời gian trung bình mỗi session
        avg_session = total_duration_seconds / len(total_sessions) / 60 if total_sessions else 0
        avg_session_display = f"{int(avg_session)}m"
        
        # Data tuần này
        weekly_data = get_weekly_study_data(user)
        
        # Sessions gần đây
        recent_sessions = StudySession.objects.filter(profile__user=user).order_by('-start_time')[:5]
        sessions_data = []
        for session in recent_sessions:
            end_time_display = session.end_time.strftime('%H:%M') if session.end_time else 'Now'
            sessions_data.append({
                'subject': session.subject.name,
                'duration': f"{session.duration_seconds // 60}m",
                'date': session.start_time.strftime('%b %d, %Y'),
                'time_range': f"{session.start_time.strftime('%H:%M')} - {end_time_display}"
            })
        
        return JsonResponse({
            'status': 'success',
            'data': {
                'total_study_time': total_time_display,
                'current_streak': streak,
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
    """API lấy lịch sử sessions từ app study"""
    try:
        user = request.user
        time_filter = request.GET.get('filter', 'all')
        subject_filter = request.GET.get('subject', 'all')
        
        # Base queryset - SỬA: dùng app study
        sessions = StudySession.objects.filter(profile__user=user)
        
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
            end_time_display = session.end_time.strftime('%H:%M') if session.end_time else 'Now'
            
            # SỬA: XÓA 'notes' VÌ MODEL THẬT KHÔNG CÓ
            sessions_data.append({
                'id': session.id,
                'subject': session.subject.name,
                'duration': f"{session.duration_seconds // 60}m",
                'date': session.start_time.strftime('%Y-%m-%d'),
                'display_date': session.start_time.strftime('%b %d, %Y'),
                'start_time': session.start_time.strftime('%H:%M'),
                'end_time': end_time_display,
                # XÓA DÒNG NÀY: 'notes': session.notes or ''
            })
        
        # Danh sách môn học cho filter - SỬA: dùng app study
        subjects = Subject.objects.filter(profile__user=user).values_list('name', flat=True)
        
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
    """API lấy phân tích theo môn học từ app study"""
    try:
        user = request.user
        
        # Lấy tất cả sessions của user
        sessions = StudySession.objects.filter(profile__user=user)
        
        # Nhóm theo môn học
        subject_totals = {}
        for session in sessions:
            subject_name = session.subject.name
            subject_color = session.subject.color
            
            # SỬA ĐƠN GIẢN: Nếu không có màu, gán màu mặc định
            if not subject_color:
                subject_color = '#6C63FF'  # Màu mặc định
            
            if subject_name not in subject_totals:
                subject_totals[subject_name] = {
                    'total_duration_seconds': 0,
                    'session_count': 0,
                    'color': subject_color
                }
            
            subject_totals[subject_name]['total_duration_seconds'] += session.duration_seconds
            subject_totals[subject_name]['session_count'] += 1
        
        # Tính phần trăm và định dạng data
        total_duration_all = sum((data['total_duration_seconds'] for data in subject_totals.values()), 0)
        total_minutes_all = total_duration_all / 60
        
        subjects_data = []
        for subject_name, data in subject_totals.items():
            duration_minutes = data['total_duration_seconds'] / 60
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
    """Lấy data học tập trong tuần từ app study"""
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
    
    # Lấy sessions trong tuần từ app study - SỬA: dùng profile__user
    sessions = StudySession.objects.filter(
        profile__user=user,
        start_time__date__range=[start_of_week, today]
    )
    
    # Tính tổng thời gian mỗi ngày
    for session in sessions:
        session_date = session.start_time.date()
        day_index = (session_date - start_of_week).days
        
        if 0 <= day_index < 7:
            minutes = session.duration_seconds / 60
            week_days[day_index]['minutes'] += minutes
    
    return week_days