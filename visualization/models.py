from django.db import models
from django.utils import timezone
from accounts.models import Profile # Import model Profile để liên kết người dùng

class VisualizationConfig(models.Model):
    profile = models.OneToOneField(Profile, on_delete=models.CASCADE, related_name='visualization_config')

    CHART_TYPE_CHOICES = [('bar', 'Bar Chart (Biểu đồ cột)'),
                          ('line', 'Line Chart (Biểu đồ đường)'),
                          ('pie', 'Pie Chart (Biểu đồ tròn)'),
                          ]
    chart_type = models.CharField(max_length=20,choices=CHART_TYPE_CHOICES,default='bar')

    settings = models.JSONField(default=dict)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        '''Hiển thị tên người dùng + loại biểu đồ'''
        return f"{self.profile.user.username} - {self.get_chart_type_display()}"

    class Meta:
        verbose_name = "Visualization Config (Cấu hình biểu đồ)"
        verbose_name_plural = "Visualization Configs (Cấu hình biểu đồ)"
        ordering = ['-updated_at']