# Game configuration settings
import os

GAME_NAME = "Domain of the Soul Society"
VERSION = "1.0.0"

# Colors (ANSI codes)
COLOR_RESET = "\033[0m"
COLOR_BOLD = "\033[1m"
COLOR_RED = "\033[31m"
COLOR_GREEN = "\033[32m"
COLOR_YELLOW = "\033[33m"
COLOR_BLUE = "\033[34m"
COLOR_PURPLE = "\033[35m"
COLOR_CYAN = "\033[36m"
COLOR_WHITE = "\033[37m"

# Audio Files
AUDIO_DIR = "audiofiles"
AUDIO_PATHS = {
    "welcome": os.path.join(AUDIO_DIR, "Aizen.mp3"),
    "loose": os.path.join(AUDIO_DIR, "standproud.mp3"),
    "gojo": os.path.join(AUDIO_DIR, "gojo_says_youre_weak.mp3"),
    "shunsui": os.path.join(AUDIO_DIR, "bankai-katen-kyokotsu.mp3"),
    "fight": os.path.join(AUDIO_DIR, "judas-(sukuna-vs-gojo).mp3")
}
