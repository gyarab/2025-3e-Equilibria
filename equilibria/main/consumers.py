import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Game, NameRegion, Region, ProblemInstance, SolutionChoice
import asyncio
import random
from channels.db import database_sync_to_async

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.game_id = self.scope['url_route']['kwargs']['game_id']
        self.game_group_name = f'game_{self.game_id}'

        await self.channel_layer.group_add(
            self.game_group_name,
            self.channel_name
        )

        await self.accept()

        # Send initial game state
        await self.send_initial_state()

        print("Starting game cycle")
        # Start the game cycle
        asyncio.create_task(self.start_game_cycle())

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.game_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        solution_id = data.get("solution_id")
        region_id = data.get("region_id")

        # Apply solution effect
        try:
            solution = await database_sync_to_async(SolutionChoice.objects.get)(id=solution_id, problem=problem)
            problem = await database_sync_to_async(solution.problem)
            region = await database_sync_to_async(Region.objects.get)(id=region_id)
            game = await database_sync_to_async(Game.objects.get)(id=self.game_id)
            

            await asyncio.sleep(solution.time_before_effect * 4) # Waits before aplying the changes, 4 = amount of seconds for a passing of 1 game turn

            region.problem = None
            region.occupied = False  # Clears the region of the problem
            await database_sync_to_async(region.save)()

            game.budget += solution.budget_change
            game.citizen_satisfaction += solution.citizen_satisfaction_change
            game.environment += solution.environment_change
            game.military += solution.military_change
            await database_sync_to_async(game.save)()

            # Notify frontend
            await self.send(text_data=json.dumps({
                "type": "update_stats",
                "game": {
                    "budget": game.budget,
                    "citizen_satisfaction": game.citizen_satisfaction,
                    "environment": game.environment,
                    "military": game.military,
                },
            }))

        except Exception as e:
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": str(e)
            }))

    async def send_initial_state(self):
        game = await database_sync_to_async(Game.objects.get)(id=self.game_id)

        await self.send(text_data=json.dumps({
            "type": "initial_state",
            "game": {
                "budget": game.budget,
                "citizen_satisfaction": game.citizen_satisfaction,
                "environment": game.environment,
                "military": game.military,
            },
        }))

    async def start_game_cycle(self):
        await asyncio.sleep(2)  # wait a bit before first problem
        while True:
            try:
                game = await database_sync_to_async(Game.objects.get)(id=self.game_id)
                name_regions = await database_sync_to_async(list)(NameRegion.objects.all())
                game.current_turn += 1
                await database_sync_to_async(game.save)()

                chosen_region = random.choice(name_regions)
                possible_problems = await database_sync_to_async(list)(
                    chosen_region.possible_problems.filter(
                        max_budget_to_appear__gte=game.budget,
                        max_citizen_satisfaction_to_appear__gte=game.citizen_satisfaction,
                        max_environment_to_appear__gte=game.environment,
                        max_military_to_appear__gte=game.military,
                        min_budget_to_appear__lte=game.budget,
                        min_citizen_satisfaction_to_appear__lte=game.citizen_satisfaction,
                        min_environment_to_appear__lte=game.environment,
                        min_military_to_appear__lte=game.military,
                        )
                )

                if not possible_problems:
                    print("No possible problems for region")
                
                problem = await self.choose_problem(game, possible_problems)
                region = await database_sync_to_async(Region.objects.get)(name=chosen_region.name)
                region.problem = problem
                region.occupied = True
                await database_sync_to_async(region.save)()
        
                # Send problem to frontend
                await self.send(text_data=json.dumps({
                    "type": "new_state",
                    "problem": {
                        "id": problem.id,
                        "region_id": region.id,
                        "title": problem.name,
                        "description": problem.description,
                    },
                    "solutions": [
                        {"id": sol.id, "name": sol.name, "description": sol.description, "budget_change": sol.budget_change,
                         "citizen_satisfaction_change": sol.citizen_satisfaction_change, "environment_change": sol.environment_change,
                         "military_change": sol.military_change} 
                        for sol in await database_sync_to_async(list)(problem.solutions.all())
                    ],
                    "turn": game.current_turn,
                }))

                await asyncio.sleep(4)  # wait before spawning next problem

            except Exception as e:
                print("Error spawning problem:", e)
                await asyncio.sleep(4)

    async def calculate_problem_chance_factor(self, game, problem):
        budget_factor = (abs(game.budget - problem.ideal_budget)) * problem.budget_bias
        satisfaction_factor = (abs(game.citizen_satisfaction - problem.ideal_citizen_satisfaction)) * problem.citizen_satisfaction_bias
        environment_factor = (abs(game.environment - problem.ideal_environment)) * problem.environment_bias
        military_factor = (abs(game.military - problem.ideal_military)) * problem.military_bias
        return budget_factor + satisfaction_factor + environment_factor + military_factor
    
    async def choose_problem(self, game, possible_problems):
        problem_chances = []
        pool = 0
        for prob in possible_problems:
            chance = await self.calculate_problem_chance_factor(game, prob)
            problem_chances.append(chance)

        pool = sum(problem_chances)
        if pool == 0:
            return None

        chosen = random.randint(1, pool)
        current = 0

        for prob, chance in zip(possible_problems, problem_chances):
            current += chance
            if chosen <= current:
                return prob
        
        return possible_problems[-1]