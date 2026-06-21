from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import random

from models import Player, Weapon, Armor, Consumable, Enemy, Location, Summon

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
        self.combat_victory_rewards = None
        self.active_summon: Optional[Summon] = None

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
            "current_location": p.current_location,
            "status_effects": p.status_effects
        },
        "combat": {
            "enemies": [
                {
                    "name": e.name,
                    "hp": e.hp,
                    "max_hp": e.max_hp,
                    "attack_power": e.attack_power,
                    "xp_reward": e.xp_reward,
                    "gold_reward": e.gold_reward,
                    "next_intent": e.next_intent,
                    "target": getattr(e, "target", "player"),
                    "status_effects": e.status_effects
                } for e in state.current_enemies
            ],
            "active_summon": state.active_summon.to_dict() if state.active_summon else None,
            "log": state.combat_log
        },
        "victory_rewards": state.combat_victory_rewards
    }

@app.post("/api/player/reset")
def reset_player(name: Optional[str] = "Ichigo"):
    state.player = Player(name=name)
    state.player.gold = 100
    state.current_enemies = []
    state.combat_log = ["A new journey begins."]
    state.combat_victory_rewards = None
    state.active_summon = None
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
                {"name": "Cursed Swarm", "hp": 50, "atk": 10, "xp": 30, "gold": 15},
                {"name": "Ryomen Sukuna", "hp": 400, "atk": 35, "xp": 500, "gold": 250}
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
                {"name": "Espada Replica", "hp": 250, "atk": 32, "xp": 200, "gold": 100},
                {"name": "Sosuke Aizen", "hp": 450, "atk": 40, "xp": 600, "gold": 350}
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

def resolve_status_effects(entity, log):
    """
    Executes start-of-turn status effect updates (e.g. burn damage).
    Returns True if the entity is frozen (stunned) and should skip their action.
    """
    frozen = False
    new_effects = []
    
    for effect in entity.status_effects:
        name = effect.get("name")
        turns = effect.get("turns", 0)
        value = effect.get("value", 0)
        icon = effect.get("icon", "")
        
        # Apply start-of-turn effects
        if name == "Burned":
            entity.hp -= value
            log.append(f"🔥 {entity.name} takes {value} burn damage from the flames ({turns} turns left)!")
        elif name == "Frozen":
            frozen = True
            log.append(f"❄️ {entity.name} is Frozen solid and cannot act ({turns} turns left)!")
            
        turns -= 1
        
        if turns > 0:
            if name == "Shielded" and value <= 0:
                log.append(f"🛡️ {entity.name}'s Soul Shield broke!")
            else:
                effect["turns"] = turns
                new_effects.append(effect)
        else:
            log.append(f"✨ {entity.name}'s {icon} {name} status has worn off.")
            
    entity.status_effects = new_effects
    return frozen

