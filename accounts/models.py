from django.db import models
from django.conf import settings

# # Lấy model User mặc định từ Django (có thể là 'auth.User' hoặc custom user model)
User = settings.AUTH_USER_MODEL

class Profile(models.Model):
    '''Mở rộng thông tin người dùng'''
    # Mỗi user chỉ có 1 profile. Nếu user bị xóa, profile cũng bị xóa. Quan hệ 1-1.
    user = models.OneToOneField(User, on_delete=models.CASCADE)  
    
    # Tích xu từ thời gian học (study) hoặc hoàn thành task (todo)
    coins = models.IntegerField(default=0)  

    # Lưu múi giờ của người dùng để hiển thị thời gian đúng
    timezone = models.CharField(max_length=50, default='UTC + 7 hours')
    
    # Bật/tắt thông báo email nhắc nhở (deadline của task sắp đến)
    email_reminder = models.BooleanField(default=True)

    # Timestamps: auto_now_add lưu thời điểm tạo; auto_now cập nhật khi save()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Cấu hình metadata cho model
    class Meta:
        # ordering mặc định khi query Profile.objects.all() sẽ theo newest trước
        # Mục đích để dễ dàng lấy profile mới tạo gần đây nhất
        ordering = ['-created_at']
        # Tên hiển thị trong admin
        verbose_name = 'Profile'
        # Tên số nhiều trong admin
        verbose_name_plural = 'Profiles'

    def __str__(self):
        '''Hiển thị thông tin profile ngắn gọn, gồm username và số xu'''
        return f"{self.user.username} ({self.coins})"
    
    def add_coins(self, amount: int):
        '''Thêm xu cho người dùng'''
        self.coins += amount
        # Cập nhật trường coins và updated_at
        self.save(update_fields=['coins', 'updated_at'])
        return self.coins

    def spend_coins(self, amount: int):
        '''Trừ xu khi mua vật phẩm'''
        # Nếu đủ xu thì trừ và trả về True, không đủ thì trả về False
        if self.coins >= amount:
            self.coins -= amount
            self.save(update_fields=['coins', 'updated_at'])
            return True
        return False
    
class CoinTransaction(models.Model):
    '''Lịch sử giao dịch xu của người dùng'''
    # Các loại giao dịch: kiếm xu (earn) hoặc tiêu xu (spend)
    TRANSACTION_TYPES = (
        ('earn', 'Earn'),
        ('spend', 'Spend'),
    )

    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='transactions')
    amount = models.IntegerField() # Số xu thay đổi (có thể là dương hoặc âm)
    transaction_type = models.CharField(max_length=5, choices=TRANSACTION_TYPES)
    created_at = models.DateTimeField(auto_now_add=True) # Thời gian giao dịch
    description = models.CharField(max_length=255, blank=True) # Mô tả, Ví dụ: "Hoàn thành task X"

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.profile.user.username}: {self.transaction_type} {self.amount} at {self.created_at}"