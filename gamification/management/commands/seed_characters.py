import os
from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand

from gamification.models import Character

# Danh sách nhân vật mặc định
CHARACTERS = [
    {
        "id": 1,
        "name": "Bunny Scholar",
        "price": 0,
        "rarity": "common",
        "emoji": "🐰",
        "image_file": "char1.png",
        "description": "A cheerful bunny who loves studying and helping you stay focused.",
        "quotes": [
            "Nice to meet you! Let's study together!",
            "You can do it, one page at a time! 📚",
        ],
    },
    {
        "id": 2,
        "name": "Fox Reader",
        "price": 50,
        "rarity": "rare",
        "emoji": "🦊",
        "image_file": "char2.png",
        "description": "A smart fox with a passion for reading and solving tough problems.",
        "quotes": [
            "Shh… focus mode on! 🦊",
            "Every problem has a solution. Let's find it!",
        ],
    },
    {
        "id": 3,
        "name": "Bear Thinker",
        "price": 100,
        "rarity": "rare",
        "emoji": "🐻",
        "image_file": "char3.png",
        "description": "A thoughtful bear who helps you stay calm and think deeply.",
        "quotes": [
            "Take a deep breath, we've got this. 🐻",
            "Slow and steady wins the race.",
        ],
    },
    {
        "id": 4,
        "name": "Owl Professor",
        "price": 200,
        "rarity": "rare",
        "emoji": "🦉",
        "image_file": "char4.png",
        "description": "A wise owl professor guiding you through every learning challenge.",
        "quotes": [
            "Knowledge is power. Let's collect more! 🦉",
            "Every minute of focus makes you smarter.",
        ],
    },
    {
        "id": 5,
        "name": "Cat Coder",
        "price": 300,
        "rarity": "epic",
        "emoji": "🐱",
        "image_file": "char5.png",
        "description": "A cool coding cat who helps you debug your distractions.",
        "quotes": [
            "Let's debug this together! 💻",
            "No bugs, only features… and focus.",
        ],
    },
    {
        "id": 6,
        "name": "Panda Writer",
        "price": 400,
        "rarity": "epic",
        "emoji": "🐼",
        "image_file": "char6.png",
        "description": "A gentle panda who inspires creativity and writing focus.",
        "quotes": [
            "Write your thoughts, one line at a time. ✍️",
            "Your ideas are worth writing down.",
        ],
    },
]


class Command(BaseCommand):
    help = "Seed default characters into the database"

    def handle(self, *args, **options):
        # Folder chứa ảnh gốc
        static_dir = os.path.join(settings.BASE_DIR, "frontend", "static", "assets", "characters")

        # Folder MEDIA (nếu chưa có → tạo)
        os.makedirs(os.path.join(settings.MEDIA_ROOT, "characters/idle"), exist_ok=True)

        self.stdout.write(self.style.MIGRATE_HEADING("Seeding characters..."))

        for data in CHARACTERS:
            # Tạo hoặc lấy nhân vật
            char_obj, created = Character.objects.get_or_create(
                id=data["id"],
                defaults={
                    "name": data["name"],
                    "price": data["price"],
                    "rarity": data["rarity"],
                    "emoji": data["emoji"],
                    "description": data["description"],
                    "motivation_quotes": data["quotes"],
                },
            )

            # Nếu đã có từ trước vẫn update description/quotes cho tiện
            if not created:
                char_obj.name = data["name"]
                char_obj.price = data["price"]
                char_obj.rarity = data["rarity"]
                char_obj.emoji = data["emoji"]
                char_obj.description = data["description"]
                char_obj.motivation_quotes = data["quotes"]

            # Gán ảnh nếu chưa có hoặc muốn update ảnh
            image_path = os.path.join(static_dir, data["image_file"])

            if os.path.exists(image_path):
                with open(image_path, "rb") as img:
                    char_obj.image_idle.save(data["image_file"], File(img), save=False)
            else:
                self.stdout.write(self.style.WARNING(f"⚠️ Image not found: {image_path}"))

            # Lưu và database
            char_obj.save()

            self.stdout.write(
                self.style.SUCCESS(f"{'Created' if created else 'Updated'}: {char_obj.name}")
            )

        self.stdout.write(self.style.SUCCESS("🎉 Done seeding characters!"))
