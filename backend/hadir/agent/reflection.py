"""A reflection loop as its own small LangGraph: draft a warning notice, critique it against the facts, revise.

draft -> critique -> (approved or 2 rounds) -> END
             \\-> revise -> critique ...
"""
from __future__ import annotations

from typing import TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph

from .llm import chat_model

MAX_ROUNDS = 2


class NoticeState(TypedDict):
    facts: str
    lang: str
    draft: str
    critique: str
    rounds: int


def _say(state: NoticeState, task: str) -> str:
    language = "Arabic (formal Modern Standard Arabic)" if state["lang"] == "ar" else "English"
    return f"Write in {language}. {task}"


def draft(state: NoticeState) -> dict:
    text = chat_model(0.4, 700).invoke([
        SystemMessage(_say(state, "You write short official attendance notices from a university professor to a "
                                  "student. 90-140 words. State the facts exactly, the remaining allowance, what "
                                  "happens if the limit is passed, and how to submit an excuse. Respectful, not "
                                  "threatening. No placeholders, no invented dates or numbers.")),
        HumanMessage(f"Facts:\n{state['facts']}"),
    ]).content
    return {"draft": text, "rounds": 0}


def critique(state: NoticeState) -> dict:
    review = chat_model(0.0, 400).invoke([
        SystemMessage("You are a strict editor. Check the notice against the facts: every number and date must "
                      "match, nothing may be invented, the tone must be respectful, length 90-140 words, and it must "
                      "say how to submit an excuse. Reply APPROVED if it passes, otherwise list each problem."),
        HumanMessage(f"Facts:\n{state['facts']}\n\nNotice:\n{state['draft']}"),
    ]).content
    return {"critique": review, "rounds": state["rounds"] + 1}


def revise(state: NoticeState) -> dict:
    text = chat_model(0.3, 700).invoke([
        SystemMessage(_say(state, "Rewrite the notice so every problem the editor listed is fixed. Return only the "
                                  "notice.")),
        HumanMessage(f"Facts:\n{state['facts']}\n\nNotice:\n{state['draft']}\n\nEditor:\n{state['critique']}"),
    ]).content
    return {"draft": text}


def after_critique(state: NoticeState) -> str:
    if state["critique"].strip().upper().startswith("APPROVED") or state["rounds"] >= MAX_ROUNDS:
        return END
    return "revise"


def build() -> object:
    g = StateGraph(NoticeState)
    g.add_node("draft", draft)
    g.add_node("critique", critique)
    g.add_node("revise", revise)
    g.add_edge(START, "draft")
    g.add_edge("draft", "critique")
    g.add_conditional_edges("critique", after_critique, ["revise", END])
    g.add_edge("revise", "critique")
    return g.compile()


notice_graph = build()
