from django.db import models
from django.utils import timezone
from datetime import timedelta
from accounts.models import Profile   # Liên kết với người dùng
from django.core.mail import send_mail  # Dùng để gửi email reminder

# Model 1: ToDoItem
class ToDoItem(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='todo_items')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    deadline = models.DateTimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    reminder_sent = models.BooleanField(default=False)
    reward_coins = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        '''Khi in object ra, hiển thị tiêu đề công việc'''
        return f"{self.title} (Deadline: {self.deadline.strtime('%Y-%m-%d %H:%M')})"
    
    def mark_completed(self):
        '''Đánh dấu công việc là hoàn thành và cộng xu'''
        if not self.is_completed:
            self.is_completed = True
            self.profile.coins += self.reward_coins
            self.profile.save(update_fields=['coins'])
            self.save(update_fields=['is_completed'])

    def should_send_reminder(self):
        '''Kiểm tra xem có nên gửi email nhắc nhở hay không.
        Điều kiện:
        - Chưa hoàn thành
        - Chưa gửi reminder
        - Deadline trong vòng 24h tới
        '''
        now = timezone.now()
        return (
            not self.is_completed
            and not self.reminder_sent
            and (self.deadline - now) <= timedelta(days=1)
            and (self.deadline > now)
        )
    
    def send_reminder_email(self):
        '''Gửi email reminder tới người dùng'''
        if not self.profile.user.email:
            return 

        subject = f"Nhắc nhở: Sắp đến hạn công việc '{self.title}'"
        message = (
            f"Xin chào {self.profile.user.username},\n\n"
            f"Công việc '{self.title}' của bạn sẽ đến hạn vào {self.deadline.strftime('%H:%M %d/%m/%Y')}.\n"
            "Hãy hoàn thành sớm để nhận điểm thưởng nhé!\n\n"
            "From Study Habit Tracker Team!"
        )

        try:
            send_mail(
                subject,
                message,
                'no-reply@studyhabit.com',
                [self.profile.user.email],
                fail_silently=False,
            )

            self.reminder_sent = True
            self.save()

            ReminderLog.objects.create(
                todo_item=self,
                sent_at=timezone.now(),
                status="success"
            )

        except Exception as e:
            ReminderLog.objects.create(
                todo_item=self,
                sent_at=timezone.now(),
                status=f"failed: {str(e)}"
            )

    def time_left(self):
        '''Trả về thời gian còn lại trước deadline (đơn vị: giờ, phút)'''
        now = timezone.now()
        delta = self.deadline - now
        if delta.total_seconds() < 0:
            return "Đã quá hạn"
        hours = delta.total_seconds() // 3600
        minutes = (delta.total_seconds() % 3600) // 60
        return f"{int(hours)} giờ {int(minutes)} phút còn lại"
    
class ReminderLog(models.Model):
    todo_item = models.ForeignKey(ToDoItem, on_delete=models.CASCADE, related_name='reminder_logs')
    sent_at = models.DateTimeField()
    # Trạng thái gửi email ("success" hoặc "failed")
    status = models.CharField(max_length=100)

    def __str__(self):
        '''Hiển thị log theo định dạng dễ đọc'''
        return f"Reminder cho '{self.todo_item.title}' - {self.status} lúc {self.sent_at.strftime('%Y-%m-%d %H:%M')}"