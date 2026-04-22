import random
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from main.models import Game

class Command(BaseCommand):
    help = "Create a placeholder game with regions, problems, and 3 solutions each"

    def handle(self, *args, **kwargs):
        # Use first superuser or create one
        user = User.objects.filter(is_superuser=True).first()
        if not user:
            self.stdout.write(self.style.ERROR("No superuser found. Create one first."))
            return

        # Create game
        game = Game.objects.create(
            player=user,
            economy=100,
            citizen_satisfaction=50,
            environment=50,
            military_power=50
        )
        self.stdout.write(self.style.SUCCESS(f"Created game {game.id} for {user.username}"))

        print(self.style.SUCCESS("Placeholder game setup complete!"))