# Relay terminal (repo-based)

Folders
- ops/relay/inbox/   (drop JSON messages here)
- ops/relay/outbox/  (worker replies land here)
- ops/relay/state.json (cursor)

Message format (JSON)
{
  "from": "op-a" | "op-b",
  "channel": "general" | "manual" | "hub",
  "type": "note" | "request",
  "body": "text"
}

Behavior
- Adding a file to ops/relay/inbox/*.json triggers the Relay workflow.
- The worker writes a response JSON into ops/relay/outbox/ and deletes the inbox file.
