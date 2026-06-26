"""A2A entrypoint for the Anonymizer agent.

Wraps the ADK agent as an A2A server (Nasiko discovers it over A2A) and serves
on port 5000 — the port Nasiko's Kong gateway expects on `agents-net`.
"""

import os

import uvicorn
from google.adk.a2a.utils.agent_to_a2a import to_a2a

from .agent import root_agent

HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "5000"))

# Starlette ASGI app exposing the A2A protocol (agent card at /.well-known/...)
app = to_a2a(root_agent, host=HOST, port=PORT)

if __name__ == "__main__":
    uvicorn.run(app, host=HOST, port=PORT)
