from django.db import models
from django.utils import timezone
from datetime import timedelta
from accounts.models import Profile
from django.core.mail import send_mail
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import LabelEncoder
import joblib
import os
import json
from django.conf import settings

class ToDoItem(models.Model):
    PRIORITY_CHOICES = [
        ('low', '🔵 Low'),
        ('medium', '🟡 Medium'), 
        ('high', '🔴 High'),
    ]
    
    CATEGORY_CHOICES = [
        ('study', '📚 Study'),
        ('homework', '📝 Homework'),
        ('project', '💼 Project'),
        ('review', '📖 Review'),
        ('other', '📌 Other'),
    ]
    
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='todo_items')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='study')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    deadline = models.DateTimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    reminder_sent = models.BooleanField(default=False)
    reward_coins = models.IntegerField(default=0)
    predicted_duration = models.IntegerField(null=True, blank=True)  # Thời gian dự đoán (phút)
    actual_duration = models.IntegerField(null=True, blank=True)     # Thời gian thực tế (phút)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.get_priority_display()})"
    
    def save(self, *args, **kwargs):
        # Tự động tính reward coins dựa trên độ khó
        if not self.reward_coins:
            reward_map = {'low': 10, 'medium': 25, 'high': 50}
            self.reward_coins = reward_map.get(self.priority, 25)
        
        # Dự đoán thời gian nếu chưa có
        if not self.predicted_duration and self.title:
            self.predicted_duration = self.predict_duration()
            
        super().save(*args, **kwargs)
    
    def mark_completed(self):
        if not self.is_completed:
            self.is_completed = True
            # Tính thời gian thực tế
            if self.created_at and self.updated_at:
                duration = (self.updated_at - self.created_at).total_seconds() / 60
                self.actual_duration = int(duration)
            
            self.profile.coins += self.reward_coins
            self.profile.save(update_fields=['coins'])
            self.save(update_fields=['is_completed', 'actual_duration'])
    
    def predict_duration(self):
        """Dự đoán thời gian hoàn thành bằng ML"""
        predictor = TaskPredictor()
        return predictor.predict_duration(self, self.profile)
    
    def time_left(self):
        if not self.deadline:
            return "No deadline"
        now = timezone.now()
        delta = self.deadline - now
        if delta.total_seconds() < 0:
            return "Overdue"
        hours = delta.total_seconds() // 3600
        minutes = (delta.total_seconds() % 3600) // 60
        return f"{int(hours)}h {int(minutes)}m left"
    
    def is_overdue(self):
        if not self.deadline:
            return False
        return timezone.now() > self.deadline and not self.is_completed
    
    def should_send_reminder(self):
        now = timezone.now()
        return (
            not self.is_completed
            and not self.reminder_sent
            and self.deadline
            and (self.deadline - now) <= timedelta(days=1)
            and (self.deadline > now)
        )
    
    def send_reminder_email(self):
        if not self.profile.user.email:
            return

        subject = f"🔔 Reminder: '{self.title}' deadline approaching"
        message = f"""
        Hello {self.profile.user.username},

        Your task "{self.title}" is due on {self.deadline.strftime('%H:%M %d/%m/%Y')}.
        
        Estimated duration: {self.get_duration_display()}
        Reward: {self.reward_coins} coins

        Complete it soon to earn your reward!

        Best regards,
        Study Habit Tracker Team
        """

        try:
            send_mail(
                subject,
                message,
                'no-reply@studyhabit.com',
                [self.profile.user.email],
                fail_silently=False,
            )
            self.reminder_sent = True
            self.save()
            ReminderLog.objects.create(
                todo_item=self,
                sent_at=timezone.now(),
                status="success"
            )
        except Exception as e:
            ReminderLog.objects.create(
                todo_item=self,
                sent_at=timezone.now(),
                status=f"failed: {str(e)}"
            )
    
    def get_duration_display(self):
        if self.predicted_duration:
            hours = self.predicted_duration // 60
            minutes = self.predicted_duration % 60
            if hours > 0:
                return f"{hours}h {minutes}m"
            return f"{minutes}m"
        return "Not predicted"

class ReminderLog(models.Model):
    todo_item = models.ForeignKey(ToDoItem, on_delete=models.CASCADE, related_name='reminder_logs')
    sent_at = models.DateTimeField()
    status = models.CharField(max_length=100)

    def __str__(self):
        return f"Reminder for '{self.todo_item.title}' - {self.status}"

