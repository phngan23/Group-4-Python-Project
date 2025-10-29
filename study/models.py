from django.db import models
from accounts.models import Profile # Import model Profile để liên kết người dùng
from datetime import datetime, timedelta 
from django.utils import timezone

# Model 1: Subject
class Subject(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='subjects')
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=7)  # Mã màu HEX cho môn học
    target_hour_per_week = models.FloatField(default=5.0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
    
    def total_hours_this_week(self):
        '''Tính tổng số giờ học trong tuần hiện tại cho môn học này'''
        now = timezone.now()
        start_of_week = now - timedelta(days=now.weekday())  # Thứ Hai đầu tuần
        sessions = self.study_sessions.filter(start_time__gte=start_of_week, end_time__lte=now)
        total_seconds = sum(session.duration_seconds for session in sessions)
        return total_seconds / 3600 # Chuyển đổi giây sang giờ

# Model 2: StudySession
class StudySession(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='study_sessions')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='study_sessions')
    start_time = models.DateTimeField(default=timezone.now)
    pause_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(default=0)
    points_awards = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.subject.name} - {self.start_time.strftime('%Y-%m-%d %H:%M')}"
    
    def start(self):
        '''Bắt đầu ca học'''
        self.start_time = timezone.now()
        self.is_active = True
        self.save(update_fields=['start_time', 'is_active'])
    
    def pause(self):
        '''Tạm dừng ca học'''
        if self.is_active:
            self.pause_time = timezone.now()
            self.is_active = False
            self.save(update_fields=['pause_time', 'is_active'])
    
    def resume(self):
        '''Tiếp tục học sau khi tạm dừng'''
        if self.pause_time:
            paused_duration = timezone.now() - self.pause_time
            self.start_time += paused_duration
            self.pause_time = None
            self.is_active = True
            self.save(update_fields=['start_time', 'pause_time', 'is_active'])

    def stop(self):
        '''Kết thúc ca học'''
        self.end_time = timezone.now()
        self.is_active = False
        
        self.duration_seconds = int((self.end_time - self.start_time).total_seconds())
        self.points_awarded = self.calculate_points()
        self.profile.coins += self.points_awarded
        self.profile.save(update_fields=['coins'])
        self.save(update_fields=['end_time', 'is_active', 'duration_seconds', 'points_awarded'])
    
    def calculate_points(self):
        '''Tính điểm thưởng dựa trên thời gian học (1 giờ = 10 xu)'''
        hours = self.duration_seconds / 3600
        points = int(hours * 10)  
        return points
    
    def save(self, *args, **kwargs):
        '''Ghi đè phương thức save để đảm bảo tính toán đúng khi kết thúc ca học'''
        if self.end_time and not self.duration_seconds:
            self.duration_seconds = int((self.end_time - self.start_time).total_seconds())
            self.points_awarded = self.calculate_points()
        super().save(*args, **kwargs)

class BreakSession(models.Model):
    study_session = models.ForeignKey(StudySession, on_delete=models.CASCADE, related_name='breaks')
    start_time = models.DateTimeField(default=timezone.now)
    end_time = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(default=0)

    def save(self, *args, **kwargs):
        '''Khi lưu break, tự động tính thời lượng nghỉ'''
        if self.end_time and self.start_time:
            self.duration_seconds = int((self.end_time - self.start_time).total_seconds())
        super().save(*args, **kwargs)

    def __str__(self):
        # Hiển thị break session dưới dạng thời gian
        return f"Nghỉ {self.duration_seconds // 60} phút ({self.study_session.subject.name})"