from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^$', views.play_game, name='play_game'),
    url(r'^AI_moves/$', views.AI_moves, name='AI_moves'),
]
