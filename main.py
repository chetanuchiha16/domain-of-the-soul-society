from dialogue import *
import random
from colorama import Fore

class Player:

    def __init__(self):
        self.inventory = []
        self.summons = []
        self._hp = 100
        self._attack_power = 50

    @property
    def hp(self):
        return self._hp
    
    @hp.setter
    def hp(self, new_hp):
        if new_hp > 100:
            self._hp = 100
        elif new_hp < 0:
            self._hp = 0
        else:
            self._hp = new_hp

    @property
    def attack_power(self):
        return self._attack_power
    
    @attack_power.setter
    def attack_power(self, new_attack_power):
        if new_attack_power > 100:
            self._attack_power = 100
        elif new_attack_power < 0:
            self._attack_power = 0
        else:
            self._attack_power = new_attack_power

    def stats(self):

        print(f"HP: {self.hp:>18}\nInventory:          {self.inventory}\nAttack Power{self.attack_power:>10}")


class Dungeon:
    def __init__(self):
        self.findings = ['⚔','🛡','gojo','shunsui']

class Arena:
    def __init__(self):
        self.soldiers = random.randint(3,10)
        self.enemies = ['Boss',self.soldiers]



def game():
    welcome()
    player = Player()

    
    dungeon = Dungeon()
    isrunning = True
    while isrunning:
        player.stats()
        choice = int(input("\n1.Dungeon\n2.Arena\nWhat do you want to explore ? "))
        match choice:
            case 1:
                
                random.shuffle(dungeon.findings)
                found = dungeon.findings.pop() if dungeon.findings else message("Dungeon is empty")
                if found == '⚔':
                    player.attack_power += random.randint(1,10)
                    player.inventory.append(found)
                    print(dungeon.findings)
                    
                elif found == '🛡':
                    player.attack_power -= random.randint(1,10)
                    player.inventory.append(found)
                    print(dungeon.findings)
                    
                elif found == 'gojo':
                    player.attack_power += random.randint(30,40)
                    player.summons.append(found)
                    print(dungeon.findings)
                    
                elif found == 'shunsui':
                    player.attack_power += random.randint(30,40)
                    player.summons.append(found)
                    print(dungeon.findings)
                    
                message(f"you found {found}")
                message(f"your attack power is {player.attack_power}")


            case 2:
                arena = Arena()
                random.shuffle(arena.enemies)
                encountered = arena.enemies.pop()
                if encountered == 'Boss':
                    message(Fore.RED + "You are Cooked")
                    isalive = True
                    
                    while isalive:
                        if player.summons:
                            for i,hero in enumerate(player.summons):
                                print(i, hero, end = ' ')
                            choose = int(input("Who do you want to summon ?"))
                            if player.summons[choose]:
                                message(f"You Chose {player.summons[choose]}")
                            match player.summons[choose]:
                                case 'gojo':
                                    gojo()
                                    gojo_vs_sukuna()
                                    message("You Won")
                                    player.summons.pop()
                                    break
                                case 'shunsui':
                                    shunsui()
                                    message("You Won")
                                    player.summons.pop()
                                    break
                                case _ :
                                    loose_to_sukuna()
                                    isalive = True if input("Do you want to try again ?").strip().upper() == 'Y' else False
                    
                else: 
                    isalive = True                   
                    message(f"You encountered {encountered} enemies")
                    while isalive:                       
                        if encountered > 8:                           
                            player.hp -= 100
                            message("You Won")
                            message(Fore.RED + "Your HP is critically low!")
                            message(Fore.RED + f"You Died")
                            isalive = False                            
                        elif 6 <= encountered <= 8:
                            
                            player.hp -= 40
                            message("You Won")
                            break                           
                        else:                           
                            message("You Won")
                            player.hp -= 10               
                            break      
            case _ :
                message("Invalid Choice")
                    

        isrunning = True if input("Do you want to explore again ? ").upper() == 'Y' else False
                            


            

def main():
    game()

if __name__ == '__main__':
    main()