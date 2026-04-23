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
            solution = await database_sync_to_async(SolutionChoice.objects.get)(id=solution_id)
            region = await database_sync_to_async(Region.objects.get)(id=region_id)
            game = await database_sync_to_async(Game.objects.get)(id=self.game_id)
            

            await asyncio.sleep(solution.time_before_effect * 4) # Waits before aplying the changes, 4 = amount of seconds for passing one game turn

            region.problem = None
            region.occupied = False
            await database_sync_to_async(region.save)()

            game.economy += solution.budget_change
            game.citizen_satisfaction += solution.citizen_satisfaction_change
            game.environment += solution.environment_change
            game.military_power += solution.military_change
            await database_sync_to_async(game.save)()

            # Notify frontend
            await self.send(text_data=json.dumps({
                "type": "update_state",
                "game": {
                    "economy": game.economy,
                    "citizen_satisfaction": game.citizen_satisfaction,
                    "environment": game.environment,
                    "military_power": game.military_power,
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
                "economy": game.economy,
                "citizen_satisfaction": game.citizen_satisfaction,
                "environment": game.environment,
                "military_power": game.military_power,
            },
        }))

    async def start_game_cycle(self):
        await asyncio.sleep(2)  # Wait a bit before first problem
        while True:
            try:
                game = await database_sync_to_async(lambda: Game.objects.get(id=self.game_id))()
                problems = ProblemInstance.objects.all()
                game.current_turn += 1
                await database_sync_to_async(lambda: game.save())()
                print(f"Turn {game.current_turn} started")
                
                problem, region = await self.choose_problem(game, problems)
                if not problem:
                    print("No problem chosen, skipping turn")
                    await asyncio.sleep(4)  # Wait before trying to spawn next problem
                    continue
                
                region.problem = problem
                region.occupied = True
                await database_sync_to_async(lambda: region.save())()

                solutions_list = await database_sync_to_async(lambda: list(problem.solutions.all()))()
                print("ready to send problem")
        
                # Send problem to frontend
                await self.send(text_data=json.dumps({
                    "type": "new_problem",
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
                        for sol in solutions_list
                    ],
                    "turn": game.current_turn,
                }))

                await asyncio.sleep(4)  # wait before spawning next problem

            except Exception as e:
                print("Error spawning problem:", e)
                await asyncio.sleep(4)
        
    # Filters problems who dont fit game state to speed up probability calculations
    async def filter_problems(self, game, problems):
        filtered_problems = await database_sync_to_async(lambda: list(problems.filter(
                min_budget_to_appear__lte=game.economy,
                max_budget_to_appear__gte=game.economy,
                min_citizen_satisfaction_to_appear__lte=game.citizen_satisfaction,
                max_citizen_satisfaction_to_appear__gte=game.citizen_satisfaction,
                min_environment_to_appear__lte=game.environment,
                max_environment_to_appear__gte=game.environment,
                min_military_to_appear__lte=game.military_power,
                max_military_to_appear__gte=game.military_power,
            )))()
        return filtered_problems
    
    # Caslculates the chance of a problem appearing based on a single indicator
    def indicator_probability_factor(self, indicator_val, min, max, tendency, bias):
        activity = True # If bias = 0, the problem does not account this indicator, so it's not counted in probability calculation
        dist_from_min = abs(indicator_val - min)
        dist_from_max = abs(indicator_val - max)
        max_min_dist = dist_from_max + dist_from_min

        if bias == 0:
            activity = False
            return (0, activity)
        elif max_min_dist == 0:
            return 100 * bias, activity
        elif tendency == 0: # Downward
            return (100 * (dist_from_max / max_min_dist)) * bias, activity
        else: # Upward
            return (100 * (dist_from_min / max_min_dist)) * bias, activity
    
    # Calculates the overall chance of a problem appearing based on all active indicators and problem rarity
    def calculate_problem_probability(self, game, problem):
        calculation_info = [
            (game.economy, problem.min_budget_to_appear, problem.max_budget_to_appear, problem.budget_tendency, problem.budget_bias),
            (game.citizen_satisfaction, problem.min_citizen_satisfaction_to_appear, problem.max_citizen_satisfaction_to_appear, problem.citizen_satisfaction_tendency, problem.citizen_satisfaction_bias),
            (game.environment, problem.min_environment_to_appear, problem.max_environment_to_appear, problem.environment_tendency, problem.environment_bias),
            (game.military_power, problem.min_military_to_appear, problem.max_military_to_appear, problem.military_tendency, problem.military_bias)
        ]
        factors = []

        for indicator_val, min_val, max_val, tendency, bias in calculation_info:
            factor, active = self.indicator_probability_factor(indicator_val, min_val, max_val, tendency, bias)
            if active:
                factors.append(factor)

        active_factors = len(factors)
        if active_factors == 0:
            return 0

        probability = (sum(factors) / active_factors) / max(1, problem.rarity)
        return probability

    
    async def choose_problem(self, game, problems):
        problems = await self.filter_problems(game, problems)
        print("set filtered")
        if not problems:
            return None, None
        
        while problems:
            problem_chances = []

            for prob in problems:
                problem_chances.append(self.calculate_problem_probability(game, prob))
            
            print("probabilities calculated")
            if sum(problem_chances) <= 0:
                return None, None

            problem = random.choices(problems, weights=problem_chances, k=1)[0]
            print(f"Chosen problem: {problem.name} with probability {problem_chances[problems.index(problem)]}%")
            possible_regions = await database_sync_to_async(lambda: list(problem.possible_regions.all()))()
            print(f"Possible regions for {problem.name}: {[nr.name for nr in possible_regions]}")
            regions = await database_sync_to_async(lambda: list(Region.objects.filter(game=game, name__in=[nr.name for nr in possible_regions], occupied=False)))()
            print(f"Available regions for {problem.name}: {[r.name for r in regions]}")
            if regions:
                region = random.choice(regions)
                possible_region = await database_sync_to_async(lambda: NameRegion.objects.get(name=region.name))()
                return problem, possible_region
            else:
                problems.remove(problem)

        return None, None