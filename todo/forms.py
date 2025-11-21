from django import forms
from .models import ToDoItem

class ToDoItemForm(forms.ModelForm):
    """Form để người dùng tạo hoặc chỉnh sửa To-Do"""
    class Meta:
        model = ToDoItem
        fields = ['title', 'description', 'deadline']
        widgets = {
            'deadline': forms.DateTimeInput(attrs={'type': 'datetime-local'})
        }