def enemy_turn(p, enemy, log):
    # Resolve enemy status effects at start of turn
    enemy_frozen = resolve_status_effects(enemy, log)
    
    if enemy.hp <= 0:
        # Might die from Burned!
        return
        
    if not enemy_frozen:
        intent = enemy.next_intent
        
        # Check if enemy is Weakened
        is_weakened = any(eff.get("name") == "Weakened" for eff in enemy.status_effects)
        
        # Determine target entity
        target_entity = p
        target_name = p.name
        is_summon = False
        if state.active_summon and getattr(enemy, "target", "player") == "summon":
            target_entity = state.active_summon
            target_name = state.active_summon.name
            is_summon = True

        if intent == "ATTACK":
            e_dmg = enemy.attack_power
            if is_weakened:
                e_dmg = int(e_dmg * 0.7)
                log.append(f"🩸 {enemy.name} is Weakened! Attack power reduced.")
            actual_dmg = target_entity.take_damage(e_dmg)
            if is_summon:
                log.append(f"{enemy.name} counter-attacks summon {target_name} for {actual_dmg} damage!")
            else:
                log.append(f"{enemy.name} counter-attacks for {actual_dmg} damage (Armor absorbed {e_dmg - actual_dmg}).")
        elif intent == "HEAVY_ATTACK":
            e_dmg = int(enemy.attack_power * 1.8)
            if is_weakened:
                e_dmg = int(e_dmg * 0.7)
                log.append(f"🩸 {enemy.name} is Weakened! Attack power reduced.")
            actual_dmg = target_entity.take_damage(e_dmg)
            if is_summon:
                log.append(f"💥 {enemy.name} unleashes a Heavy Strike on summon {target_name}! Deals {actual_dmg} critical damage!")
            else:
                log.append(f"💥 {enemy.name} unleashes a Heavy Strike! Deals {actual_dmg} critical damage (Armor absorbed {e_dmg - actual_dmg})!")
        elif intent == "HEAL":
            heal_amt = 35
            enemy.hp += heal_amt
            log.append(f"💚 {enemy.name} channels spiritual essence and heals for {heal_amt} HP!")
        elif intent == "CURSE":
            drain_amt = 15
            p.energy -= drain_amt
            e_dmg = int(enemy.attack_power * 0.5)
            if is_weakened:
                e_dmg = int(e_dmg * 0.7)
                log.append(f"🩸 {enemy.name} is Weakened! Attack power reduced.")
            actual_dmg = target_entity.take_damage(e_dmg)
            if is_summon:
                log.append(f"⚡ {enemy.name} chants a Curse on summon {target_name}! Drains {drain_amt} of player's Reiryoku and deals {actual_dmg} damage!")
            else:
                log.append(f"⚡ {enemy.name} chants a Curse! Drains {drain_amt} of your Reiryoku and deals {actual_dmg} damage!")
            
            # Apply Weakened to target
            if random.random() < 0.5:
                if not any(eff.get("name") == "Weakened" for eff in target_entity.status_effects):
                    target_entity.status_effects.append({"name": "Weakened", "turns": 2, "value": 30, "icon": "🩸"})
                    log.append(f"🩸 {target_name} has been inflicted with Weakened status for 2 turns!")
        else:
            e_dmg = enemy.attack_power
            if is_weakened:
                e_dmg = int(e_dmg * 0.7)
            actual_dmg = target_entity.take_damage(e_dmg)
            log.append(f"{enemy.name} counter-attacks {target_name} for {actual_dmg} damage.")

        # Check if active summon was defeated
        if state.active_summon and state.active_summon.hp <= 0:
            log.append(f"💀 Summon {state.active_summon.name} has been defeated and returned to the spirit world!")
            state.active_summon = None
    else:
        log.append(f"⏳ {enemy.name} skipped turn due to status effects.")

    if p.hp <= 0:
        p.hp = 0
        log.append("You have been defeated! Respawning at Shibuya Station.")
        p.current_location = "Shibuya Station"
        p.hp = p.max_hp // 2
        state.current_enemies = []
        state.active_summon = None
        
    enemy.prepare_next_intent(has_summon=(state.active_summon is not None))

def resolve_summon_turn(p, enemy, log):
    if not state.active_summon:
        return False
        
    summon = state.active_summon
    
    # Resolve summon status effects
    summon_frozen = resolve_status_effects(summon, log)
    
    if summon.hp <= 0:
        # Might die from status effects
        log.append(f"💀 Summon {summon.name} has been defeated by status effects!")
        state.active_summon = None
        return False
        
    if not summon_frozen:
        r = random.random()
        if "Gojo" in summon.name:
            if r < 0.50:
                dmg = 45
                enemy.take_damage(dmg)
                log.append(f"🔴 Satoru Gojo fires a Cursed Technique Reversal: Red! Deals {dmg} damage to {enemy.name}!")
            elif r < 0.80:
                dmg = 60
                enemy.take_damage(dmg)
                log.append(f"⚡ Satoru Gojo lands a critical Black Flash! Deals {dmg} heavy damage to {enemy.name}!")
            else:
                heal_summon = 40
                heal_player = 20
                summon.hp += heal_summon
                p.hp += heal_player
                log.append(f"🔄 Satoru Gojo uses Reverse Cursed Technique! Heals himself for {heal_summon} HP and restores {heal_player} HP to {p.name}!")
        elif "Shunsui" in summon.name:
            if r < 0.60:
                dmg = 35
                enemy.take_damage(dmg)
                log.append(f"⚔️ Shunsui Kyoraku executes a Takaoni shadow slash! Deals {dmg} damage to {enemy.name}!")
            else:
                dmg = 50
                enemy.take_damage(dmg)
                # Apply weakened
                if not any(eff.get("name") == "Weakened" for eff in enemy.status_effects):
                    enemy.status_effects.append({"name": "Weakened", "turns": 2, "value": 30, "icon": "🩸"})
                log.append(f"🌸 Shunsui Kyoraku shadow plunge! Deals {dmg} damage and weakens {enemy.name}!")
    else:
        log.append(f"⏳ Summon {summon.name} is Frozen and skipped their turn.")
        
    # Decrement duration
    summon.turns_left -= 1
    
    if enemy.hp <= 0:
        handle_enemy_defeat(p, enemy, log)
        return True
        
    if summon.turns_left <= 0:
        log.append(f"✨ {summon.name}'s spiritual energy disperses, and they return to their seal.")
        state.active_summon = None
    else:
        log.append(f"⏳ Summon {summon.name} has {summon.turns_left} turns remaining in battle.")
        
    return False

