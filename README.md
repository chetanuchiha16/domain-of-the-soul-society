# Domain of the Soul Society

Welcome to **Domain of the Soul Society**, an atmospheric anime-crossover RPG bridging the worlds of *Jujutsu Kaisen* and *Bleach*. 

Players step into the shoes of a Shinigami/Jujutsu Sorcerer hybrid navigating through cursed streets, spiritual barracks, and hollow-infested desert dunes. Encounter legendary foes, summon powerful guardians, and harness ancient spells (Kido) to cleanse the corruption.

---

## 🎮 Game Architecture

The application is structured as a client-server web app:
*   **Backend (Python / FastAPI)**: Handles the core RPG state machine, inventory actions, combat resolution math, level-up calculations, and JSON-based save/load management.
*   **Frontend (React / Vite / TypeScript)**: A fully responsive user interface utilizing **Vanilla CSS** for immersive visual styling (Shibuya scanlines, Soul Society cherry blossoms, Hueco Mundo sandstorms) and canvas animations.
*   **Audio Engine (Web Audio API)**: Features a procedurally generated synthesizer engine that produces dynamic background music (BGM) loops (bell melodies for exploration, tense combat loops, heartbeat boss themes) and tactile UI sound effects (clicks, hovers, victory chimes, level-up fanfares) synchronized to combat action frames.

---

## 🚀 Key Features

*   **Anime-Style Cinematic Intro**: A lore-heavy keyframed slideshow recounting the fusion of curses and spiritual hollows, backed by synthesizer rises and flash impact frames.
*   **Interactive Node Map**: Travel across Shibuya, Seireitei, and Las Noches, each with unique encounter pools and customized dark-mode themes.
*   **Strategic Turn-Based Combat**:
    *   **Tactical Actions**: Slashing, managing Reiryoku (energy), casting Kido spells (Burn-inflicting *Hadō #31: Shakkahō* or debuff-cleansing *Kaidō*), or utilizing shop items.
    *   **Summon Seals**: Summon legendary support characters like **Satoru Gojo** (Domain Expansion: Infinite Void freezes enemies; Reverse Cursed Technique heals) or **Shunsui Kyoraku** (Kageoni/Takaoni strikes weaken target attack output).
    *   **Boss Battles**: Fight legendary final bosses **Ryomen Sukuna** (Cursed Site) and **Sosuke Aizen** (Las Noches Throne Room) featuring dedicated boss panels and heartbeat tension loops.
*   **Tactile Settings Menu**: Persistently toggle visual effects (screenshakes, inverted critical flashes), mute/unmute audio settings (BGM, SFX), export/import save backups, or reset character progression.

---

## ⚙️ How to Setup & Run

### Method 1: The Unified Startup Script (Recommended)
We provide a helper bash script in the root directory that installs missing packages, starts both the backend API and frontend dev server, manages background processes, and launches the game in your default browser.

Simply run from the project root:
```bash
./run_game.sh
```
*Press `Ctrl+C` inside the terminal to gracefully terminate both servers.*

### Method 2: Manual Installation & Startup

#### 1. Backend Setup
Activate the virtual environment and launch FastAPI:
```bash
# Activate .venv
source .venv/bin/activate

# Install dependencies if needed
pip install fastapi uvicorn pydantic

# Start backend server
uvicorn app:app --port 8000 --reload
```

#### 2. Frontend Setup
In a new terminal window, compile and run the React frontend:
```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite dev server
npm run dev
```
Open your browser and navigate to **`http://localhost:5173`**.

---

## 🛠️ Verification & Testing

To run the custom backend verification suites (testing summon seals, combat rewards generation, and boss attributes), run:
```bash
python -m unittest discover -s . -p "test_*.py"
```

Enjoy your journey in the **Domain of the Soul Society**!
