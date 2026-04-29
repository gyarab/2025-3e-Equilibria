from django.shortcuts import render, get_object_or_404, redirect
from .models import Game, NameRegion, Region
from .forms import GameUserCreateForm
from django.contrib.auth import login, logout
from django.contrib.auth.forms import AuthenticationForm
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required

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

def auth_user(request):
    login_form = AuthenticationForm()
    register_form = GameUserCreateForm()

    if request.method == "POST":
        if "login_submit" in request.POST:
            login_form = AuthenticationForm(data=request.POST)
            if login_form.is_valid():
                user = login_form.get_user()
                login(request, user)
                return redirect(homepage)
        elif "register_submit" in request.POST:
            register_form = GameUserCreateForm(request.POST)
            if register_form.is_valid():
                user = register_form.save()
                login(request, user, backend="django.contrib.auth.backends.ModelBackend")
                return redirect(homepage)
        
    context = {
        "login_form": login_form,
        "register_form": register_form,
    }
    return render(request, "main/auth.html", context)

def logout_user(request):
    if request.method == "POST":
        logout(request)
    return redirect(homepage)

@login_required
def initializeGame(request):
    if request.method == "POST":
        new_game = Game.objects.create(
            player = request.user,
            economy=500,
            citizen_satisfaction=500,
            environment=500,
            military_power=500,
        )
        name_regions = list(NameRegion.objects.all().values_list('name', flat=True))
        for name in name_regions:
            Region.objects.create(name=name, game=new_game)
        return JsonResponse({
            "status": "success",
            "game_id": new_game.id,
        })