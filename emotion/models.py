from django.db import models
from django.utils import timezone

from accounts.models import Profile
#from study.models import StudySession


class EmotionEntry(models.Model):
    profile = models.ForeignKey(
        Profile, 
        on_delete=models.CASCADE, 
        related_name='emotion_entries'
    )

    study_session = models.OneToOneField(
        "study.StudySession",
        on_delete=models.CASCADE,
        related_name='emotion'
    )

    EMOTION_CHOICES = [
        ('happy', '😊 Happy'),
        ('sad', '😢 Sad'),
        ('tired', '😴 Tired'),
        ('calm', '😌 Calm'),
        ('stressed', '😤 Stressed'),
        ('excited', '🤩 Excited'),
    ]

    emotion = models.CharField(max_length=10, choices=EMOTION_CHOICES)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        subject_name = self.study_session.subject.name if self.study_session else "Unknown Subject"
        return f"{subject_name} - {self.get_emotion_display_icon()}"

    def get_emotion_display_icon(self):
        icon_map = {
            'happy': '😊 Happy',
            'sad': '😢 Sad',
            'tired': '😴 Tired',
            'calm': '😌 Calm',
            'stressed': '😤 Stressed',
            'excited': '🤩 Excited',
        }
        return icon_map.get(self.emotion, '❓ Unknown')

    class Meta:
        verbose_name = "Emotion Entry (Cảm xúc)"
        verbose_name_plural = "Emotion Entries (Các cảm xúc)"
        ordering = ['-created_at']

from django.utils import timezone
from datetime import timedelta
from django.db.models import Count

class EmotionStats:
    """Helper class để tính toán thống kê cảm xúc"""

    @staticmethod
    def get_weekly_history(profile):
        """Lấy lịch sử cảm xúc 7 ngày (tương tự code cũ nhưng theo EmotionEntry)."""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=6)

        entries = EmotionEntry.objects.filter(
            profile=profile,
            created_at__date__range=[start_date, end_date]
        ).order_by('created_at')

        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        history = []

        for i in range(7):
            day_date = start_date + timedelta(days=i)
            day_entries = entries.filter(created_at__date=day_date)

            if day_entries.exists():
                latest = day_entries.last()
                history.append({
                    "day": days[day_date.weekday()],
                    "emotion": latest.emotion,
                    "icon": latest.get_emotion_display_icon(),
                    "level": 30 + (i * 5),  # mức hiển thị tùy ý
                })
            else:
                history.append({
                    "day": days[day_date.weekday()],
                    "emotion": None,
                    "icon": "—",
                    "level": 0,
                })

        return history

    @staticmethod
    def get_emotion_statistics(profile):
        """Tính thống kê cảm xúc chung."""
        total = EmotionEntry.objects.filter(profile=profile).count()

        emotion_counts = EmotionEntry.objects.filter(profile=profile)\
            .values('emotion')\
            .annotate(count=Count('id'))\
            .order_by('-count')

        most_frequent = emotion_counts.first() if emotion_counts else None

        # Streak ngày liền kề có ghi nhận cảm xúc
        streak = 0
        current_date = timezone.now().date()

        while EmotionEntry.objects.filter(profile=profile, created_at__date=current_date).exists():
            streak += 1
            current_date -= timedelta(days=1)

        return {
            "total_entries": total,
            "most_frequent_emotion": most_frequent["emotion"] if most_frequent else None,
            "most_frequent_count": most_frequent["count"] if most_frequent else 0,
            "current_streak": streak,
        }

    @staticmethod
    def get_current_emotion(profile):
        """Lấy cảm xúc gần nhất."""
        latest = EmotionEntry.objects.filter(profile=profile).order_by('-created_at').first()
        return latest.emotion if latest else None
