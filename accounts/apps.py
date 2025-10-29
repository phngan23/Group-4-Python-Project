from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'

    def ready(self):
        # Import signals để kết nối tín hiệu khi ứng dụng sẵn sàng
        import accounts.signals
