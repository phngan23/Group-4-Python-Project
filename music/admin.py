from django.contrib import admin
from .models import MusicTrack

@admin.register(MusicTrack)
class MusicTrackAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "is_active", "created_at")
    list_filter = ("category", "is_active")
    search_fields = ("title", "description")