# MACHINE LEARNING MODEL
class TaskPredictor:
    def __init__(self):
        self.model = None
        self.label_encoders = {}
        self.model_path = os.path.join(settings.BASE_DIR, 'todo', 'ml_model', 'task_predictor.pkl')
        self.encoder_path = os.path.join(settings.BASE_DIR, 'todo', 'ml_model', 'label_encoders.pkl')
        self.load_model()
    
    def load_model(self):
        """Load model đã train"""
        try:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
                self.label_encoders = joblib.load(self.encoder_path)
        except:
            self.model = None
    
    def extract_features(self, task, user_profile):
        """Trích xuất features cho ML"""
        # 1. Category
        category = task.category
        
        # 2. Priority (chuyển thành số)
        priority_map = {'low': 1, 'medium': 2, 'high': 3}
        priority_score = priority_map.get(task.priority, 2)
        
        # 3. Độ dài description
        desc_length = len(task.description or '')
        
        # 4. Có deadline không
        has_deadline = 1 if task.deadline else 0
        
        # 5. Thời gian trong ngày
        hour = task.created_at.hour
        if 6 <= hour < 12:
            time_of_day = 'morning'
        elif 12 <= hour < 18:
            time_of_day = 'afternoon'
        else:
            time_of_day = 'evening'
        
        # 6. Thói quen học tập (lấy từ study sessions)
        try:
            from study.models import StudySession
            avg_duration = StudySession.objects.filter(
                profile=user_profile
            ).aggregate(avg_duration=models.Avg('duration'))['avg_duration'] or 60
        except:
            avg_duration = 60
        
        # 7. Cảm xúc gần đây
        try:
            recent_mood = user_profile.emotion_entries.order_by('-created_at').first()
            mood_score = recent_mood.mood_score if recent_mood else 5
        except:
            mood_score = 5

        return {
            'category': category,
            'priority_score': priority_score,
            'desc_length': desc_length,
            'has_deadline': has_deadline,
            'time_of_day': time_of_day,
            'avg_study_duration': avg_duration,
            'mood_score': mood_score
        }
    
    def train_model(self, completed_tasks):
        """Huấn luyện model với tasks đã hoàn thành"""
        if len(completed_tasks) < 5:
            return False
            
        features_list = []
        targets = []
        
        for task in completed_tasks:
            if task.actual_duration and 5 <= task.actual_duration <= 480:
                features = self.extract_features(task, task.profile)
                features_list.append(features)
                targets.append(task.actual_duration)
        
        if len(features_list) < 3:
            return False
            
        # Encode features
        X = []
        for features in features_list:
            encoded = []
            for key, value in features.items():
                if key in ['category', 'time_of_day']:
                    if key not in self.label_encoders:
                        self.label_encoders[key] = LabelEncoder()
                    try:
                        encoded_val = self.label_encoders[key].fit_transform([value])[0]
                        encoded.append(encoded_val)
                    except:
                        encoded.append(0)
                else:
                    encoded.append(float(value))
            X.append(encoded)
        
        # Train model
        self.model = LinearRegression()
        self.model.fit(X, targets)
        
        # Save model
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump(self.model, self.model_path)
        joblib.dump(self.label_encoders, self.encoder_path)
        
        return True
    
    def predict_duration(self, task, user_profile):
        """Dự đoán thời gian hoàn thành"""
        # Nếu chưa có model, trả về giá trị mặc định
        if self.model is None:
            return self._get_default_prediction(task)
        
        features = self.extract_features(task, user_profile)
        
        # Encode features để predict
        encoded_features = []
        for key, value in features.items():
            if key in ['category', 'time_of_day']:
                if key in self.label_encoders:
                    try:
                        encoded_val = self.label_encoders[key].transform([value])[0]
                        encoded_features.append(encoded_val)
                    except:
                        encoded_features.append(0)
                else:
                    encoded_features.append(0)
            else:
                encoded_features.append(float(value))
        
        try:
            prediction = self.model.predict([encoded_features])[0]
            return int(max(15, min(480, prediction)))  # Giới hạn 15-480 phút
        except:
            return self._get_default_prediction(task)
    
    def _get_default_prediction(self, task):
        """Dự đoán mặc định khi không có model"""
        base_times = {'low': 30, 'medium': 60, 'high': 90}
        return base_times.get(task.priority, 60)