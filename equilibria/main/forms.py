from django.contrib.auth.forms import UserCreationForm
from .models import GameUser

class GameUserCreateForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model =GameUser
        fields = ('username',)