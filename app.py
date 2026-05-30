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
            "equipped_armor": armor_info
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
    "Shibuya Station": Location("Shibuya Station", "The bustling intersection of Tokyo, now empty and haunted by curses.", "Shibuya", 20, 30, ["Graveyard", "Cursed Site"]),
    "Graveyard": Location("Graveyard", "A dark graveyard where hollows and curses feed on residual spiritual energy.", "Shibuya", 15, 65, ["Shibuya Station", "Alleys"]),
    "Cursed Site": Location("Cursed Site", "An active cursed area. You can feel Sukuna's energy lingering here.", "Shibuya", 45, 40, ["Shibuya Station", "Alleys"]),
    "Alleys": Location("Alleys", "Narrow dark alleys. High probability of low-tier curses spawning.", "Shibuya", 30, 80, ["Graveyard", "Cursed Site"]),
}

class MoveRequest(BaseModel):
    destination: str

@app.get("/api/map")
def get_map():
    return {name: loc.to_dict() for name, loc in locations_db.items()}

@app.post("/api/player/move")
def move_player(req: MoveRequest):
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
    return {"message": f"Moved to {dest}", "state": get_state()}


if __name__ == "__main__":

    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
