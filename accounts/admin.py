from django.contrib import admin
from .models import Profile

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'coins', 'timezone', 'email_reminder', 'created_at')
    search_fields = ('user__username',)
