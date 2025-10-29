from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from django.conf import settings

# Import Profile model để tạo profile khi user được tạo
from .models import Profile

User = settings.AUTH_USER_MODEL

# Khi 1 user mới được tạo (created=True), signal này sẽ chạy và tạo Profile tương ứng.
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

# Khi user được lưu, lưu lại profile (đảm bảo profile tồn tại)
@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    # instance.profile có thể raise lỗi nếu profile chưa tồn tại,
    # nhưng create_user_profile đã tạo profile khi created=True
    try:
        instance.profile.save()
    except Exception:
        # Để an toàn, nếu profile chưa tồn tại, tạo mới
        Profile.objects.get_or_create(user=instance)
