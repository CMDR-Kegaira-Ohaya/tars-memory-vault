import json
from pathlib import Path

INBOX = Path("ops/relay/inbox")
OUTBOX = Path("ops/relay/outbox")
STATE = Path("ops/relay/state.json")


def main():
    INBOX.mkdir(parents=True, exist_ok=True)
    OUTBOX.mkdir(parents=True, exist_ok=True)

    state = {"last_processed": None}
    if STATE.exists():
        try:
            state = json.loads(STATE.read_text(encoding="utf-8"))
        except Exception:
            pass

    msgs = sorted(INBOX.glob("*.json"))
    for msg_path in msgs:
        data = json.loads(msg_path.read_text(encoding="utf-8"))
        reply = {
            "from": "tars",
            "to": data.get("from"),
            "channel": data.get("channel", "general"),
            "type": "ack",
            "body": "received",
            "in_reply_to": msg_path.name,
        }
        out_path = OUTBOX / (msg_path.stem + ".reply.json")
        out_path.write_text(json.dumps(reply, indent=2) + "\n", encoding="utf-8")
        msg_path.unlink()
        state["last_processed"] = msg_path.name

    STATE.write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
