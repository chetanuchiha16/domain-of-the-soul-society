import sys
import time
import pyttsx3

def type_and_speak(text, delay=0.1):
    # Initialize the text-to-speech engine
    engine = pyttsx3.init()
    engine.say(text)  # Queue the text to be spoken
    engine.runAndWait()  # Speak the text
    
    # Simulate typing effect
    for char in text:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(delay)
    print()  # Move to the next line

# Usage
type_and_speak("Hello, I am typing this text and reading it aloud!", delay=0.05)