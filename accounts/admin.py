from django.contrib import admin # Để cấu hình cách hiển thị dữ liệu trong admin
from .models import Profile

@admin.register(Profile) #Đây là decorator để đăng ký model Profile với Django Admin.
class ProfileAdmin(admin.ModelAdmin): #Định nghĩa cách hiển thị model trong admin
    list_display = ('user', 'coins', 'timezone', 'email_reminder', 'created_at') 
    #hững cột sẽ hiển thị trong danh sách các bản ghi Profile trong trang admin
    # user: liên kết đến model User (thường là django.contrib.auth.models.User).
    #coins: số lượng coin hoặc điểm người dùng.
    #timezone: múi giờ của user.
    #email_reminder: bật/tắt nhắc nhở email.
    #created_at: thời điểm tạo profile.
    search_fields = ('user__username',) #Cho phép tìm kiếm theo trường hoặc trường liên kết
