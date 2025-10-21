from django.contrib import admin
from .models import EmotionEntry

@admin.register(EmotionEntry)
class EmotionEntryAdmin(admin.ModelAdmin):
    list_display = ('profile', 'study_session', 'emotion', 'created_at')
    list_filter = ('emotion', 'created_at')
    search_fields = ('profile__user__username', 'study_session__subject__name')