def handle_enemy_defeat(p, enemy, log):
    log.append(f"Defeated {enemy.name}! Gained {enemy.xp_reward} XP and {enemy.gold_reward} Gold.")
    p.xp += enemy.xp_reward
    p.gold += enemy.gold_reward
    
    # 40% chance of random item drop
    dropped_item = None
    if random.random() < 0.40:
        catalog_items = list(shop_catalog.values())
        chosen = random.choice(catalog_items)
        if chosen.item_type == "weapon":
            dropped_item = Weapon(chosen.name, chosen.description, chosen.attack_bonus, chosen.value)
        elif chosen.item_type == "armor":
            dropped_item = Armor(chosen.name, chosen.description, chosen.defense_bonus, chosen.value)
        else:
            dropped_item = Consumable(chosen.name, chosen.description, chosen.heal_hp, chosen.restore_energy, getattr(chosen, 'effect', None), chosen.value)
        p.add_item(dropped_item)
        log.append(f"🎁 Found a drop: {dropped_item.name}!")
        
    state.combat_victory_rewards = {
        "enemy_name": enemy.name,
        "xp_reward": enemy.xp_reward,
        "gold_reward": enemy.gold_reward,
        "item_reward": dropped_item.to_dict() if dropped_item else None,
        "player_level_up": True if p.xp >= p.level * 100 else False
    }
    
    # Level up check
    if p.xp >= p.level * 100:
        p.xp -= p.level * 100
        p.level += 1
        p.max_hp += 25
        p._attack_power += 5
        p.hp = p.max_hp
        log.append(f"🎉 LEVEL UP! Reached level {p.level}! Max HP is now {p.max_hp}, and Base Attack increased by 5!")
        
    state.current_enemies = []

@app.post("/api/combat/attack")
def combat_attack():
    if not state.current_enemies:
        raise HTTPException(status_code=400, detail="No active combat.")
    
    enemy = state.current_enemies[0]
    p = state.player
    log = []
    
    # Player's turn status resolution
    player_frozen = resolve_status_effects(p, log)
    
    if p.hp <= 0:
        p.hp = 0
        log.append("You succumbed to status effects (Burned) and have been defeated! Respawning at Shibuya Station.")
        p.current_location = "Shibuya Station"
        p.hp = p.max_hp // 2
        state.current_enemies = []
        state.combat_log = log + state.combat_log
        return {"message": "Defeated by status effects", "state": get_state()}
        
    if not player_frozen:
        is_weakened = any(eff.get("name") == "Weakened" for eff in p.status_effects)
        is_crit = random.random() < 0.15
        p_dmg = p.attack_power
        if is_crit:
            p_dmg = int(p_dmg * 2.0)
        if is_weakened:
            p_dmg = int(p_dmg * 0.7)
            log.append(f"🩸 {p.name} is Weakened! Attack power reduced.")
        
        enemy.hp -= p_dmg
        if is_crit:
            log.append(f"✨ BLACK FLASH! {p.name} struck {enemy.name} for {p_dmg} critical damage!")
        else:
            log.append(f"{p.name} slashed {enemy.name} for {p_dmg} damage!")
    else:
        log.append(f"⏳ {p.name} skipped turn due to status effects.")
    
    if enemy.hp <= 0:
        handle_enemy_defeat(p, enemy, log)
    else:
        # Resolve summon turn
        enemy_killed = resolve_summon_turn(p, enemy, log)
        if not enemy_killed:
            # Enemy counter attacks using dynamic behaviors
            enemy_turn(p, enemy, log)
            if enemy.hp <= 0:
                # Handle death from Burned at start of enemy turn
                handle_enemy_defeat(p, enemy, log)
            
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
        # Fail to escape: enemy attacks using dynamic behaviors
        log = [f"Failed to escape from {enemy.name}!"]
        enemy_turn(p, enemy, log)
        state.combat_log = log + state.combat_log
        return {"message": "Escape failed", "state": get_state()}

