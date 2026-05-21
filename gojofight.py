import time
import sys

load = ["🔵 🔴   🟣   ⛩️","🔴 🔵   🟣   ⛩️"]
while(True):
  for ele in load:
    sys.stdout.write(f"\r      fight{ele}   ")
    sys.stdout.flush()
    time.sleep(0.1)
