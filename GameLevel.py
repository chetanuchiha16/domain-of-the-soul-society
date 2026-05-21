levels = [{f"level {i}": " "} for i in range(3)]
#levels[0]["level 0"] = "×"
#print(levels)
for row in levels[::-1]:
    print(row)
win = 0
level = 0

while(True):
    if level > 0:
      levels[level-1][f"level {level-1}"] = " "
    levels[level][f"level {level}"] = "×"
    win = input("w or l: ")
    if win == "w":
      level+=1
    for row in levels[::-1]:
      print(row)
    if level > 2:
        print("you reached max level")
        break