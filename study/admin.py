from django.contrib import admin
from .models import Subject, StudySession, BreakSession

admin.site.register(Subject)
admin.site.register(StudySession)
admin.site.register(BreakSession)
