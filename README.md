# AI Agent System

A two-agent system where a **Frontend Agent** (React) and a **Backend Agent** (FastAPI) communicate with each other to complete a content generation task. The agents interact through a clarification loop before producing the final output.

---

## Demo Video

<!-- Add your demo video link here -->
> **[Watch the demo](#)** — shows the full agent interaction: task input → tone clarification → length clarification → generated output.

---

## Architecture

```
User → Frontend Agent (React) → Backend Agent (FastAPI) → Output
                  ↑_______________↓ (clarification loop)
```

| Component | Technology | Role |
|---|---|---|
| **Frontend Agent** | React 18 + Vite | Mediates between the user and backend; drives the conversation UI |
| **Backend Agent** | FastAPI + Python | State-machine that collects clarifications and generates content |

### Interaction Flow

1. User types a task — e.g. *"Create a short blog about AI in hiring"*
2. **Frontend Agent → Backend Agent** — sends task via `POST /api/session/start`
3. **Backend Agent → Frontend Agent** — asks for **tone** (formal / casual)
4. **Frontend Agent → Backend Agent** — forwards tone choice
5. **Backend Agent → Frontend Agent** — asks for **length** (short / medium / long)
6. **Frontend Agent → Backend Agent** — forwards length choice
7. **Backend Agent** generates content and returns final output
8. **Frontend Agent** displays the result in the chat UI

---

## Prerequisites

- Python ≥ 3.9
- Node.js ≥ 18

---

## Quick Start

### 1 — Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Add your Gemini API key (see AI Integration section below)
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your-key-here

# Start the server
uvicorn main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`  
Interactive API docs: `http://localhost:8000/docs`

---

### 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## AI Integration (Gemini)

The Backend Agent uses **Google Gemini 2.5 Flash** to generate content.

1. Get a free API key at [aistudio.google.com](https://aistudio.google.com) (free tier: 1,500 requests/day)
2. Edit `backend/.env`:

```
GEMINI_API_KEY=AIza...your-key-here
```

Without a key, the agent falls back to a built-in template that still demonstrates the full agent interaction flow.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/health` | Health check |
| `POST` | `/api/session/start` | Start a session `{ "task": "..." }` |
| `POST` | `/api/session/{id}/respond` | Send a clarification reply `{ "message": "..." }` |
| `GET`  | `/api/session/{id}` | Inspect full session state |

---

## Project Structure

```
ai-agent-assessment/
├── backend/
│   ├── main.py              # FastAPI app, CORS, session management
│   ├── agent.py             # Backend Agent — state machine + Gemini generation
│   ├── requirements.txt
│   ├── .env.example
│   └── .env                 # Your API key (not committed)
└── frontend/
    └── src/
        ├── agent/
        │   └── FrontendAgent.js       # Frontend Agent class — REST API client
        ├── components/
        │   ├── ChatWindow.jsx         # Scrollable message list
        │   ├── MessageBubble.jsx      # Color-coded bubbles per sender
        │   └── StepProgress.jsx       # Step progress bar (Task→Tone→Length→Output)
        ├── App.jsx                    # Main app shell, state, quick-reply chips
        └── main.jsx
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, CSS Modules |
| Backend | FastAPI, Uvicorn, Pydantic |
| AI | Google Gemini 2.5 Flash |
| Communication | REST (JSON over HTTP) |
