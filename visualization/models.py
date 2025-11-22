from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

class Subject(models.Model):
    """Môn học - đồng bộ với app study"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='viz_subjects')
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=7, default='#6C63FF')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.user.username})"

class StudySession(models.Model):
    """Phiên học tập - đồng bộ với app study"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='viz_sessions')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='sessions')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(default=0)  # Dùng field này thay vì duration
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-start_time']
    
    def __str__(self):
        return f"{self.user.username} - {self.subject.name} - {self.duration_display}"
    
    @property
    def duration(self):
        """Tính duration từ seconds"""
        return timedelta(seconds=self.duration_seconds)
    
    @property
    def duration_minutes(self):
        """Thời lượng tính bằng phút"""
        return int(self.duration_seconds / 60)
    
    @property
    def duration_display(self):
        """Hiển thị thời lượng dạng đẹp"""
        hours = self.duration_seconds // 3600
        minutes = (self.duration_seconds % 3600) // 60
        
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
        