"""
URL configuration for equilibria project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
"""

from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from main.views import homepage

urlpatterns = [
    path('admin/', admin.site.urls),
    path('homepage/', TemplateView.as_view(template_name='homepage.html')),
    path('accounts/', include('allauth.urls')),
    path('', homepage, name='homepage'),
]