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


class Player(Entity):
    def __init__(self, name="Hero", hp=100, attack_power=50):
        super().__init__(name, hp, attack_power)
        self.level = 1
        self.xp = 0
        self.gold = 0
        self.inventory = []
        self.summons = []

    def stats(self):
        print(f"HP: {self.hp:>18}\nInventory:          {self.inventory}\nAttack Power{self.attack_power:>10}")

    def get_stats_summary(self):
        return (
            f"--- {self.name} (LVL {self.level}) ---\n"
            f"HP: {self.hp}/{self.max_hp}\n"
            f"Energy: {self.energy}/{self.max_energy}\n"
            f"Attack Power: {self.attack_power}\n"
            f"Gold: {self.gold} | XP: {self.xp}\n"
            f"Inventory: {self.inventory}\n"
            f"Summons: {[s for s in self.summons]}\n"
        )


class Enemy(Entity):
    def __init__(self, name, hp, attack_power, xp_reward=10, gold_reward=5):
        super().__init__(name, hp, attack_power)
        self.xp_reward = xp_reward
        self.gold_reward = gold_reward

    def get_stats_summary(self):
        return f"{self.name} - HP: {self.hp}/{self.max_hp} | ATK: {self.attack_power}"

