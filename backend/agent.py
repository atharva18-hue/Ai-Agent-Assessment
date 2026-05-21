"""
Backend Agent — a simple state-machine that drives a multi-turn conversation
to gather clarifications before producing the final output.

States
------
AWAITING_TASK      → initial state
AWAITING_TONE      → task received, asking for tone
AWAITING_LENGTH    → tone received, asking for length
DONE               → all clarifications gathered, output produced
"""

import os
import uuid
from enum import Enum
from typing import Dict, List, Optional

from dotenv import load_dotenv

load_dotenv()

GEMINI_AVAILABLE = False
_gemini_client = None
try:
    from google import genai as google_genai
    _gemini_key = os.getenv("GEMINI_API_KEY", "")
    if _gemini_key:
        _gemini_client = google_genai.Client(api_key=_gemini_key)
        GEMINI_AVAILABLE = True
except Exception:
    pass


class AgentState(str, Enum):
    AWAITING_TASK = "awaiting_task"
    AWAITING_TONE = "awaiting_tone"
    AWAITING_LENGTH = "awaiting_length"
    DONE = "done"


class BackendAgent:
    """Stateful backend agent for a single session."""

    def __init__(self):
        self.session_id: str = str(uuid.uuid4())
        self.state: AgentState = AgentState.AWAITING_TASK
        self.task: Optional[str] = None
        self.tone: Optional[str] = None
        self.length: Optional[str] = None
        self.history: List[Dict] = []  # {sender, message}
        self.final_output: Optional[str] = None

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    def receive(self, message: str, sender: str = "frontend") -> dict:
        """
        Process an incoming message from the Frontend Agent.
        Returns a response dict:
          { "message": str, "state": AgentState, "final_output": str|None }
        """
        self._log(sender, message)

        if self.state == AgentState.AWAITING_TASK:
            return self._handle_task(message)
        elif self.state == AgentState.AWAITING_TONE:
            return self._handle_tone(message)
        elif self.state == AgentState.AWAITING_LENGTH:
            return self._handle_length(message)
        else:
            return self._reply("Output has already been generated.", self.final_output)

    # ------------------------------------------------------------------
    # State handlers
    # ------------------------------------------------------------------

    def _handle_task(self, message: str) -> dict:
        self.task = message
        self.state = AgentState.AWAITING_TONE
        reply = (
            "Got it! Before I generate the content, I need a couple of quick details.\n"
            "What **tone** would you prefer?\n"
            "• **formal** – professional and structured\n"
            "• **casual** – conversational and friendly"
        )
        return self._reply(reply)

    def _handle_tone(self, message: str) -> dict:
        tone_map = {"formal": "formal", "casual": "casual"}
        detected = next((v for k, v in tone_map.items() if k in message.lower()), "formal")
        self.tone = detected
        self.state = AgentState.AWAITING_LENGTH
        reply = (
            f"Tone set to **{self.tone}**. One more thing —\n"
            "What **length** do you prefer?\n"
            "• **short** – ~150 words\n"
            "• **medium** – ~300 words\n"
            "• **long** – ~500 words"
        )
        return self._reply(reply)

    def _handle_length(self, message: str) -> dict:
        length_map = {"short": "short", "medium": "medium", "long": "long"}
        detected = next((v for k, v in length_map.items() if k in message.lower()), "short")
        self.length = detected
        self.state = AgentState.DONE

        output = self._generate_output()
        self.final_output = output

        reply = "All details collected! Here is the generated output:"
        return self._reply(reply, output)

    # ------------------------------------------------------------------
    # Content generation
    # ------------------------------------------------------------------

    def _generate_output(self) -> str:
        if GEMINI_AVAILABLE:
            return self._generate_with_gemini()
        return self._generate_with_template()

    def _generate_with_gemini(self) -> str:
        word_targets = {"short": 150, "medium": 300, "long": 500}
        words = word_targets.get(self.length or "short", 150)

        prompt = (
            f"You are a professional content writer.\n"
            f"Write a {self.tone} piece about the following request in approximately {words} words.\n\n"
            f"Request: {self.task}\n\n"
            "Return only the content text, no additional commentary or meta-text."
        )

        try:
            response = _gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )
            return response.text.strip()
        except Exception:
            return self._generate_with_template()

    def _extract_topic(self, raw: str) -> str:
        """Strip common instruction prefixes to get the bare topic."""
        import re
        cleaned = re.sub(
            r"(?i)^(write|create|generate|make|draft|give me|produce)"
            r"(\s+(a|an|me|us))?"
            r"(\s+(short|long|medium|brief|detailed|comprehensive))?"
            r"(\s+(blog( post)?|article|essay|summary|post|story|report|paragraph|piece))"
            r"(\s+(about|on|regarding|for))?",
            "",
            raw.strip(),
        ).strip(" .,;:-")
        return cleaned if cleaned else raw

    def _generate_with_template(self) -> str:
        tone = self.tone or "formal"
        length = self.length or "short"
        task = self._extract_topic(self.task or "the requested topic")

        task_cap = task[0].upper() + task[1:] if task else task

        if tone == "formal":
            intro = (
                f"## {task.title()}\n\n"
                f"{task_cap} has become an increasingly important subject in today's rapidly evolving landscape. "
                f"As developments in this area continue to accelerate, stakeholders across industries are "
                f"paying close attention to the opportunities and challenges that {task} presents."
            )
            mid = (
                f"A closer examination of {task} reveals several key dimensions worth considering. "
                "From an operational standpoint, early adopters have demonstrated measurable improvements "
                "in efficiency and outcomes. Regulatory frameworks and industry standards are also adapting "
                f"to keep pace with the growth of {task}, signalling its long-term significance."
            )
            extra = (
                f"The societal implications of {task} deserve equally careful analysis. "
                "Research consistently underscores the importance of inclusive approaches, transparent "
                "communication, and continuous evaluation of outcomes. Organisations that prioritise "
                "these principles are better positioned to achieve sustainable and equitable results. "
                f"Collaboration between industry, academia, and policymakers will be crucial in shaping "
                f"the future trajectory of {task}."
            )
            conclusion = (
                f"In conclusion, {task} represents both a significant opportunity and a responsibility. "
                "A thoughtful, evidence-based approach will be essential for any stakeholder seeking "
                "to engage with this space effectively and responsibly."
            )
        else:
            intro = (
                f"## {task.title()}\n\n"
                f"So, let's talk about {task_cap} — it's been a hot topic lately, and honestly, for good reason! "
                f"Whether you've been following {task} for a while or just getting started, there's a lot "
                "to unpack here."
            )
            mid = (
                f"What makes {task} so exciting is the pace at which things are moving. "
                "More and more people and organisations are jumping in, experimenting, and finding real "
                f"value. The conversation around {task} has shifted from 'maybe someday' to 'what are we "
                "waiting for?' — and that energy is contagious."
            )
            extra = (
                f"Of course, {task} isn't without its challenges. There are real questions to work through "
                "around accessibility, impact, and how we bring everyone along for the ride. But that's "
                "part of what makes it such a rich area to explore — the problems are as interesting as "
                "the solutions.\n\n"
                f"The people leading the charge on {task} are a diverse bunch — researchers, entrepreneurs, "
                "policymakers, and everyday folks who just want things to work better. That mix of "
                "perspectives is what keeps the space dynamic and moving forward."
            )
            conclusion = (
                f"At the end of the day, {task} is worth paying attention to — whether you're curious, "
                "sceptical, or somewhere in between. Stay open-minded, keep asking questions, and enjoy "
                "the ride. The future looks bright!"
            )

        if length == "short":
            return f"{intro}\n\n{conclusion}"
        elif length == "medium":
            return f"{intro}\n\n{mid}\n\n{conclusion}"
        else:
            return f"{intro}\n\n{mid}\n\n{extra}\n\n{conclusion}"

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _log(self, sender: str, message: str):
        self.history.append({"sender": sender, "message": message})

    def _reply(self, message: str, final_output: Optional[str] = None) -> dict:
        self._log("backend", message)
        return {
            "message": message,
            "state": self.state,
            "final_output": final_output,
            "session_id": self.session_id,
        }

    def to_dict(self) -> dict:
        return {
            "session_id": self.session_id,
            "state": self.state,
            "task": self.task,
            "tone": self.tone,
            "length": self.length,
            "history": self.history,
            "final_output": self.final_output,
        }
