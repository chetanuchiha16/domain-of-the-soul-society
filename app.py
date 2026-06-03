from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import random

from models import Player, Weapon, Armor, Consumable, Enemy, Location

app = FastAPI(title="Domain of the Soul Society API", version="1.0.0")

# Enable CORS for the React/Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global in-memory game state
class GameState:
    def __init__(self):
        self.player = Player(name="Ichigo")
        self.current_enemies: List[Enemy] = []
        self.combat_log: List[str] = []

state = GameState()

# Request schemas
class EquipRequest(BaseModel):
    item_name: str

class UseItemRequest(BaseModel):
    item_name: str

# Endpoints
@app.get("/api/state")
def get_state():
    p = state.player
    weapon_info = {
        "name": p.equipped_weapon.name,
        "attack_bonus": p.equipped_weapon.attack_bonus,
        "description": p.equipped_weapon.description
    } if p.equipped_weapon else None

    armor_info = {
        "name": p.equipped_armor.name,
        "defense_bonus": p.equipped_armor.defense_bonus,
        "description": p.equipped_armor.description
    } if p.equipped_armor else None

    inventory_info = []
    for item in p.inventory:
        info = {
            "name": item.name,
            "description": item.description,
            "item_type": item.item_type,
            "value": item.value
        }
        if isinstance(item, Weapon):
            info["attack_bonus"] = item.attack_bonus
        elif isinstance(item, Armor):
            info["defense_bonus"] = item.defense_bonus
        elif isinstance(item, Consumable):
            info["heal_hp"] = item.heal_hp
            info["restore_energy"] = item.restore_energy
        inventory_info.append(info)

    return {
        "player": {
            "name": p.name,
            "hp": p.hp,
            "max_hp": p.max_hp,
            "attack_power": p.attack_power,
            "base_attack_power": p._attack_power,
            "energy": p.energy,
            "max_energy": p.max_energy,
            "level": p.level,
            "xp": p.xp,
            "gold": p.gold,
            "inventory": inventory_info,
            "summons": p.summons,
            "equipped_weapon": weapon_info,
            "equipped_armor": armor_info,
            "current_location": p.current_location
        },
        "combat": {
            "enemies": [
                {
                    "name": e.name,
                    "hp": e.hp,
                    "max_hp": e.max_hp,
                    "attack_power": e.attack_power,
                    "xp_reward": e.xp_reward,
                    "gold_reward": e.gold_reward
                } for e in state.current_enemies
            ],
            "log": state.combat_log
        }
    }

@app.post("/api/player/reset")
def reset_player(name: Optional[str] = "Ichigo"):
    state.player = Player(name=name)
    state.current_enemies = []
    state.combat_log = ["A new journey begins."]
    return get_state()

@app.post("/api/player/equip")
def equip_item(req: EquipRequest):
    p = state.player
    for item in p.inventory:
        if item.name.lower() == req.item_name.lower():
            if item.item_type in ["weapon", "armor"]:
                p.equip(item)
                return {"message": f"Successfully equipped {item.name}", "state": get_state()}
    raise HTTPException(status_code=400, detail="Item not found or not equippable.")

@app.post("/api/player/use")
def use_item(req: UseItemRequest):
    success = state.player.use_item(req.item_name)
    if success:
        return {"message": f"Used {req.item_name}", "state": get_state()}
    raise HTTPException(status_code=400, detail="Consumable item not found.")

