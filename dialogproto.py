import pygame
from mutagen.mp3 import MP3
import threading
import sys



#help(MP3)


class Dialogue:

    def __init__(self):
        pygame.mixer.init()

    @staticmethod
    def loose_to_sukuna(func):

        def wrapper(*args):

            audiopath = 'audiofiles/standproud.mp3'
            text = "Stand Pround you are strong"
            func( audiopath, text, *args)

        return wrapper
    
    #@loose_to_sukuna
    def dialogue(self, *args):
        audiopath = args[0]
        text = args[1]
        #print(audiopath,text)
        audio = MP3(audiopath)
        audiolength = audio.info.length
        delay = audiolength//len(text)
        def sound():
            pygame.mixer.music.load(audiopath)
            pygame.mixer.music.play()
            
        audiothread = threading.Thread(target = sound)
        audiothread.start()
        audiothread.join()

suk = Dialogue()
Dialogue.loose_to_sukuna(suk.dialogue)()
#suk.dialogue()
