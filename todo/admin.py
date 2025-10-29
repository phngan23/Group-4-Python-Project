from django.contrib import admin #import module admin của Django để đăng ký/ tuỳ chỉnh model trên Django Admin site
from .models import ToDoItem, ReminderLog #2 model đã định nghĩa trong models.py

@admin.register(ToDoItem) #Đăng kí model ToDoItem vào trang admin của Django
class ToDoItemAdmin(admin.ModelAdmin): #Lớp tuỳ chỉnh cho trang quản lí
    # Xác định các cột sẽ hiển thị ở bảng ToDoItem trong admin
    # title, profile, deadline... là tiêu đề cột
    list_display = ('title', 'profile', 'deadline', 'is_completed', 'reminder_sent', 'reward_coins')
    # Bộ lọc để dễ lọc
    # 'is_completed' và 'reminder_sent' sẽ hiển thị filter dạng True/False
    # 'deadline' để lọc công việc theo thời gian (sắp đến hạn hoặc đã quá hạn...)
    list_filter = ('is_completed', 'reminder_sent', 'deadline')
    # Cho phép tìm kiếm nhanh thông tin
    search_fields = ('title', 'profile__user__username')

@admin.register(ReminderLog) #Đăng kí model ReminderLog vào trang admin
class ReminderLogAdmin(admin.ModelAdmin): #Tuỳ chỉnh
    list_display = ('todo_item', 'sent_at', 'status')
    # Vì chỉ có 1 phần tử, cần thêm dấu `,` để django không hiểu nhầm thành chuỗi
    list_filter = ('status',)
