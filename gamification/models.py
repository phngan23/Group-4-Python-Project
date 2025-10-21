from django.db import models
from django.utils import timezone
import random

from accounts.models import Profile # Import model Profile để liên kết người dùng

# Model 1: Character
class Character(models.Model):
    name = models.CharField(max_length=100)

    price = models.IntegerField(default=100)

    image_idle = models.ImageField(upload_to='characters/idle/', blank=True, null= True)

    image_talk = models.ImageField(upload_to='characters/talk/', blank=True, null=True)

    RARITY_CHOICES = [('common', 'Thường'),
                      ('rare', 'Hiếm'),
                      ('epic', 'Cực hiếm'),]
    
    rarity = models.CharField(max_length=20, choices=RARITY_CHOICES, default='common')

    description = models.TextField(blank=True)

    motivation_quotes = models.JSONField(default=list)

    def __str__(self):
        '''Hiển thị tên nhân vật trong admin'''
        return f"{self.name} ({self.get_rarity_display()})"

    def get_random_quote(self):
        '''Trả về một câu nói ngẫu nhiên trong danh sách động viên.
        Dùng khi hiển thị nhân vật trên giao diện học tập.'''
        if self.motivation_quotes:
            return random.choice(self.motivation_quotes)
        return "Hãy cố lên, bạn làm được mà! 💪"

    class Meta:
        verbose_name = "Character (Nhân vật)"
        verbose_name_plural = "Characters (Danh sách nhân vật)"
        ordering = ['price']

# Model 2: Inventory (Danh sách nhân vật người dùng đang sở hữu)
class Inventory(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='inventory')
    character = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='owned_by_users')
    purchase_date = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=False)

    def __str__(self):
        '''Hiển thị thông tin nhân vật trong inventory'''
        return f"{self.profile.user.username} sở hữu {self.character.name}"

    def activate(self):
        '''Kích hoạt nhân vật này làm đồng hành chính.
        - Đặt is_active=True cho nhân vật này.
        - Đặt is_active=False cho tất cả nhân vật khác của người dùng.
        '''
        Inventory.objects.filter(profile=self.profile).update(is_active=False)

        self.is_active = True
        self.save()
    
    class Meta:
        verbose_name = "Inventory (Kho nhân vật)"
        verbose_name_plural = "Inventories (Kho nhân vật của người dùng)"
        unique_together = ('profile', 'character')

# Model 3: Achievement (Thành tích học tập)
class Achievement(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='achievements')

    title = models.CharField(max_length=200)

    description = models.TextField(blank=True)

    reward_coins = models.PositiveIntegerField(default=0)

    earned_at = models.DateTimeField(default=timezone.now)

    is_claimed = models.BooleanField(default=False)

    def __str__(self):
        '''Hiển thị tên thành tích và người đạt'''
        return f"{self.profile.user.username} - {self.title}"

    def claim(self):
        '''Nhận phần thưởng (claim).
        - Nếu chưa claim → cộng xu vào tài khoản người dùng.
        - Đánh dấu thành tích là đã nhận.'''
        if not self.is_claimed:
            self.profile.coins += self.reward_coins
            self.profile.save()
            self.is_claimed = True
            self.save()

    class Meta:
        verbose_name = "Achievement (Thành tích)"
        verbose_name_plural = "Achievements (Các thành tích)"
        ordering = ['-earned_at']