class KidoRequest(BaseModel):
    spell_name: str

class SummonRequest(BaseModel):
    summon_name: str

class CombatItemRequest(BaseModel):
    item_name: str

@app.post("/api/combat/kido")
def combat_kido(req: KidoRequest):
    if not state.current_enemies:
        raise HTTPException(status_code=400, detail="No active combat.")
    
    enemy = state.current_enemies[0]
    p = state.player
    spell = req.spell_name.lower()
    log = []
    
    # Player's turn status resolution
    player_frozen = resolve_status_effects(p, log)
    
    if p.hp <= 0:
        p.hp = 0
        log.append("You succumbed to status effects (Burned) and have been defeated! Respawning at Shibuya Station.")
        p.current_location = "Shibuya Station"
        p.hp = p.max_hp // 2
        state.current_enemies = []
        state.combat_log = log + state.combat_log
        return {"message": "Defeated by status effects", "state": get_state()}
        
    if not player_frozen:
        if spell == "shakkaho":
            cost = 15
            if p.energy < cost:
                raise HTTPException(status_code=400, detail="Insufficient Reiryoku (energy).")
            p.energy -= cost
            
            is_weakened = any(eff.get("name") == "Weakened" for eff in p.status_effects)
            dmg = int(p.attack_power * 1.5)
            if is_weakened:
                dmg = int(dmg * 0.7)
                log.append(f"🩸 {p.name} is Weakened! Hadō damage reduced.")
                
            enemy.hp -= dmg
            log.append(f"{p.name} cast Hadō #31: Shakkahō! Red flames burst out dealing {dmg} damage!")
            
            # 75% chance to apply Burned status
            if random.random() < 0.75:
                if not any(eff.get("name") == "Burned" for eff in enemy.status_effects):
                    burn_dmg = 5 + p.level * 2
                    enemy.status_effects.append({"name": "Burned", "turns": 3, "value": burn_dmg, "icon": "🔥"})
                    log.append(f"🔥 {enemy.name} is set ablaze with Burned status for 3 turns ({burn_dmg} DMG/turn)!")
                    
        elif spell == "kaido":
            cost = 20
            if p.energy < cost:
                raise HTTPException(status_code=400, detail="Insufficient Reiryoku (energy).")
            p.energy -= cost
            heal = p.level * 20 + 20
            p.hp = min(p.max_hp, p.hp + heal)
            log.append(f"{p.name} cast Kaidō! Soft green spiritual energy heals {heal} HP.")
            
            # Cleanse debuffs
            p.status_effects = [eff for eff in p.status_effects if eff.get("name") not in ["Weakened", "Burned"]]
            log.append(f"💚 Kaidō cleansed {p.name}'s physical and spiritual debuffs!")
        else:
            raise HTTPException(status_code=400, detail="Unknown spell.")
    else:
        log.append(f"⏳ {p.name} skipped turn due to status effects.")
        
    if enemy.hp <= 0:
        handle_enemy_defeat(p, enemy, log)
    else:
        # Resolve summon turn
        enemy_killed = resolve_summon_turn(p, enemy, log)
        if not enemy_killed:
            # Enemy counter attacks using dynamic behaviors
            enemy_turn(p, enemy, log)
            if enemy.hp <= 0:
                handle_enemy_defeat(p, enemy, log)
            
    state.combat_log = log + state.combat_log
    return {"message": "Kido cast successfully", "state": get_state()}

