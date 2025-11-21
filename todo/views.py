from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
import json
from .models import ToDoItem, ReminderLog, TaskPredictor

@login_required
def add_todo(request):
    return render(request, 'todo/add_todo.html')

@login_required
def todo_list(request):
    return render(request, 'todo/todo_list.html')

# API VIEWS
@login_required
@require_http_methods(["POST"])
@csrf_exempt
def api_create_task(request):
    try:
        data = json.loads(request.body)
        user = request.user
        
        task = ToDoItem(
            profile=user.profile,
            title=data.get('title'),
            description=data.get('description', ''),
            category=data.get('category', 'study'),
            priority=data.get('priority', 'medium')
        )
        
        # Xử lý deadline
        if data.get('due_date'):
            task.deadline = timezone.datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
        
        task.save()
        
        return JsonResponse({
            'status': 'success',
            'message': 'Task created successfully',
            'task_id': task.id,
            'reward_coins': task.reward_coins,
            'predicted_duration': task.get_duration_display()
        })
        
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})

@login_required
@require_http_methods(["GET"])
def api_get_tasks(request):
    try:
        user = request.user
        status_filter = request.GET.get('status', 'all')
        
        tasks = ToDoItem.objects.filter(profile=user.profile)
        
        # Filter theo status
        if status_filter == 'pending':
            tasks = tasks.filter(is_completed=False)
        elif status_filter == 'completed':
            tasks = tasks.filter(is_completed=True)
        elif status_filter == 'overdue':
            tasks = [task for task in tasks if task.is_overdue()]
        
        tasks_data = []
        for task in tasks:
            tasks_data.append({
                'id': task.id,
                'title': task.title,
                'description': task.description,
                'category': task.category,
                'priority': task.priority,
                'due_date': task.deadline.isoformat() if task.deadline else None,
                'is_completed': task.is_completed,
                'reward_coins': task.reward_coins,
                'predicted_duration': task.get_duration_display(),
                'time_left': task.time_left(),
                'is_overdue': task.is_overdue(),
                'status': 'completed' if task.is_completed else 'pending'
            })
        
        # Tính statistics
        total_tasks = ToDoItem.objects.filter(profile=user.profile).count()
        completed_tasks = ToDoItem.objects.filter(profile=user.profile, is_completed=True).count()
        pending_tasks = total_tasks - completed_tasks
        overdue_tasks = len([task for task in ToDoItem.objects.filter(profile=user.profile) if task.is_overdue()])
        
        return JsonResponse({
            'status': 'success',
            'tasks': tasks_data,
            'stats': {
                'total': total_tasks,
                'completed': completed_tasks,
                'pending': pending_tasks,
                'overdue': overdue_tasks
            }
        })
        
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})

@login_required
@require_http_methods(["POST"])
@csrf_exempt
def api_update_task_status(request, task_id):
    try:
        data = json.loads(request.body)
        user = request.user
        
        task = ToDoItem.objects.get(id=task_id, profile=user.profile)
        
        if data.get('status') == 'completed':
            task.mark_completed()
            new_status = 'completed'
        else:
            task.is_completed = False
            task.save()
            new_status = 'pending'
        
        return JsonResponse({
            'status': 'success',
            'message': 'Task updated successfully',
            'new_status': new_status
        })
        
    except ToDoItem.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Task not found'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})

@login_required
@require_http_methods(["POST"])
@csrf_exempt
def api_delete_task(request, task_id):
    try:
        user = request.user
        task = ToDoItem.objects.get(id=task_id, profile=user.profile)
        task.delete()
        
        return JsonResponse({
            'status': 'success',
            'message': 'Task deleted successfully'
        })
        
    except ToDoItem.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Task not found'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})

@login_required
def api_home_tasks(request):
    user = request.user

    tasks = ToDoItem.objects.filter(profile=user.profile).order_by('-created_at')[:5]

    return JsonResponse({
        "tasks": [
            {
                "id": t.id,
                "title": t.title,
                "completed": t.is_completed
            }
            for t in tasks
        ]
    })

@login_required
@require_http_methods(["POST"])
@csrf_exempt
def api_predict_duration(request):
    try:
        data = json.loads(request.body)
        user = request.user
        
        # Tạo task tạm để dự đoán
        temp_task = ToDoItem(
            profile=user.profile,
            title=data.get('title', ''),
            description=data.get('description', ''),
            category=data.get('category', 'study'),
            priority=data.get('priority', 'medium'),
            created_at=timezone.now()
        )
        
        predictor = TaskPredictor()
        predicted_minutes = predictor.predict_duration(temp_task, user.profile)
        
        # Format kết quả
        hours = predicted_minutes // 60
        minutes = predicted_minutes % 60
        
        if hours > 0:
            duration_text = f"{hours}h {minutes}m"
        else:
            duration_text = f"{minutes}m"
        
        return JsonResponse({
            'status': 'success',
            'predicted_minutes': predicted_minutes,
            'duration_text': duration_text,
            'confidence': 'high' if predictor.model else 'medium'
        })
        
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})

@login_required
@require_http_methods(["POST"])
@csrf_exempt
def api_train_model(request):
    try:
        user = request.user
        
        completed_tasks = ToDoItem.objects.filter(
            profile=user.profile,
            is_completed=True,
            actual_duration__isnull=False
        )
        
        predictor = TaskPredictor()
        success = predictor.train_model(completed_tasks)
        
        return JsonResponse({
            'status': 'success',
            'trained': success,
            'training_samples': len(completed_tasks),
            'message': 'AI model trained successfully!' if success else 'Need more completed tasks to train AI'
        })
        
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})
