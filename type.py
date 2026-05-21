import time 
import sys 
import threading
from pygame import mixer
from mutagen.mp3 import MP3

path = r"C:\Users\CHEKI\Desktop\standproud.mp3"

mixer.init()
mixer.music.load(path)
audio = MP3(path)
audiolength = audio.info.length


def play():
    mixer.music.play()

audiothread = threading.Thread(target = play)
audiothread.start()

text = "stand proud you are strong"
delay = audiolength/len(text)
for char in text:
    sys.stdout.write(char)
    sys.stdout.flush()
    time.sleep(delay)

audiothread.join()