@app.post("/api/combat/summon")
def combat_summon(req: SummonRequest):
    if not state.current_enemies:
        raise HTTPException(status_code=400, detail="No active combat.")
    
    enemy = state.current_enemies[0]
    p = state.player
    summon = req.summon_name.lower()
    
    if summon not in [s.lower() for s in p.summons]:
        raise HTTPException(status_code=400, detail="Summon seal not found in inventory.")
        
    cost = 40
    if p.energy < cost:
        raise HTTPException(status_code=400, detail="Insufficient Reiryoku (energy).")
        
    log = []
    
    # Player's turn status resolution
    player_frozen = resolve_status_effects(p, log)
    
    if p.hp <= 0:
        p.hp = 0
        log.append("You succumbed to status effects (Burned) and have been defeated! Respawning at Shibuya Station.")
        p.current_location = "Shibuya Station"
        p.hp = p.max_hp // 2
        state.current_enemies = []
        state.combat_log = log + state.combat_log
        return {"message": "Defeated by status effects", "state": get_state()}
        
    if not player_frozen:
        p.energy -= cost
        if summon == "gojo":
            state.active_summon = Summon("Satoru Gojo", 120, 45, 3)
            dmg = 100
            enemy.hp -= dmg
            log.append(f"{p.name} summoned Satoru Gojo! Domain Expansion: Infinite Void freezes the enemy, dealing {dmg} absolute damage!")
            
            # Freeze enemy for 2 turns
            enemy.status_effects = [eff for eff in enemy.status_effects if eff.get("name") != "Frozen"]
            enemy.status_effects.append({"name": "Frozen", "turns": 2, "value": 0, "icon": "❄️"})
            log.append(f"❄️ Infinite Void has frozen {enemy.name} solid for 2 turns!")
            
        elif summon == "shunsui":
            state.active_summon = Summon("Shunsui Kyoraku", 100, 35, 3)
            dmg = 70
            enemy.hp -= dmg
            log.append(f"{p.name} summoned Shunsui Kyoraku! Kageoni strikes from the shadows, dealing {dmg} shadow damage!")
            
            # Weaken enemy for 2 turns
            enemy.status_effects = [eff for eff in enemy.status_effects if eff.get("name") != "Weakened"]
            enemy.status_effects.append({"name": "Weakened", "turns": 2, "value": 30, "icon": "🩸"})
            log.append(f"🩸 Shunsui Kyoraku's shadow play has weakened {enemy.name} for 2 turns!")
        else:
            raise HTTPException(status_code=400, detail="Unknown summon.")
    else:
        log.append(f"⏳ {p.name} skipped turn due to status effects.")
        
    if enemy.hp <= 0:
        handle_enemy_defeat(p, enemy, log)
    else:
        # Enemy counter attacks using dynamic behaviors
        enemy_turn(p, enemy, log)
        if enemy.hp <= 0:
            handle_enemy_defeat(p, enemy, log)
            
    state.combat_log = log + state.combat_log
    return {"message": "Summon executed", "state": get_state()}

@app.post("/api/combat/item")
def combat_item(req: CombatItemRequest):
    if not state.current_enemies:
        raise HTTPException(status_code=400, detail="No active combat.")
        
    enemy = state.current_enemies[0]
    p = state.player
    log = []
    
    # Player's turn status resolution
    player_frozen = resolve_status_effects(p, log)
    
    if p.hp <= 0:
        p.hp = 0
        log.append("You succumbed to status effects (Burned) and have been defeated! Respawning at Shibuya Station.")
        p.current_location = "Shibuya Station"
        p.hp = p.max_hp // 2
        state.current_enemies = []
        state.combat_log = log + state.combat_log
        return {"message": "Defeated by status effects", "state": get_state()}
        
    if not player_frozen:
        success = p.use_item(req.item_name)
        if not success:
            raise HTTPException(status_code=400, detail="Consumable item not found in inventory.")
            
        log.append(f"{p.name} used {req.item_name} in combat.")
    else:
        log.append(f"⏳ {p.name} skipped turn due to status effects.")
        
    # Resolve summon turn
    enemy_killed = resolve_summon_turn(p, enemy, log)
    if not enemy_killed:
        # Enemy counter attacks because using an item took the player's turn
        enemy_turn(p, enemy, log)
        if enemy.hp <= 0:
            handle_enemy_defeat(p, enemy, log)
        
    state.combat_log = log + state.combat_log
    return {"message": f"Used {req.item_name}", "state": get_state()}

