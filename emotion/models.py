from django.db import models
from django.utils import timezone
from accounts.models import Profile # Liên kết với người dùng
from study.models import StudySession # Liên kết với buổi học

class EmotionEntry(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='emotion_entries')#Tạo mối quan hệ 1-nhiều với profile => mỗi người dùng có nhiều cảm xúc khác nhau
    #on_delete=models.CASCADE: nếu profile bị xoá -> emotional entry bị xoá
    #related_name='emotion_entries'=> giúp truy cập ngược
    study_session = models.OneToOneField(StudySession, on_delete=models.CASCADE, related_name='emotion_entry')#mỗi studysession có 1 emotion entry duy nhất
    #tuple cảm xúc -> dùng cho field emtion
    EMOTION_CHOICES = [('happy', '😊 Happy'),
                       ('normal', '😐 Normal'),
                       ('sad', '😞 Sad'),
                       ('stressed', '😰 Stressed'),
                       ('excited', '🤩 Excited')]
    
    emotion = models.CharField(max_length=10, choices=EMOTION_CHOICES) #kiểu chuỗi <10 kí tự-> lưu cảm xúc người dùng
    notes = models.TextField(blank=True)#=> lưu ghi chú về cảm xúc (long text)
    created_at = models.DateTimeField(auto_now_add=True)#=> gán thời gian 

    def __str__(self):#hiển thị object dưới dạng chuỗi
        '''Hiển thị cảm xúc'''
        subject_name = self.study_session.subject.name if self.study_session else "Unknown Subject" #lấy tên môn học từ buổi học nếu có, k thì none
        emotion_icon = self.get_emotion_display_icon()#lấy emoji và tên cảm xúc tương ứng
        return f"{subject_name} - {emotion_icon}"

    def get_emotion_display_icon(self):
        '''Trả về biểu tượng cảm xúc tương ứng với giá trị emotion. Dùng để hiển thị trong giao diện hoặc admin.'''
        icon_map = {
            'happy': '😊 Happy',
            'normal': '😐 Normal',
            'sad' : '😞 Sad',
            'stressed': '😰 Stressed',
            'excited': '🤩 Excited',
        }
        return icon_map.get(self.emotion, '❓ Không rõ')#trả về biểu tượng cảm xúc tương ứng với self.emotion, không khớp thì trả về "không rõ"

    class Meta:#chứa thông tin cấu hình bổ sung cho model
        # Tên hiển thị trong admin site
        verbose_name = "Emotion Entry (Cảm xúc)"
        verbose_name_plural = "Emotion Entries (Các cảm xúc)"
        ordering = ['-created_at'] # Sắp xếp theo thời gian tạo giảm dần