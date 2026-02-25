"""VOX Live — WebSocket endpoint for real-time voice conversation.

Protocol:
  Binary frames: Raw PCM audio (16-bit, 16kHz mono from client; 24kHz from server)
  Text frames:   JSON control messages

Client -> Server JSON:
  {"type": "start", "theme": "expert"}
  {"type": "text", "content": "hello"}
  {"type": "mute", "muted": true}
  {"type": "end"}

Server -> Client JSON:
  {"type": "ready", "sessionId": "..."}
  {"type": "transcript", "role": "user"|"vox", "text": "..."}
  {"type": "tool_call", "name": "...", "args": {...}}
  {"type": "tool_result", "name": "...", "data": {...}}
  {"type": "ui_action", "action": "...", ...}
  {"type": "error", "message": "..."}
  {"type": "session_end", "reason": "..."}
"""

from __future__ import annotations

import json
import logging
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from server.services.vox_session import VoxLiveSession
from server.services.vox_tools import VoxToolDispatcher

router = APIRouter(tags=["vox-live"])
log = logging.getLogger("aus.vox.live")


@router.websocket("/api/vox/live")
async def vox_live_ws(ws: WebSocket):
    """Bidirectional voice WebSocket — bridges browser and Gemini Live API."""
    await ws.accept()
    session_id = str(uuid.uuid4())[:8]
    log.info("[%s] VOX Live WebSocket connected", session_id)

    session: VoxLiveSession | None = None
    muted = False

    async def on_audio(data: bytes) -> None:
        """Relay Gemini audio back to the browser."""
        try:
            await ws.send_bytes(data)
        except Exception:
            pass

    async def on_transcript(role: str, text: str) -> None:
        """Send transcript updates to the browser."""
        try:
            await ws.send_text(json.dumps({
                "type": "transcript", "role": role, "text": text,
            }))
        except Exception:
            pass

    async def on_tool_call(name: str, args: dict) -> dict:
        """Dispatch tool call and return result."""
        return await dispatcher.dispatch(name, args)

    async def on_control(msg: dict) -> None:
        """Forward control messages to the browser."""
        try:
            await ws.send_text(json.dumps(msg))
        except Exception:
            pass

    # Project getter: returns current project state from app
    def get_project():
        return getattr(ws.app.state, "current_project", None)

    dispatcher = VoxToolDispatcher(
        studio=getattr(ws.app.state, "studio", None),
        project_getter=get_project,
        ui_action_sender=on_control,
    )

    try:
        while True:
            message = await ws.receive()

            # Binary frame = PCM audio from microphone
            if "bytes" in message and message["bytes"]:
                if session and session.connected and not muted:
                    await session.send_audio(message["bytes"])

            # Text frame = JSON control message
            elif "text" in message and message["text"]:
                try:
                    data = json.loads(message["text"])
                except json.JSONDecodeError:
                    continue

                msg_type = data.get("type", "")

                if msg_type == "start":
                    theme = data.get("theme", "expert")
                    session = VoxLiveSession(
                        theme=theme,
                        on_audio=on_audio,
                        on_transcript=on_transcript,
                        on_tool_call=on_tool_call,
                        on_control=on_control,
                    )
                    await session.connect()
                    await ws.send_text(json.dumps({
                        "type": "ready", "sessionId": session_id,
                    }))

                elif msg_type == "text" and session:
                    text = data.get("content", "")
                    if text:
                        await session.send_text(text)

                elif msg_type == "mute":
                    muted = data.get("muted", False)

                elif msg_type == "end":
                    if session:
                        await session.disconnect()
                    await ws.send_text(json.dumps({
                        "type": "session_end", "reason": "user",
                    }))
                    break

    except WebSocketDisconnect:
        log.info("[%s] VOX Live WebSocket disconnected", session_id)
    except Exception:
        log.exception("[%s] VOX Live WebSocket error", session_id)
    finally:
        if session:
            await session.disconnect()
        log.info("[%s] VOX Live session cleaned up", session_id)
