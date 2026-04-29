"""
URL configuration for equilibria project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
"""

from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from main.views import homepage, test, auth_user, game_view, logout_user, initializeGame
from main import views

urlpatterns = [
    path('accounts/', include('allauth.urls')),
    path('admin/', admin.site.urls),
    path('homepage/', TemplateView.as_view(template_name='homepage.html')),
    path('test/', test, name='test'),
    path('', homepage, name='homepage'),
    path('game/play/<int:game_id>/', game_view, name='game_view'),
    path('login/', auth_user, name='login'),
    path('logout/', logout_user, name='logout'),
    path('initializeGame/', initializeGame, name='initializeGame')
]