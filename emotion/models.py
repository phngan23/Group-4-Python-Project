from django.db import models
from django.utils import timezone
from accounts.models import Profile # Liên kết với người dùng
from study.models import StudySession # Liên kết với buổi học

class EmotionEntry(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='emotion_entries')
    study_session = models.OneToOneField(StudySession, on_delete=models.CASCADE, related_name='emotion_entry')

    EMOTION_CHOICES = [('happy', '😊 Happy'),
                       ('normal', '😐 Normal'),
                       ('sad', '😞 Sad'),
                       ('stressed', '😰 Stressed'),
                       ('excited', '🤩 Excited')]
    
    emotion = models.CharField(max_length=10, choices=EMOTION_CHOICES)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        '''Hiển thị cảm xúc'''
        subject_name = self.study_session.subject.name if self.study_session else "Unknown Subject"
        emotion_icon = self.get_emotion_display_icon()
        return f"{subject_name} - {emotion_icon}"

    def get_emotion_display_icon(self):
        '''Trả về biểu tượng cảm xúc tương ứng với giá trị emotion. Dùng để hiển thị trong giao diện hoặc admin.'''
        icon_map = {
            'happy': '😊 Happy',
            'normal': '😐 Normal',
            'sad' : '😞 Sad',
            'stressed': '😰 Stressed',
            'excited': '🤩 Excited',
        }
        return icon_map.get(self.emotion, '❓ Không rõ')

    class Meta:
        # Tên hiển thị trong admin site
        verbose_name = "Emotion Entry (Cảm xúc)"
        verbose_name_plural = "Emotion Entries (Các cảm xúc)"
        ordering = ['-created_at'] # Sắp xếp theo thời gian tạo giảm dần