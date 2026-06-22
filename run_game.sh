#!/usr/bin/env bash

# Domain of the Soul Society - Local Run Script
# Launches both the FastAPI backend and React/Vite frontend servers, and cleans them up on exit.

# Text Styling
NEON_CYAN='\033[0;36m'
NEON_MAGENTA='\033[0;35m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${NEON_CYAN}"
echo "=========================================================="
echo "    DOMAINS OF THE SOUL SOCIETY - LOCAL STARTUP"
echo "=========================================================="
echo -e "${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Verify Python Virtual Environment
if [ ! -d ".venv" ]; then
    echo -e "${RED}[ERROR] Python virtual environment (.venv) not found in the root directory!${NC}"
    echo "Please set up your virtual environment and install dependencies before running."
    exit 1
fi

# Verify Node Modules
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${NEON_MAGENTA}[INFO] Node modules not found in frontend directory. Installing...${NC}"
    cd frontend && npm install && cd ..
fi

# Background Process Tracking
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    echo -e "\n${RED}[SHUTDOWN] Terminating game servers...${NC}"
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null
    fi
    echo -e "${GREEN}[SUCCESS] Servers stopped. Goodbye!${NC}"
    exit 0
}

# Trap exit signals
trap cleanup SIGINT SIGTERM EXIT

# Start FastAPI backend
echo -e "${NEON_CYAN}[BACKEND] Starting FastAPI server on port 8000...${NC}"
./.venv/bin/uvicorn app:app --port 8000 --host 127.0.0.1 > backend.log 2>&1 &
BACKEND_PID=$!

# Start Frontend Vite Dev Server
echo -e "${NEON_MAGENTA}[FRONTEND] Starting React/Vite dev server...${NC}"
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for a couple of seconds and check if they are running
sleep 2

if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo -e "${RED}[ERROR] FastAPI backend failed to start! Check backend.log for details.${NC}"
    exit 1
fi

if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    echo -e "${RED}[ERROR] React frontend failed to start! Check frontend.log for details.${NC}"
    exit 1
fi

echo -e "${GREEN}[SUCCESS] Servers are up and running!${NC}"
echo -e "   - Backend API: ${NEON_CYAN}http://localhost:8000/api${NC}"
echo -e "   - Frontend Web App: ${NEON_MAGENTA}http://localhost:5173${NC}"
echo -e "Press ${RED}Ctrl+C${NC} to stop the game and shut down both servers."

# Open browser to frontend
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:5173
elif command -v open > /dev/null; then
    open http://localhost:5173
fi

# Keep script running to monitor background processes
wait "$BACKEND_PID" "$FRONTEND_PID"
