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

    regions_data = []
    for region in regions:
        regions_data.append({
            "name": region.name,
            "problem": region.problem.name if region.problem else None,
            "occupied": region.occupied,
        })

    context = {
        "game": game,
        "regions": regions_data,
    }
    return render(request, "main/test_map.html", context)

def test(request):
    return render(request, 'main/test_map.html')