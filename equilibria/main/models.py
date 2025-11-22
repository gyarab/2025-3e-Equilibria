from django.conf import settings
from django.db import models

class Game(models.Model):
    player = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    current_turn = models.IntegerField(default=0)  # Each turn = 1 week (ingame time) or 4 seconds (real time)
    budget = models.IntegerField(default=100)
    citizen_satisfaction = models.IntegerField(default=50)
    environment = models.IntegerField(default=50)
    military = models.IntegerField(default=50)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Game {self.id} for {self.player.username}"

class NameRegion(models.Model):
    name = models.CharField(max_length=100, default="Placeholder name region")

    def __str__(self):
        return f"{self.name} (NameRegion)"

class Region(models.Model):
    name = models.CharField(max_length=100, default="Placeholder region")
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name="regions", null=True, blank=True)
    problem = models.ForeignKey('ProblemInstance', on_delete=models.SET_NULL, null=True, blank=True, related_name="regions") # Problem currently in the region in the game
    occupied = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} (Region)"


class ProblemInstance(models.Model):
    name = models.CharField(max_length=100, default="Placeholder problem")
    possible_regions = models.ManyToManyField(NameRegion, related_name="possible_problems")  # List of region names where this problem can appear
    description = models.TextField(default="Placeholder problem description")

    time_before_expiration = models.IntegerField(default=0) # Time before problem dissappears if not solved

    # If stats are within these ranges, the problem can appear
    max_budget_to_appear = models.IntegerField(default=100)
    max_citizen_satisfaction_to_appear = models.IntegerField(default=100)
    max_environment_to_appear = models.IntegerField(default=100)
    max_military_to_appear = models.IntegerField(default=100)
    min_budget_to_appear = models.IntegerField(default=0)
    min_citizen_satisfaction_to_appear = models.IntegerField(default=0)
    min_environment_to_appear = models.IntegerField(default=0)
    min_military_to_appear = models.IntegerField(default=0)

    # How much each stat influences chance of appearance
    budget_bias = models.IntegerField(default=1)
    citizen_satisfaction_bias = models.IntegerField(default=1)
    environment_bias = models.IntegerField(default=1)
    military_bias = models.IntegerField(default=1)

    # Ideal values for each stat
    ideal_budget = models.IntegerField(default=50)
    ideal_citizen_satisfaction = models.IntegerField(default=50)
    ideal_environment = models.IntegerField(default=50)
    ideal_military = models.IntegerField(default=50)

    def __str__(self):
        return f"Problem {self.id}: {self.name}"


class SolutionChoice(models.Model):
    name = models.CharField(max_length=100, default="Placeholder solution")
    problem = models.ForeignKey(ProblemInstance, on_delete=models.CASCADE, related_name="solutions")
    description = models.CharField(max_length=255, default="Placeholder solution")

    time_before_effect = models.IntegerField(default=0) # Time before the changes to stats happen after solution is chosen
    budget_change = models.IntegerField(default=0)
    citizen_satisfaction_change = models.IntegerField(default=0)
    environment_change = models.IntegerField(default=0)
    military_change = models.IntegerField(default=0)

    def __str__(self):
        return f"Solution for problem {self.problem.id}"