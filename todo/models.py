from django.db import models
from django.utils import timezone
from datetime import timedelta
from accounts.models import Profile   # Liên kết với người dùng
from django.core.mail import send_mail  # Dùng để gửi email reminder

# Model 1: ToDoItem
# Lưu thông tin từng task của người dùng
class ToDoItem(models.Model):
    # Mỗi task đều gắn liền với profile người dùng
    # Nếu profile người dùng bị xoá (xoá acc), các todo cũng bị xoá theo
    # Phần related_name cho phép truy ngược từ profile người dùng sang danh sách todolist của họ
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='todo_items')
    # Tên task todo, tối đa chuỗi 200 ký tự
    title = models.CharField(max_length=200)
    # Mô tả chi tiết công việc (có thể để trống)
    description = models.TextField(blank=True)
    # Deadline của công việc, set dưới dạng ngày giờ
    # Cho phép null và blank nếu không đặt deadline
    deadline = models.DateTimeField(null=True, blank=True)
    # Trạng thái đã hoàn thành hay chưa (mặc định là chưa)
    is_completed = models.BooleanField(default=False)
    # Trạng thái email nhắc nhở thời hạn đã được gửi hay chưa
    # Mục đích code này là để không bị gửi lặp lại
    reminder_sent = models.BooleanField(default=False)
    # Xu thưởng khi hoàn thành task đó
    reward_coins = models.IntegerField(default=0)
    # Thời gian tạo task
    created_at = models.DateTimeField(auto_now_add=True)
    # Thời gian cập nhật gần nhất của task (nếu có sửa task)
    updated_at = models.DateTimeField(auto_now=True)

    # Hàm hiển thị
    def __str__(self):
        '''Khi in object ra, hiển thị tiêu đề công việc'''
        return f"{self.title} (Deadline: {self.deadline.strftime('%Y-%m-%d %H:%M')})"
    
    def mark_completed(self):
        '''Đánh dấu công việc là hoàn thành và cộng xu'''
        if not self.is_completed:
            self.is_completed = True #Chuyển trạng thái cho task thành đã hoàn thành
            self.profile.coins += self.reward_coins #Cộng số xu của task đó vào tài khoản người dùng
            self.profile.save(update_fields=['coins']) #Lưu lại thay đổi về coins
            self.save(update_fields=['is_completed'])

    # Hàm kiểm tra điều kiện để gửi mail nhắc nhở
    def should_send_reminder(self):
        '''Kiểm tra xem có nên gửi email nhắc nhở hay không.
        Điều kiện:
        - Chưa hoàn thành
        - Chưa gửi reminder
        - Deadline trong vòng 24h tới
        '''
        now = timezone.now() #Thời gian hiện tại
        return (
            not self.is_completed #Chưa hoàn thành -> True
            and not self.reminder_sent #Chưa gửi thư nhắc nhở -> True
            and (self.deadline - now) <= timedelta(days=1) #Deadline trong vòng 24 giờ tới
            and (self.deadline > now) #Chưa qua deadline
        ) # Nếu hàm trả về True -> Cần gửi mail nhắc nhở
    
    # Hàm gửi mail
    def send_reminder_email(self):
        '''Gửi email reminder tới người dùng'''
        # Kiểm tra xem người dùng có email chưa
        # Chưa có thì thoát khỏi hàm luôn
        if not self.profile.user.email:
            return 

        # Tạo nội dung email gồm chủ đề (subject) và nội dung nhắc nhở (message)
        # Có chèn thông tin người dùng, tiêu đề task và deadline của task đó
        subject = f"Nhắc nhở: Sắp đến hạn công việc '{self.title}'"
        message = (
            f"Xin chào {self.profile.user.username},\n\n"
            f"Công việc '{self.title}' của bạn sẽ đến hạn vào {self.deadline.strftime('%H:%M %d/%m/%Y')}.\n"
            "Hãy hoàn thành sớm để nhận điểm thưởng nhé!\n\n"
            "From Study Habit Tracker Team!"
        )

        # Thực hiện gửi mail
        try:
            send_mail(
                subject,
                message,
                'no-reply@studyhabit.com', #Địa chỉ email của mình
                [self.profile.user.email], #Địa chỉ email người dùng
                fail_silently=False,
            )

            # Nếu try gửi mail thành công
            self.reminder_sent = True #Đánh dấu là đã gửi mail
            self.save() #Lưu lại

            # Ghi lại kết quả thành công gửi mail của task đó
            ReminderLog.objects.create(
                todo_item=self,
                sent_at=timezone.now(), #Thời gian gửi mail
                status="success" #Trạng thái gửi: Thành công
            )

        # Trong trường hợp bị lỗi (try fail)
        # Ghi lại trạng thái failed để dễ debug
        except Exception as e:
            ReminderLog.objects.create(
                todo_item=self,
                sent_at=timezone.now(),
                status=f"failed: {str(e)}" #Trạng thái gửi: không thành công
            )

    # Hàm tính thời gian còn lại cho đến deadline
    def time_left(self):
        '''Trả về thời gian còn lại trước deadline (đơn vị: giờ, phút)'''
        now = timezone.now() #Thời gian hiện tại
        delta = self.deadline - now #Thời gian còn lại trước deadline
        # Nếu thời gian còn lại < 0 -> Đã quá hạn deadline
        # delta.total_seconds đang tính theo giây
        if delta.total_seconds() < 0:
            return "Đã quá hạn"
        # Nếu vẫn còn thời gian (> 0)
        # Chuyển thời gian còn lại ra giờ và phút để hiển thị trên giao diện
        hours = delta.total_seconds() // 3600 #Tính giờ
        minutes = (delta.total_seconds() % 3600) // 60 #Tính phút, dùng số dư của chia giờ để tìm
        # Trả về thời gian còn lại
        return f"{int(hours)} giờ {int(minutes)} phút còn lại"

# Model 2: ReminderLog
# Bảng lưu lịch sử gửi mail    
class ReminderLog(models.Model):
    # Tham chiếu đến task tương ứng
    todo_item = models.ForeignKey(ToDoItem, on_delete=models.CASCADE, related_name='reminder_logs')
    # Thời điểm gửi mail
    sent_at = models.DateTimeField()
    # Trạng thái gửi email ("success" hoặc "failed")
    status = models.CharField(max_length=100)

    # Hàm hiển thị
    def __str__(self):
        '''Hiển thị log theo định dạng dễ đọc'''
        return f"Reminder cho '{self.todo_item.title}' - {self.status} lúc {self.sent_at.strftime('%Y-%m-%d %H:%M')}"