@app.post("/api/explore/dungeon")
def explore_dungeon():
    if state.current_enemies:
        raise HTTPException(status_code=400, detail="Cannot explore while engaged in combat!")
    findings = ["⚔", "🛡", "gojo", "shunsui", "health_potion"]
    found = random.choice(findings)
    p = state.player
    log_msg = ""

    if found == "⚔":
        atk_bonus = random.randint(5, 15)
        item = Weapon("Zanpakuto", "A soul-cutter sword", attack_bonus=atk_bonus)
        p.add_item(item)
        p.equip(item)
        log_msg = f"Found and equipped Zanpakuto (+{atk_bonus} ATK)"
    elif found == "🛡":
        def_bonus = random.randint(3, 8)
        item = Armor("Shinobi Shozoku", "Traditional stealth armor", defense_bonus=def_bonus)
        p.add_item(item)
        p.equip(item)
        log_msg = f"Found and equipped Shinobi Shozoku (+{def_bonus} DEF)"
    elif found == "health_potion":
        item = Consumable("Health Potion", "Restores 50 HP", heal_hp=50)
        p.add_item(item)
        log_msg = "Found a Health Potion (Consumable)"
    elif found in ["gojo", "shunsui"]:
        p.summons.append(found)
        log_msg = f"Gained a summon seal for {found.capitalize()}!"
    
    return {"found": found, "log": log_msg, "state": get_state()}


import json
import os

SAVE_FILE = "savegame.json"

@app.post("/api/game/save")
def save_game():
    data = {
        "player": state.player.to_dict(),
        "combat_log": state.combat_log
    }
    with open(SAVE_FILE, "w") as f:
        json.dump(data, f, indent=4)
    return {"message": "Game saved successfully"}

