from django.db import models


class MusicTrack(models.Model):
    """Một track nhạc dùng để tập trung / học bài."""
    
    CATEGORY_CHOICES = [
        ("lofi", "Lo-Fi Beats"),
        ("nature", "Nature Sounds"),
        ("classical", "Classical"),
        ("ambient", "Ambient"),
        ("other", "Other"),
    ]

    title = models.CharField(max_length=200)
    description = models.CharField(max_length=255, blank=True)
    
    # Dùng để group track nếu sau này muốn lọc / hiển thị theo loại
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default="lofi",
    )

    # File mp3 upload qua Django admin
    audio_file = models.FileField(upload_to="music/tracks/", blank=True, null=True)

    # Cho track mặc định - đường dẫn tới file trong static
    static_audio_path = models.CharField(
        max_length=255,
        blank=True,
        help_text="Đường dẫn tới file audio trong static folder, ví dụ: music/default/track.mp3"
    )

    # Hiển thị bìa: ưu tiên cover_image, nếu không có dùng color
    cover_color = models.CharField(
        max_length=7,
        default="#6C63FF",
        help_text="Mã màu hex, ví dụ #6C63FF",
    )
    cover_image = models.ImageField(
        upload_to="music/covers/",
        blank=True,
        null=True,
    )

    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False, help_text="Track mặc định cho mọi user")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.title

    @property
    def get_audio_url(self):
        """Trả về URL audio - ưu tiên static path, sau đó mới tới uploaded file"""
        if self.static_audio_path:
            return f"/static/{self.static_audio_path}"
        elif self.audio_file:
            return self.audio_file.url
        return ""

    @property
    def duration_seconds(self):
        """
        Nếu muốn lưu thêm duration sau này thì có thể bổ sung field duration.
        Hiện tại player sẽ đọc duration trực tiếp từ audio trong browser.
        """
        return None
