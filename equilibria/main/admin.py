from django.contrib import admin
from .models import Game, NameRegion, Region, ProblemInstance, SolutionChoice

class GameAdmin(admin.ModelAdmin):
    list_display = ('id', 'current_turn', 'budget', 'citizen_satisfaction', 'environment', 'military', 'is_active')

class NameRegionAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)

class RegionAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)

class ProblemInstanceAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'name', 'description', 'time_before_expiration',
        'max_budget_to_appear', 'max_citizen_satisfaction_to_appear',
        'max_environment_to_appear', 'max_military_to_appear', 'min_budget_to_appear', 'min_citizen_satisfaction_to_appear',
        'min_environment_to_appear', 'min_military_to_appear', 'budget_bias', 'citizen_satisfaction_bias',
        'environment_bias', 'military_bias', 'ideal_budget', 'ideal_citizen_satisfaction', 'ideal_environment', 'ideal_military')

class SolutionChoiceAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'problem', 'description', 'budget_change', 'citizen_satisfaction_change', 'environment_change', 'military_change')

admin.site.register(Game, GameAdmin)
admin.site.register(NameRegion, NameRegionAdmin)
admin.site.register(Region, RegionAdmin)
admin.site.register(ProblemInstance, ProblemInstanceAdmin)
admin.site.register(SolutionChoice, SolutionChoiceAdmin)