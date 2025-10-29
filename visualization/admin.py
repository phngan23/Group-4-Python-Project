from django.contrib import admin

# Register your models here.
from .models import VisualizationConfig

@admin.register(VisualizationConfig)
class VisualizationConfigAdmin(admin.ModelAdmin):
    list_display = ('profile', 'chart_type', 'updated_at')
    list_filter = ('chart_type',)
    search_fields = ('profile__user__username',)