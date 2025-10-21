from django.contrib import admin
from .models import ToDoItem, ReminderLog

@admin.register(ToDoItem)
class ToDoItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'profile', 'deadline', 'is_completed', 'reminder_sent', 'reward_coins')
    list_filter = ('is_completed', 'reminder_sent', 'deadline')
    search_fields = ('title', 'profile__user__username')

@admin.register(ReminderLog)
class ReminderLogAdmin(admin.ModelAdmin):
    list_display = ('todo_item', 'sent_at', 'status')
    list_filter = ('status',)