@app.post("/api/game/load")
def load_game():
    if not os.path.exists(SAVE_FILE):
        raise HTTPException(status_code=404, detail="Save file not found")
    try:
        with open(SAVE_FILE, "r") as f:
            data = json.load(f)
        state.player = Player.from_dict(data["player"])
        state.combat_log = data.get("combat_log", [])
        state.current_enemies = []
        return {"message": "Game loaded successfully", "state": get_state()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading game: {str(e)}")

locations_db = {
    "Shibuya Station": Location("Shibuya Station", "The bustling intersection of Tokyo, now empty and haunted by curses.", "Shibuya", 15, 30, ["Graveyard", "Cursed Site", "Senkaimon"]),
    "Graveyard": Location("Graveyard", "A dark graveyard where hollows and curses feed on residual spiritual energy.", "Shibuya", 10, 65, ["Shibuya Station", "Alleys"]),
    "Cursed Site": Location("Cursed Site", "An active cursed area. You can feel Sukuna's energy lingering here.", "Shibuya", 35, 40, ["Shibuya Station", "Alleys"]),
    "Alleys": Location("Alleys", "Narrow dark alleys. High probability of low-tier curses spawning.", "Shibuya", 25, 80, ["Graveyard", "Cursed Site"]),
    
    "Senkaimon": Location("Senkaimon", "The sliding wooden gateway connecting the human world to the Soul Society.", "Soul Society", 50, 30, ["Shibuya Station", "Rukongai District", "Gotei 13 Barracks", "Garganta Crossing"]),
    "Rukongai District": Location("Rukongai District", "The outer districts where souls live. Peaceful but vulnerable to stray hollows.", "Soul Society", 62, 65, ["Senkaimon", "Execution Hill"]),
    "Gotei 13 Barracks": Location("Gotei 13 Barracks", "The military division headquarters. Soul Reapers train and mobilize here.", "Soul Society", 75, 20, ["Senkaimon", "Execution Hill"]),
    "Execution Hill": Location("Execution Hill", "Sokyoku Hill. A high peak where executions take place under the giant phoenix stand.", "Soul Society", 88, 50, ["Rukongai District", "Gotei 13 Barracks"]),
    
    "Garganta Crossing": Location("Garganta Crossing", "A dark, void-like dimensional tear between worlds.", "Hueco Mundo", 50, 70, ["Senkaimon", "Las Noches Dunes"]),
    "Las Noches Dunes": Location("Las Noches Dunes", "An endless desert of white sand under a perpetual crescent moon.", "Hueco Mundo", 70, 85, ["Garganta Crossing", "Menos Forest", "Las Noches Throne Room"]),
    "Menos Forest": Location("Menos Forest", "The subterranean forest below the desert dunes, crawling with Menos-class hollows.", "Hueco Mundo", 82, 92, ["Las Noches Dunes", "Las Noches Throne Room"]),
    "Las Noches Throne Room": Location("Las Noches Throne Room", "The grand dome fortress. Aizen's vacant throne resides at the center.", "Hueco Mundo", 90, 75, ["Las Noches Dunes", "Menos Forest"]),
}

class MoveRequest(BaseModel):
    destination: str

@app.get("/api/map")
def get_map():
    return {name: loc.to_dict() for name, loc in locations_db.items()}

@app.post("/api/player/move")
def move_player(req: MoveRequest):
    if state.current_enemies:
        raise HTTPException(status_code=400, detail="Cannot move while engaged in combat!")
        
    p = state.player
    dest = req.destination
    if dest not in locations_db:
        raise HTTPException(status_code=404, detail="Location not found")
    
    current_loc = locations_db.get(p.current_location)
    if not current_loc:
        p.current_location = dest
        return {"message": f"Moved to {dest}", "state": get_state()}
    
    if dest not in current_loc.connections and dest != p.current_location:
        raise HTTPException(status_code=400, detail=f"Cannot move to {dest} from {p.current_location}")
        
    p.current_location = dest
    log_msg = f"Navigated to {dest}."
    
    # Roll for encounter based on destination
    encounter_rates = {
        "Shibuya Station": 0.20,
        "Graveyard": 0.60,
        "Cursed Site": 0.70,
        "Alleys": 0.50,
        "Senkaimon": 0.30,
        "Rukongai District": 0.40,
        "Gotei 13 Barracks": 0.25,
        "Execution Hill": 0.50,
        "Garganta Crossing": 0.35,
        "Las Noches Dunes": 0.45,
        "Menos Forest": 0.60,
        "Las Noches Throne Room": 0.50
    }
    
    rate = encounter_rates.get(dest, 0.30)
    if random.random() < rate:
        # Spawn location specific enemy
        enemy_pool = {
            "Shibuya Station": [
                {"name": "Fly Head Curse", "hp": 30, "atk": 6, "xp": 20, "gold": 10}
            ],
            "Graveyard": [
                {"name": "Gillian Hollow", "hp": 90, "atk": 16, "xp": 50, "gold": 25},
                {"name": "Demi-Hollow", "hp": 40, "atk": 8, "xp": 25, "gold": 12}
            ],
            "Cursed Site": [
                {"name": "Sukuna Fragment Guard", "hp": 80, "atk": 14, "xp": 45, "gold": 20},
                {"name": "Cursed Swarm", "hp": 50, "atk": 10, "xp": 30, "gold": 15}
            ],
            "Alleys": [
                {"name": "Low-grade Curse", "hp": 35, "atk": 7, "xp": 20, "gold": 8}
            ],
            "Senkaimon": [
                {"name": "Gatekeeper Jidanbo", "hp": 90, "atk": 14, "xp": 40, "gold": 20}
            ],
            "Rukongai District": [
                {"name": "Stray Hollow", "hp": 50, "atk": 10, "xp": 30, "gold": 15},
                {"name": "Rogue Shinigami", "hp": 75, "atk": 13, "xp": 35, "gold": 18}
            ],
            "Gotei 13 Barracks": [
                {"name": "Squad Member", "hp": 80, "atk": 15, "xp": 45, "gold": 20},
                {"name": "Squad Lieutenant", "hp": 130, "atk": 22, "xp": 70, "gold": 40}
            ],
            "Execution Hill": [
                {"name": "Sokyoku Sentinel", "hp": 160, "atk": 25, "xp": 100, "gold": 50}
            ],
            "Garganta Crossing": [
                {"name": "Hollow Scout", "hp": 80, "atk": 16, "xp": 50, "gold": 25}
            ],
            "Las Noches Dunes": [
                {"name": "Menos Grande", "hp": 180, "atk": 24, "xp": 120, "gold": 60},
                {"name": "Stray Arrancar", "hp": 120, "atk": 20, "xp": 90, "gold": 45}
            ],
            "Menos Forest": [
                {"name": "Hollow Adjuchas", "hp": 200, "atk": 28, "xp": 150, "gold": 75}
            ],
            "Las Noches Throne Room": [
                {"name": "Espada Replica", "hp": 250, "atk": 32, "xp": 200, "gold": 100}
            ]
        }
        
        pool = enemy_pool.get(dest, [{"name": "Stray Hollow", "hp": 45, "atk": 9, "xp": 25, "gold": 10}])
        chosen = random.choice(pool)
        
        enemy = Enemy(
            name=chosen["name"],
            hp=chosen["hp"],
            attack_power=chosen["atk"],
            xp_reward=chosen["xp"],
            gold_reward=chosen["gold"]
        )
        state.current_enemies = [enemy]
        encounter_log = f"WARNING! Encounted a wild {enemy.name} in {dest}!"
        state.combat_log = [encounter_log] + state.combat_log
        log_msg = f"Moved to {dest}. {encounter_log}"
        
    return {"message": log_msg, "state": get_state()}

@app.post("/api/combat/attack")
def combat_attack():
    if not state.current_enemies:
        raise HTTPException(status_code=400, detail="No active combat.")
    
    enemy = state.current_enemies[0]
    p = state.player
    
    # Player attacks enemy
    p_dmg = p.attack_power
    enemy.hp -= p_dmg
    log = [f"{p.name} slashed {enemy.name} for {p_dmg} damage!"]
    
    if enemy.hp <= 0:
        log.append(f"Defeated {enemy.name}! Gained {enemy.xp_reward} XP and {enemy.gold_reward} Gold.")
        p.xp += enemy.xp_reward
        p.gold += enemy.gold_reward
        # Level up check
        if p.xp >= p.level * 100:
            p.xp -= p.level * 100
            p.level += 1
            p.max_hp += 20
            p.hp = p.max_hp
            log.append(f"LEVEL UP! Reached level {p.level}!")
        state.current_enemies = []
    else:
        # Enemy counter attacks
        e_dmg = enemy.attack_power
        actual_dmg = p.take_damage(e_dmg)
        log.append(f"{enemy.name} counter-attacks for {actual_dmg} damage (Armor absorbed {e_dmg - actual_dmg}).")
        if p.hp <= 0:
            p.hp = 0
            log.append("You have been defeated! Respawning at Shibuya Station.")
            p.current_location = "Shibuya Station"
            p.hp = p.max_hp // 2
            state.current_enemies = []
            
    state.combat_log = log + state.combat_log
    return {"message": "Attack executed", "state": get_state()}

@app.post("/api/combat/run")
def combat_run():
    if not state.current_enemies:
        raise HTTPException(status_code=400, detail="No active combat.")
    
    enemy = state.current_enemies[0]
    p = state.player
    
    # 50% chance to run away successfully
    if random.random() < 0.5:
        state.current_enemies = []
        msg = f"Escaped from {enemy.name} back to Shibuya Station!"
        p.current_location = "Shibuya Station"
        state.combat_log = [msg] + state.combat_log
        return {"message": msg, "state": get_state()}
    else:
        # Fail to escape: enemy attacks
        e_dmg = enemy.attack_power
        actual_dmg = p.take_damage(e_dmg)
        log = [
            f"Failed to escape from {enemy.name}!",
            f"{enemy.name} attacks you for {actual_dmg} damage (Armor absorbed {e_dmg - actual_dmg})."
        ]
        if p.hp <= 0:
            p.hp = 0
            log.append("You have been defeated! Respawning at Shibuya Station.")
            p.current_location = "Shibuya Station"
            p.hp = p.max_hp // 2
            state.current_enemies = []
            
        state.combat_log = log + state.combat_log
        return {"message": "Escape failed", "state": get_state()}


if __name__ == "__main__":

    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
