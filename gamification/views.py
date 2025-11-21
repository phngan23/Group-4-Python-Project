from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import Character, Inventory
from accounts.models import Profile

# =======================
# DASHBOARD
# =======================
@login_required
def dashboard(request):
    """Dashboard tổng quan"""
    user = request.user
    profile = user.profile
    
    # Tính toán stats thật
    unlocked_characters = Inventory.objects.filter(profile=profile).count()
    active_character = Inventory.objects.filter(profile=profile, is_active=True).first()
    
    context = {
        'characters_unlocked': unlocked_characters,
        'active_character': active_character,
    }
    return render(request, 'gamification/dashboard.html', context)

# =======================
# SHOP PAGE
# =======================
@login_required
def shop(request):
    """Trang cửa hàng"""
    return render(request, 'gamification/shop.html', {"active_page": "shop"})

# =======================
# MY CHARACTER PAGE
# =======================
@login_required
def my_characters(request):
    """Trang nhân vật của user"""
    profile = request.user.profile
    inventory_items = Inventory.objects.filter(profile=profile).select_related("character")

    return render(request, 'gamification/my_characters.html', {
        "inventory_items": inventory_items,
        "active_page": "my_characters"
    })


# API - DÙNG DATABASE THẬT
@login_required
@require_http_methods(["GET"])
def api_characters(request):
    """API lấy danh sách characters từ Inventory"""
    try:
        user = request.user
        profile = user.profile
        
        characters_data = []
        active_character_data = None
        
        # Lấy tất cả characters
        all_characters = Character.objects.all()
        
        for character in all_characters:
            # Kiểm tra trong inventory
            inventory_item = Inventory.objects.filter(profile=profile, character=character).first()
            
            is_unlocked = inventory_item is not None
            is_active = inventory_item.is_active if inventory_item else False
            
            # Character đầu tiên unlock mặc định
            if character.id == 1 and not is_unlocked:
                inventory_item = Inventory.objects.create(
                    profile=profile,
                    character=character,
                    is_active=True
                )
                is_unlocked = True
                is_active = True
            
            character_data = {
                'id': character.id,
                'name': character.name,
                'image_path': character.image_idle.url if character.image_idle else '/static/assets/images/char1.png',
                'bio': character.description,
                'price': character.price,
                'rarity': character.rarity,
                'emoji': character.emoji,
                'is_unlocked': is_unlocked,
                'is_active': is_active,
            }
            
            characters_data.append(character_data)
            
            if is_active:
                active_character_data = character_data
        
        return JsonResponse({
            'status': 'success',
            'characters': characters_data,
            'active_character': active_character_data
        })
        
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})

@login_required
@require_http_methods(["POST"])
@csrf_exempt
def api_set_active_character(request, character_id):
    """API set character active"""
    try:
        user = request.user
        profile = user.profile
        
        # Tìm inventory item
        inventory_item = Inventory.objects.get(profile=profile, character_id=character_id)
        
        # Kích hoạt nhân vật
        inventory_item.activate()
        
        return JsonResponse({
            'status': 'success', 
            'message': 'Character activated successfully'
        })
            
    except Inventory.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Character not found or not unlocked'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})

@login_required
@require_http_methods(["POST"])
@csrf_exempt
def api_unlock_character(request, character_id):
    """API unlock character bằng coins"""
    try:
        user = request.user
        profile = user.profile
        
        # Kiểm tra character
        character = Character.objects.get(id=character_id)
        
        # Kiểm tra đã unlock chưa
        if Inventory.objects.filter(profile=profile, character=character).exists():
            return JsonResponse({'status': 'error', 'message': 'Character already unlocked'})
        
        # Kiểm tra đủ coins
        if profile.coins < character.price:
            return JsonResponse({'status': 'error', 'message': 'Not enough coins'})
        
        # Trừ coins và tạo inventory
        profile.coins -= character.price
        profile.save()
        
        Inventory.objects.create(
            profile=profile,
            character=character,
            is_active=False
        )
        
        return JsonResponse({
            'status': 'success',
            'character': {
                'id': character.id,
                'name': character.name,
                'emoji': character.emoji,
                'image_path': character.image_idle.url if character.image_idle else "",
                'random_quote': character.get_random_quote(),
            },
            'new_balance': profile.coins
        })
        
    except Character.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Character not found'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})
    
@login_required
def api_shop_items(request):
    """API trả về danh sách item trong shop."""
    profile = request.user.profile

    items = []
    characters = Character.objects.all()

    for char in characters:
        owned = Inventory.objects.filter(profile=profile, character=char).exists()

        items.append({
            "id": char.id,
            "category": "characters",
            "name": char.name,
            "description": char.description,
            "price": char.price,
            "is_owned": owned,
            "emoji": char.emoji,
            "rarity": char.rarity,
            "image": f"<img src='{char.image_idle.url}' class='shop-img' />" if char.image_idle else "<div class='shop-img-fallback'>?</div>"
        })

    return JsonResponse({"status": "success", "items": items})
