from django.db import models
from django.utils import timezone
from accounts.models import Profile # Import model Profile để liên kết người dùng

class VisualizationConfig(models.Model): 
    # Tạo mối quan hệ một-một với model Profile
    # Mỗi Profile chỉ có thể có một VisualizationConfig 
    profile = models.OneToOneField(Profile, on_delete=models.CASCADE, related_name='visualization_config')
    # Các lựa chọn cố định cho loại biểu đồ
    CHART_TYPE_CHOICES = [('bar', 'Bar Chart (Biểu đồ cột)'),
                          ('line', 'Line Chart (Biểu đồ đường)'),
                          ('pie', 'Pie Chart (Biểu đồ tròn)'),
                          ]
    # Trường (cột) để lưu loại biểu đồ, là một chuỗi ký tự
    chart_type = models.CharField(max_length=20,choices=CHART_TYPE_CHOICES,default='bar')
    # Trường (cột) để lưu các cài đặt chi tiết của biểu đồ 
    # Sử dụng JSONField cho phép lưu trữ dữ liệu JSON linh hoạt
    settings = models.JSONField(default=dict)
    # Trường (cột) lưu dấu thời gian khi bản ghi mới được tạo
    created_at = models.DateTimeField(auto_now_add=True) #Tự động gán ngày giờ mới khi tạo mới
    # Trường (cột) lưu dấu thời gian khi bản ghi được cập nhật lần cuối
    updated_at = models.DateTimeField(auto_now=True) #Tự động cập nhật ngày giờ hiện tại mỗi khi bản ghi mới được lưu

    
    def __str__(self):
        '''Hiển thị tên người dùng + loại biểu đồ'''
        # Trả về chuỗi kết hợp tên người dùng (truy cập qua Profile) và tên hiển thị của loại biểu đồ
        return f"{self.profile.user.username} - {self.get_chart_type_display()}"
    # Class Meta chứa các thông tin cấu hình (metadata) cho model
    class Meta:
        #Tên hiển thị thân thiện cho model(dạng số ít) trong trang admin
        verbose_name = "Visualization Config (Cấu hình biểu đồ)"
        #Tên hiển thị thân thiện cho model(dạng số nhiều) trong trang admin
        verbose_name_plural = "Visualization Configs (Cấu hình biểu đồ)"
        #Sắp xếp mặc định khi truy vấn dữ liệu 
        ordering = ['-updated_at'] # Sắp xếp theo trường 'updated-at' giảm dần
