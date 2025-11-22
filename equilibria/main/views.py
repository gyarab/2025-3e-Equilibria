from django.shortcuts import render, get_object_or_404
from .models import Game, NameRegion, Region

def homepage(request):
    return render(request, 'main/homepage.html')

def game_view(request, game_id):
    game = get_object_or_404(Game, id=game_id, player=request.user)
    name_regions = list(NameRegion.objects.all().values_list('name', flat=True))
    for name in name_regions:
        Region.objects.get_or_create(name=name, game=game)
    
    regions = game.regions.all()

    context = {
        "game": game,
        "regions": regions,
    }
    return render(request, "main/game.html", context)