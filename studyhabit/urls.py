from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    path('', include('frontend.urls')),

    path("auth/", include('django.contrib.auth.urls')),
    path('accounts/', include('accounts.urls')), 
    
    path('study/', include('study.urls')),
    path('todo/', include('todo.urls')),
    path('music/', include('music.urls')),
    path('emotion/', include('emotion.urls')),
    path('visualization/', include('visualization.urls')),
    path('shop/', include('gamification.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)