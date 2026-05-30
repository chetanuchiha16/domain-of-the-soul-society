# RPG Models for characters, enemies, and stats
import random

class Entity:
    def __init__(self, name, hp, attack_power, energy=100):
        self.name = name
        self._max_hp = hp
        self._hp = hp
        self._attack_power = attack_power
        self._max_energy = energy
        self._energy = energy

    @property
    def hp(self):
        return self._hp

    @hp.setter
    def hp(self, val):
        self._hp = max(0, min(self._max_hp, val))

    @property
    def max_hp(self):
        return self._max_hp

    @max_hp.setter
    def max_hp(self, val):
        self._max_hp = max(1, val)
        self._hp = min(self._hp, self._max_hp)

    @property
    def attack_power(self):
        return self._attack_power

    @attack_power.setter
    def attack_power(self, val):
        self._attack_power = max(0, val)

    @property
    def energy(self):
        return self._energy

    @energy.setter
    def energy(self, val):
        self._energy = max(0, min(self._max_energy, val))

    @property
    def max_energy(self):
        return self._max_energy

    @max_energy.setter
    def max_energy(self, val):
        self._max_energy = max(0, val)
        self._energy = min(self._energy, self._max_energy)

    def is_alive(self):
        return self._hp > 0

    def take_damage(self, amount):
        actual_damage = max(0, amount)
        self.hp -= actual_damage
        return actual_damage


class Item:
    def __init__(self, name, description, item_type, value=0):
        self.name = name
        self.description = description
        self.item_type = item_type  # "weapon", "armor", "consumable"
        self.value = value

    def __str__(self):
        return self.name

    def __repr__(self):
        return self.name

    def to_dict(self):
        data = {
            "name": self.name,
            "description": self.description,
            "item_type": self.item_type,
            "value": self.value
        }
        if isinstance(self, Weapon):
            data["attack_bonus"] = self.attack_bonus
        elif isinstance(self, Armor):
            data["defense_bonus"] = self.defense_bonus
        elif isinstance(self, Consumable):
            data["heal_hp"] = self.heal_hp
            data["restore_energy"] = self.restore_energy
        return data

    @classmethod
    def from_dict(cls, data):
        t = data.get("item_type")
        if t == "weapon":
            return Weapon(data["name"], data["description"], data["attack_bonus"], data.get("value", 0))
        elif t == "armor":
            return Armor(data["name"], data["description"], data["defense_bonus"], data.get("value", 0))
        elif t == "consumable":
            return Consumable(data["name"], data["description"], data.get("heal_hp", 0), data.get("restore_energy", 0), data.get("value", 0))
        return Item(data["name"], data["description"], t, data.get("value", 0))


class Weapon(Item):
    def __init__(self, name, description, attack_bonus, value=0):
        super().__init__(name, description, "weapon", value)
        self.attack_bonus = attack_bonus


class Armor(Item):
    def __init__(self, name, description, defense_bonus, value=0):
        super().__init__(name, description, "armor", value)
        self.defense_bonus = defense_bonus


class Consumable(Item):
    def __init__(self, name, description, heal_hp=0, restore_energy=0, value=0):
        super().__init__(name, description, "consumable", value)
        self.heal_hp = heal_hp
        self.restore_energy = restore_energy

    def use(self, target):
        if self.heal_hp > 0:
            target.hp += self.heal_hp
        if self.restore_energy > 0:
            target.energy += self.restore_energy
        return True


