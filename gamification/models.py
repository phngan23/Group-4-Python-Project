from django.db import models
from django.utils import timezone
import random

from accounts.models import Profile # Import model Profile để liên kết người dùng

# Model 1: Character
class Character(models.Model):
    # Tên nhân vật
    name = models.CharField(max_length=100)

    # Giá nhân vật (ví dụ: 100 xu)
    price = models.IntegerField(default=100)

    # Ảnh nhân vật khi đứng yên (idle)
    image_idle = models.ImageField(upload_to='characters/idle/', blank=True, null= True)

    # Ảnh nhân vật khi nói chuyện (talk)
    image_talk = models.ImageField(upload_to='characters/talk/', blank=True, null=True)

    # Các mức độ hiếm (rarity) của nhân vật
    RARITY_CHOICES = [('common', 'Thường'),
                      ('rare', 'Hiếm'),
                      ('epic', 'Cực hiếm'),]
    
    # Trường lưu độ hiếm, chọn từ các giá trị ở trên
    rarity = models.CharField(max_length=20, choices=RARITY_CHOICES, default='common')

    # Mô tả chi tiết nhân vật
    description = models.TextField(blank=True)

    # Danh sách các câu nói động viên (dạng JSON)
    motivation_quotes = models.JSONField(default=list)

    # Character mặc định unlock khi có account
    emoji = models.CharField(max_length=5, default="🐰")

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
        # Cấu hình hiển thị trong Django Admin
        verbose_name = "Character (Nhân vật)"
        verbose_name_plural = "Characters (Danh sách nhân vật)"
        # Sắp xếp nhân vật theo giá tăng dần
        ordering = ['price']


# Model 2: Inventory (Danh sách nhân vật người dùng đang sở hữu)
class Inventory(models.Model):
    # Liên kết tới người dùng (thông qua Profile)
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='inventory')
    # Liên kết tới nhân vật được sở hữu
    character = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='owned_by_users')
    # Ngày mua nhân vật
    purchase_date = models.DateTimeField(auto_now_add=True)
    # Trạng thái kích hoạt nhân vật (True = đang dùng)
    is_active = models.BooleanField(default=False)

    def __str__(self):
        '''Hiển thị thông tin nhân vật trong inventory'''
        return f"{self.profile.user.username} sở hữu {self.character.name}"

    def activate(self):
        '''Kích hoạt nhân vật này làm đồng hành chính.
        - Đặt is_active=True cho nhân vật này.
        - Đặt is_active=False cho tất cả nhân vật khác của người dùng.
        '''
        # Bỏ kích hoạt các nhân vật khác của cùng người dùng
        Inventory.objects.filter(profile=self.profile).update(is_active=False)
        # Kích hoạt nhân vật hiện tại
        self.is_active = True
        self.save()
    
    class Meta:
        # Cấu hình hiển thị trong Django Admin
        verbose_name = "Inventory (Kho nhân vật)"
        verbose_name_plural = "Inventories (Kho nhân vật của người dùng)"
        # Một người không thể sở hữu 1 nhân vật hai lần
        unique_together = ('profile', 'character')


# Model 3: Achievement (Thành tích học tập)
class Achievement(models.Model):
    # Liên kết tới hồ sơ người dùng
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='achievements')

    # Tiêu đề của thành tích
    title = models.CharField(max_length=200)

    # Mô tả chi tiết về thành tích
    description = models.TextField(blank=True)

    # Số xu thưởng khi đạt thành tích
    reward_coins = models.PositiveIntegerField(default=0)

    # Thời điểm đạt thành tích
    earned_at = models.DateTimeField(default=timezone.now)

    # Đánh dấu đã nhận thưởng hay chưa
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
        # Cấu hình hiển thị trong Django Admin
        verbose_name = "Achievement (Thành tích)"
        verbose_name_plural = "Achievements (Các thành tích)"
        # Sắp xếp các thành tích mới nhất lên đầu
        ordering = ['-earned_at']
