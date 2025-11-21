from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

# Helper functions và managers
class StudySessionManager(models.Manager):
    def get_weekly_summary(self, user, weeks_ago=0):
        """Lấy tổng kết tuần"""
        end_date = timezone.now().date() - timedelta(weeks=weeks_ago * 7)
        start_date = end_date - timedelta(days=6)
        
        sessions = self.filter(
            user=user,
            start_time__date__range=[start_date, end_date]
        )
        
        summary = {
            'total_duration': timedelta(),
            'sessions_count': sessions.count(),
            'daily_data': {}
        }
        
        # Tính tổng thời gian và thời gian mỗi ngày
        for session in sessions:
            summary['total_duration'] += session.duration
            day = session.start_time.strftime('%Y-%m-%d')
            if day not in summary['daily_data']:
                summary['daily_data'][day] = timedelta()
            summary['daily_data'][day] += session.duration
        
        return summary
    
    def get_subject_breakdown(self, user, days=30):
        """Phân bổ thời gian theo môn học"""
        start_date = timezone.now().date() - timedelta(days=days)
        
        from django.db.models import Sum
        breakdown = self.filter(
            user=user,
            start_time__date__gte=start_date
        ).values('subject__name', 'subject__color').annotate(
            total_duration=Sum('duration')
        ).order_by('-total_duration')
        
        return breakdown


class Subject(models.Model):
    """Môn học của người dùng"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subjects')
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=7, default='#6C63FF')  # Màu hex
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'name']  # Mỗi user có môn học duy nhất
    
    def __str__(self):
        return f"{self.name} ({self.user.username})"

class StudySession(models.Model):
    """Phiên học tập của người dùng"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='study_sessions')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='sessions')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    duration = models.DurationField()  # Thời lượng học
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    objects = StudySessionManager()

    class Meta:
        ordering = ['-start_time']
    
    def __str__(self):
        return f"{self.user.username} - {self.subject.name} - {self.duration}"
    
    @property
    def date(self):
        """Ngày của session (không bao gồm giờ)"""
        return self.start_time.date()
    
    @property
    def duration_minutes(self):
        """Thời lượng tính bằng phút"""
        return int(self.duration.total_seconds() / 60)
    
    @property
    def duration_display(self):
        """Hiển thị thời lượng dạng đẹp"""
        total_seconds = int(self.duration.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        
        if hours > 0:
            return f"{hours}h {minutes}m"
        return f"{minutes}m"

class StudyStreak(models.Model):
    """Chuỗi ngày học tập liên tiếp"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='study_streaks')
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_study_date = models.DateField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - Streak: {self.current_streak}"
    
    def update_streak(self, study_date):
        """Cập nhật streak khi có session mới"""
        if self.last_study_date:
            days_diff = (study_date - self.last_study_date).days
            
            if days_diff == 1:
                # Ngày tiếp theo - tăng streak
                self.current_streak += 1
            elif days_diff > 1:
                # Bị gián đoạn - reset streak
                self.current_streak = 1
            # days_diff == 0: cùng ngày, không làm gì
        else:
            # Lần đầu học
            self.current_streak = 1
        
        self.last_study_date = study_date
        self.longest_streak = max(self.longest_streak, self.current_streak)
        self.save()

# Signals để tự động xử lý khi có session mới
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=StudySession)
def handle_new_study_session(sender, instance, created, **kwargs):
    if created:
        # Cập nhật streak
        streak, _ = StudyStreak.objects.get_or_create(user=instance.user)
        streak.update_streak(instance.start_time.date())
        