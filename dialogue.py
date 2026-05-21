from mutagen.mp3 import MP3
import sys
import pygame
import threading
import time
import config

pygame.mixer.init()

def dialogue(*args):
    songpath = args[0]
    text = args[1]

    pygame.mixer.music.load(songpath)
    audio = MP3(songpath)
    audiolength = audio.info.length
    delay = audiolength/len(songpath) 
    def play_sound():
        pygame.mixer.music.play()
    audiothread = threading.Thread(target = play_sound)
    audiothread.start()
    
    for char in text:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(delay)
    print()
    audiothread.join()

def loose_to_sukuna():
    dialogue(config.AUDIO_PATHS["loose"], "Stand Proud you are strong")

def welcome():
    dialogue(config.AUDIO_PATHS["welcome"], "yokoso watashi no soul society ye")

def gojo():
    dialogue(config.AUDIO_PATHS["gojo"], 'Daijoubu desho datte kimi yowai mo')

def shunsui():
    dialogue(config.AUDIO_PATHS["shunsui"], 'Bankai Katen Kyōkotsu: Karamatsu Shinjū')


def message(message):
    for char in message:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(0.01)
    print()


def gojo_vs_sukuna():
    songpath = config.AUDIO_PATHS["fight"]

    pygame.mixer.music.load(songpath)
    audio = MP3(songpath)
    audiolength = audio.info.length 
    def play_sound():
        pygame.mixer.music.play()
    audiothread = threading.Thread(target = play_sound)
    audiothread.start()
    starttime = time.time()
   
    l = ["🔵🔴  🟣  ⛩️","🔴🔵  🟣  ⛩️"]
    while time.time() - starttime < audiolength:
        for ele in l:
            sys.stdout.write(f"\r-------------------------------------------------------------- {ele} --------------------------------------------------------------")
            sys.stdout.flush()
            time.sleep(0.01)

    audiothread.join()
    


if __name__ == '__main__':
    message("hello")
    """gojo_vs_sukuna()
    welcome()
    loose_to_sukuna()
    gojo()
    shunsui()"""