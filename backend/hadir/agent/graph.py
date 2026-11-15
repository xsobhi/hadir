"""The assistant as a LangGraph state machine: a tool-calling agent with a human approval gate.

    START -> agent --(no tool calls)--> END
               |--(read tools only)--> tools -> agent
               '--(any write tool)---> review --approve--> tools -> agent
                                              '--decline--> agent (each call answered "declined")

State is checkpointed in SQLite per conversation thread, so a paused approval survives a page reload.
"""
from __future__ import annotations

import sqlite3

from langchain_core.messages import SystemMessage, ToolMessage, trim_messages
from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import END, START, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode
from langgraph.types import Command, interrupt

from ..config import CHECKPOINT_PATH
from ..db import now
from .llm import chat_model
from .prompts import system_prompt
from .tools_read import READ_TOOLS
from .tools_write import WRITE_NAMES, WRITE_TOOLS, draft_warning_notice

TOOLS = READ_TOOLS + [draft_warning_notice] + WRITE_TOOLS


def agent(state: MessagesState, config: RunnableConfig) -> dict:
    c = config["configurable"]
    history = trim_messages(state["messages"], strategy="last", token_counter=len, max_tokens=40,
                            start_on="human", include_system=False, allow_partial=False)
    prompt = system_prompt(c.get("professor", ""), c.get("title", ""), c.get("lang", "ar"), now())
    reply = chat_model().bind_tools(TOOLS).invoke([SystemMessage(prompt), *history], config)
    return {"messages": [reply]}


def route(state: MessagesState) -> str:
    last = state["messages"][-1]
    calls = getattr(last, "tool_calls", None) or []
    if not calls:
        return END
    return "review" if any(tc["name"] in WRITE_NAMES for tc in calls) else "tools"


def review(state: MessagesState) -> Command:
    """Pause the run and ask the professor. Resumed with {"approved": bool}."""
    calls = state["messages"][-1].tool_calls
    decision = interrupt({"actions": [{"id": tc["id"], "name": tc["name"], "args": tc["args"]}
                                      for tc in calls if tc["name"] in WRITE_NAMES]})
    if isinstance(decision, dict) and decision.get("approved"):
        return Command(goto="tools")
    declined = [ToolMessage(content="The professor declined this action.", tool_call_id=tc["id"], name=tc["name"])
                for tc in calls]
    return Command(goto="agent", update={"messages": declined})


def build(checkpointer) -> object:
    g = StateGraph(MessagesState)
    g.add_node("agent", agent)
    g.add_node("tools", ToolNode(TOOLS, handle_tool_errors=True))
    g.add_node("review", review, destinations=("tools", "agent"))
    g.add_edge(START, "agent")
    g.add_conditional_edges("agent", route, ["tools", "review", END])
    g.add_edge("tools", "agent")
    return g.compile(checkpointer=checkpointer)


_conn = sqlite3.connect(CHECKPOINT_PATH, check_same_thread=False)
checkpointer = SqliteSaver(_conn)
checkpointer.setup()
assistant_graph = build(checkpointer)