class Player(Entity):
    def __init__(self, name="Hero", hp=100, attack_power=50):
        super().__init__(name, hp, attack_power)
        self.level = 1
        self.xp = 0
        self.gold = 0
        self.inventory = []
        self.summons = []
        self.equipped_weapon = None
        self.equipped_armor = None
        self.current_location = "Shibuya Station"

    def to_dict(self):
        return {
            "name": self.name,
            "hp": self.hp,
            "max_hp": self.max_hp,
            "attack_power": self._attack_power,
            "energy": self.energy,
            "max_energy": self.max_energy,
            "level": self.level,
            "xp": self.xp,
            "gold": self.gold,
            "inventory": [item.to_dict() for item in self.inventory],
            "summons": self.summons,
            "equipped_weapon": self.equipped_weapon.to_dict() if self.equipped_weapon else None,
            "equipped_armor": self.equipped_armor.to_dict() if self.equipped_armor else None,
            "current_location": self.current_location
        }

    @classmethod
    def from_dict(cls, data):
        p = Player(data["name"], data["max_hp"], data["attack_power"])
        p.hp = data["hp"]
        p.max_energy = data["max_energy"]
        p.energy = data["energy"]
        p.level = data["level"]
        p.xp = data["xp"]
        p.gold = data["gold"]
        p.summons = data.get("summons", [])
        p.inventory = [Item.from_dict(item_data) for item_data in data.get("inventory", [])]
        p.current_location = data.get("current_location", "Shibuya Station")
        
        eq_w = data.get("equipped_weapon")
        if eq_w:
            p.equipped_weapon = Item.from_dict(eq_w)
        eq_a = data.get("equipped_armor")
        if eq_a:
            p.equipped_armor = Item.from_dict(eq_a)
        return p


    @property
    def attack_power(self):
        bonus = self.equipped_weapon.attack_bonus if self.equipped_weapon else 0
        return self._attack_power + bonus

    @attack_power.setter
    def attack_power(self, val):
        self._attack_power = max(0, val)

    def take_damage(self, amount):
        defense = self.equipped_armor.defense_bonus if self.equipped_armor else 0
        actual_damage = max(0, amount - defense)
        self.hp -= actual_damage
        return actual_damage

    def add_item(self, item):
        self.inventory.append(item)

    def equip(self, item):
        if item.item_type == "weapon":
            self.equipped_weapon = item
        elif item.item_type == "armor":
            self.equipped_armor = item

    def use_item(self, item_name):
        for idx, item in enumerate(self.inventory):
            if item.name.lower() == item_name.lower():
                if isinstance(item, Consumable):
                    item.use(self)
                    self.inventory.pop(idx)
                    return True
                elif isinstance(item, (Weapon, Armor)):
                    self.equip(item)
                    return True
        return False

    def stats(self):
        weapon_name = self.equipped_weapon.name if self.equipped_weapon else "None"
        armor_name = self.equipped_armor.name if self.equipped_armor else "None"
        print(f"HP: {self.hp}/{self.max_hp:>18}\nInventory:          {self.inventory}\nAttack Power: {self.attack_power:>10} (Weapon: {weapon_name})\nArmor: {armor_name}")

    def get_stats_summary(self):
        weapon_name = self.equipped_weapon.name if self.equipped_weapon else "None"
        armor_name = self.equipped_armor.name if self.equipped_armor else "None"
        return (
            f"--- {self.name} (LVL {self.level}) ---\n"
            f"HP: {self.hp}/{self.max_hp}\n"
            f"Energy: {self.energy}/{self.max_energy}\n"
            f"Attack Power: {self.attack_power} (Weapon: {weapon_name})\n"
            f"Armor: {armor_name}\n"
            f"Gold: {self.gold} | XP: {self.xp}\n"
            f"Inventory: {[item.name for item in self.inventory]}\n"
            f"Summons: {[s for s in self.summons]}\n"
        )


class Enemy(Entity):
    def __init__(self, name, hp, attack_power, xp_reward=10, gold_reward=5):
        super().__init__(name, hp, attack_power)
        self.xp_reward = xp_reward
        self.gold_reward = gold_reward

    def get_stats_summary(self):
        return f"{self.name} - HP: {self.hp}/{self.max_hp} | ATK: {self.attack_power}"


class Location:
    def __init__(self, name, description, region, x, y, connections=None):
        self.name = name
        self.description = description
        self.region = region
        self.x = x
        self.y = y
        self.connections = connections or []

    def to_dict(self):
        return {
            "name": self.name,
            "description": self.description,
            "region": self.region,
            "x": self.x,
            "y": self.y,
            "connections": self.connections
        }


