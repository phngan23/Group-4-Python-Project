from django.contrib import admin
from .models import Character, Inventory, Achievement


@admin.register(Character)
class CharacterAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'rarity')
    search_fields = ('name',)
    list_filter = ('rarity',)


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ('profile', 'character', 'is_active', 'purchase_date')
    list_filter = ('is_active',)
    search_fields = ('profile__user__username', 'character__name')


@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ('profile', 'title', 'reward_coins', 'is_claimed', 'earned_at')
    list_filter = ('is_claimed',)
    search_fields = ('profile__user__username', 'title')