# Urahara Shop Catalog
shop_catalog = {
    "health_potion": Consumable("Health Potion", "Restores 50 HP", heal_hp=50, restore_energy=0, value=15),
    "spirit_pill": Consumable("Spirit Pill", "Restores 40 Reiryoku", heal_hp=0, restore_energy=40, value=25),
    "shield_scroll": Consumable("Shield Scroll", "Generates a barrier that absorbs 40 damage. Lasts 3 turns.", heal_hp=0, restore_energy=0, effect={"name": "Shielded", "turns": 3, "value": 40, "icon": "🛡️"}, value=30),
    "frost_scroll": Consumable("Frost Scroll", "Freezes the enemy solid for 1 turn.", heal_hp=0, restore_energy=0, effect={"name": "Frozen", "turns": 1, "value": 0, "icon": "❄️"}, value=40),
    "training_sword": Weapon("Wooden Shinai", "Basic training sword. Light but weak.", attack_bonus=5, value=30),
    "steel_katana": Weapon("Steel Katana", "A sharp steel katana forged in the human world.", attack_bonus=15, value=80),
    "asauchi": Weapon("Asauchi", "A nameless Zanpakuto. Awakens your inner spirit energy.", attack_bonus=35, value=180),
    "leather_vest": Armor("Leather Vest", "Standard leather chest protection.", defense_bonus=3, value=25),
    "shinigami_robe": Armor("Shinigami Robe", "Standard black shihakusho. Offers spiritual defense.", defense_bonus=10, value=75),
    "captain_haori": Armor("Captain's Haori", "A white haori worn by Gotei 13 captains. Greatly wards off physical damage.", defense_bonus=22, value=160),
}

class BuyRequest(BaseModel):
    item_name: str

class SellRequest(BaseModel):
    item_name: str

@app.post("/api/combat/claim_rewards")
def claim_rewards():
    state.combat_victory_rewards = None
    return {"message": "Rewards claimed", "state": get_state()}

@app.get("/api/shop/items")
def get_shop_items():
    return [item.to_dict() for item in shop_catalog.values()]

@app.post("/api/shop/buy")
def buy_item(req: BuyRequest):
    p = state.player
    target_item = None
    for item in shop_catalog.values():
        if item.name.lower() == req.item_name.lower():
            target_item = item
            break
            
    if not target_item:
        raise HTTPException(status_code=404, detail="Item not found in Urahara Shop")
        
    if p.gold < target_item.value:
        raise HTTPException(status_code=400, detail="Not enough gold to purchase this item")
        
    p.gold -= target_item.value
    import copy
    new_item = copy.deepcopy(target_item)
    p.add_item(new_item)
    
    state.combat_log = [f"Bought {new_item.name} for {new_item.value} gold."] + state.combat_log
    return {"message": f"Purchased {new_item.name}", "state": get_state()}

@app.post("/api/shop/sell")
def sell_item(req: SellRequest):
    p = state.player
    found_idx = -1
    for idx, item in enumerate(p.inventory):
        if item.name.lower() == req.item_name.lower():
            found_idx = idx
            break
            
    if found_idx == -1:
        raise HTTPException(status_code=404, detail="Item not found in inventory")
        
    item = p.inventory[found_idx]
    sell_value = max(1, int(item.value * 0.5))
    
    p.gold += sell_value
    p.inventory.pop(found_idx)
    
    if p.equipped_weapon and p.equipped_weapon.name.lower() == item.name.lower():
        p.equipped_weapon = None
    elif p.equipped_armor and p.equipped_armor.name.lower() == item.name.lower():
        p.equipped_armor = None
        
    state.combat_log = [f"Sold {item.name} for {sell_value} gold."] + state.combat_log
    return {"message": f"Sold {item.name} for {sell_value} gold", "state": get_state()}


if __name__ == "__main__":

    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
