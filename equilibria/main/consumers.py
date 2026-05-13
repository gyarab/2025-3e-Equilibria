import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Game, NameRegion, Region, ProblemInstance, SolutionChoice
import asyncio
import random
from channels.db import database_sync_to_async

class GameConsumer(AsyncWebsocketConsumer):
    time_for_turn = 5
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
        game = await database_sync_to_async(Game.objects.get)(id=self.game_id)
        try:
            await self.update_highest_round(game)
        except Exception as e:
            print(f"Error updating highest round: {e}")
        await self.channel_layer.group_discard(
            self.game_group_name,
            self.channel_name
        )

    @database_sync_to_async
    def update_highest_round(self, game):
        if game.current_turn > game.player.highest_round:
            game.player.highest_round = game.current_turn
            game.player.save()

    async def receive(self, text_data):
        data = json.loads(text_data)
        solution_id = data.get("solution_id")
        region_id = data.get("region_id")
        asyncio.create_task(self.process_solution_task(solution_id, region_id))


    async def process_solution_task(self, solution_id, region_id):
        try:
            solution = await database_sync_to_async(SolutionChoice.objects.get)(id=solution_id)

            await asyncio.sleep(solution.time_before_effect * self.time_for_turn)

            @database_sync_to_async
            def apply_solution_to_db(g_id, r_id, sol):
                current_game = Game.objects.get(id=g_id)
                current_region = Region.objects.get(id=r_id)

                current_region.problem = None
                current_region.occupied = False
                current_region.save()

                current_game.economy = min(1000, current_game.economy + sol.budget_change)
                current_game.citizen_satisfaction = min(1000, current_game.citizen_satisfaction + sol.citizen_satisfaction_change)
                current_game.environment = min(1000, current_game.environment + sol.environment_change)
                current_game.military_power = min(1000, current_game.military_power + sol.military_change)
                current_game.save()

                return current_game

            updated_game = await apply_solution_to_db(self.game_id, region_id, solution)

            await self.send(text_data=json.dumps({
                "type": "update_state",
                "game": {
                    "economy": updated_game.economy,
                    "citizen_satisfaction": updated_game.citizen_satisfaction,
                    "environment": updated_game.environment,
                    "military_power": updated_game.military_power,
                    "current_turn": updated_game.current_turn,
                },
            }))

        except Exception as e:
            print(f"Error in process_solution_task: {e}")
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
                "current_turn": game.current_turn,
            },
        }))

    async def start_game_cycle(self):
        await asyncio.sleep(2)  # Wait a bit before first problem
        while True:
            try:
                game = await database_sync_to_async(lambda: Game.objects.get(id=self.game_id))()
                self.turn_start_changes(game)
                if self.check_game_over(game):
                    await self.send(text_data=json.dumps({
                        "type": "game_over",
                    }))
                    return
                problems = ProblemInstance.objects.all()
                game.current_turn += 1
                await self.send(text_data=json.dumps({
                    "type": "new_turn",
                    "current_turn": game.current_turn,
                }))
                await database_sync_to_async(lambda: game.save())()
                
                problem, region, region_name = await self.choose_problem(game, problems)
                if not problem:
                    await asyncio.sleep(self.time_for_turn)  # Wait before trying to spawn next problem
                    continue
                
                region.problem = problem
                region.occupied = True
                region.problem_expiration_turn = game.current_turn + problem.time_before_expiration
                await database_sync_to_async(lambda: region.save())()

                solutions_list = await database_sync_to_async(lambda: list(problem.solutions.all()))()
        
                # Send problem to frontend
                await self.send(text_data=json.dumps({
                    "type": "new_problem",
                    "problem": {
                        "id": problem.id,
                        "region_id": region.id,
                        "region_name_id": region_name.id,
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

                expired_problems = await self.handle_expired_problems(game)
                if expired_problems:
                    await self.send(text_data=json.dumps({
                        "type": "problems_expired",
                        "expired_problems": [region_name.id for region_name in expired_problems],
                        "game": {
                            "economy": game.economy,
                            "citizen_satisfaction": game.citizen_satisfaction,
                            "environment": game.environment,
                            "military_power": game.military_power,
                            "current_turn": game.current_turn,
                        },
                    }))

                await asyncio.sleep(self.time_for_turn)  # wait before spawning next problem

            except Exception as e:
                print("Error spawning problem:", e)
                await asyncio.sleep(self.time_for_turn)
        
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
        if not problems:
            return None, None
        
        while problems:
            problem_chances = []

            for prob in problems:
                problem_chances.append(self.calculate_problem_probability(game, prob))
            
            if sum(problem_chances) <= 0:
                return None, None

            problem = random.choices(problems, weights=problem_chances, k=1)[0]
            possible_regions = await database_sync_to_async(lambda: list(problem.possible_regions.all()))()
            regions = await database_sync_to_async(lambda: list(Region.objects.filter(game=game, name__in=[nr.name for nr in possible_regions], occupied=False)))()
            if regions:
                region = random.choice(regions)
                possible_region = await database_sync_to_async(lambda: NameRegion.objects.get(name=region.name))()
                return problem, region, possible_region
            else:
                problems.remove(problem)

        return None, None
    
    @database_sync_to_async
    def handle_expired_problems(self, game):
        regions = list(Region.objects.filter(game=game, occupied=True, problem_expiration_turn__lte=game.current_turn))
        expired_problems = []

        for region in regions:
            problem = region.problem
            name_region = NameRegion.objects.get(name=region.name)
            expired_problems.append(name_region)
            region.problem = None
            region.occupied = False
            region.problem_expiration_turn = None
            region.save()

            game.economy += problem.budget_expiration_change
            game.citizen_satisfaction += problem.citizen_satisfaction_expiration_change
            game.environment += problem.environment_expiration_change
            game.military_power += problem.military_expiration_change

        if expired_problems:
            game.save()
        return expired_problems
    
    def check_game_over(self, game):
        if game.economy <= 0 or game.citizen_satisfaction <= 0 or game.environment <= 0 or game.military_power <= 0:
            return True
        return False
    
    @database_sync_to_async
    def turn_start_changes(self, game):
        game.economy += 10
        game.environment -= 10
        game.save()