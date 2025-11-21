from django.urls import path
from . import views

app_name = 'todo'

urlpatterns = [
    # Pages
    path('add/', views.add_todo, name='add_todo'),
    path('list/', views.todo_list, name='todo_list'),
    
    # APIs
    path('api/create-task/', views.api_create_task, name='api_create_task'),
    path('api/get-tasks/', views.api_get_tasks, name='api_get_tasks'),
    path('api/update-task-status/<int:task_id>/', views.api_update_task_status, name='api_update_task_status'),
    path('api/delete-task/<int:task_id>/', views.api_delete_task, name='api_delete_task'),
    path('api/home-tasks/', views.api_home_tasks, name='api_home_tasks'),
    path('api/predict-duration/', views.api_predict_duration, name='api_predict_duration'),
    path('api/train-model/', views.api_train_model, name='api_train_model'),
]
