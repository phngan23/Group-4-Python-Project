# gamification/urls.py
from django.urls import path
from . import views

app_name = "gamification"

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('shop/', views.shop, name='shop'),
    path('buy/<int:character_id>/', views.api_unlock_character, name='buy_character'),
    path('my-characters/', views.my_characters, name='my_characters'),
    path('activate/<int:character_id>/', views.api_set_active_character, name='activate_character'),
    path('api/characters/', views.api_characters, name='api_characters'),
    path('api/shop/items/', views.api_shop_items, name='api_shop_items'),

]
