from django import forms
from .models import EmotionEntry

class EmotionForm(forms.ModelForm):
    """Form nhập cảm xúc sau buổi học."""
    class Meta:
        model = EmotionEntry
        fields = ['emotion', 'notes']
        widgets = {
            'emotion': forms.Select(attrs={'class': 'form-select'}),
            'notes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }
