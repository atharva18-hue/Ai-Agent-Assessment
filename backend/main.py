"""
FastAPI application — exposes the Backend Agent over HTTP so the
Frontend Agent can communicate with it via REST.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional

from agent import BackendAgent

app = FastAPI(title="Backend Agent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store  {session_id: BackendAgent}
sessions: Dict[str, BackendAgent] = {}


# ------------------------------------------------------------------
# Request / Response models
# ------------------------------------------------------------------


class StartRequest(BaseModel):
    task: str


class RespondRequest(BaseModel):
    message: str


class AgentResponse(BaseModel):
    session_id: str
    message: str
    state: str
    final_output: Optional[str] = None


# ------------------------------------------------------------------
# Routes
# ------------------------------------------------------------------


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/session/start", response_model=AgentResponse)
def start_session(body: StartRequest):
    """
    Frontend Agent → Backend Agent: send the initial user task.
    Creates a new session and returns the first clarifying question.
    """
    agent = BackendAgent()
    result = agent.receive(body.task, sender="frontend")
    sessions[agent.session_id] = agent
    return AgentResponse(**result)


@app.post("/api/session/{session_id}/respond", response_model=AgentResponse)
def respond(session_id: str, body: RespondRequest):
    """
    Frontend Agent → Backend Agent: send a clarification answer.
    """
    agent = sessions.get(session_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Session not found")
    result = agent.receive(body.message, sender="frontend")
    return AgentResponse(**result)


@app.get("/api/session/{session_id}")
def get_session(session_id: str):
    """Return the full session state (useful for debugging)."""
    agent = sessions.get(session_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Session not found")
    return agent.to_dict()
