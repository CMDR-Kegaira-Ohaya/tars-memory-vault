import json, re
from pathlib import Path

INBOX = Path("ops/relay/inbox")
OUTBOX = Path("ops/relay/outbox")
STATE = Path("ops/relay/state.json")

# Manual tool is CURRENT-only (live surface).
MANUAL_BASE = Path("toolkit/manuals/tars-manual/current")
MANUAL_ROOT = Path("toolkit/manuals/tars-manual")  # for messaging only

MAX = 12000
TOP = 5

def trunc(s: str) -> str:
    return s if len(s) <= MAX else s[: MAX - 40] + "\n\n[truncated]\n"

def subpath(p: Path, b: Path) -> bool:
    try:
        p.resolve().relative_to(b.resolve())
        return True
    except Exception:
        return False

def manual_installed() -> bool:
    return MANUAL_BASE.exists() and (MANUAL_BASE / "TOC.md").exists()

def read_live_version() -> str:
    vp = MANUAL_BASE / "VERSION.md"
    if not vp.exists():
        return ""
    try:
        first = vp.read_text(encoding="utf-8").splitlines()[0].strip()
        return first
    except Exception:
        return ""

def heading(lines, i):
    for j in range(i, -1, -1):
        if re.match(r"^#{1,6}\s+", lines[j]):
            return lines[j].strip()
    return "(no heading)"

def iter_md(root: Path):
    for p in root.rglob("*.md"):
        if p.is_file():
            yield p

def cmd_help() -> str:
    return (
        "manual: help | versions | toc | search <q> | cite <q> | index <q> | "
        "open <path> [--heading \"...\"] [--lines N]\n"
        "Note: deprecated version tokens like 'v1' are not available; this tool uses CURRENT only.\n"
    )

def _split_deprecated_version_token(tokens):
    """
    If the final token looks like a legacy version request (v1, v2, ...),
    remove it and return (tokens_wo_version, notice_string).
    """
    if tokens and re.match(r"^v\d+$", tokens[-1], re.IGNORECASE):
        want = tokens[-1]
        notice = f"Deprecated versions not available; using current. (ignored: {want})\n"
        return tokens[:-1], notice
    return tokens, ""

def cmd_versions(notice: str = "") -> str:
    if not manual_installed():
        return "manual tool: not installed (need toolkit/manuals/tars-manual/current/TOC.md)\n"
    vid = read_live_version() or "(missing VERSION.md first line)"
    # Keep output very simple (often parsed by humans): version id on its own line.
    if notice:
        return notice + f"{vid}\n"
    return f"{vid}\n"

def cmd_toc(notice: str = "") -> str:
    if not manual_installed():
        return "manual tool: not installed (need toolkit/manuals/tars-manual/current/TOC.md)\n"
    p = MANUAL_BASE / "TOC.md"
    if not p.exists():
        return notice + "manual tool: TOC missing for current\n"
    return notice + "[current] TOC\n\n" + p.read_text(encoding="utf-8")

def do_search(notice: str, q: str) -> str:
    if not manual_installed():
        return "manual tool: not installed (need toolkit/manuals/tars-manual/current/TOC.md)\n"
    q = q.strip()
    if not q:
        return notice + "manual tool: missing query\n"
    ql = q.lower()
    hits = []
    for p in iter_md(MANUAL_BASE):
        t = p.read_text(encoding="utf-8")
        c = t.lower().count(ql)
        if c:
            hits.append((c, p, t))
    if not hits:
        return notice + f"[current] no hits for {q!r}\n"
    hits.sort(key=lambda x: (-x[0], x[1].as_posix()))
    out = [notice + f"[current] search {q!r} (top {min(TOP, len(hits))})"]
    for c, p, t in hits[:TOP]:
        lines = t.splitlines()
        idx = 0
        for i, ln in enumerate(lines):
            if ql in ln.lower():
                idx = i
                break
        out.append(
            f"- ({c}) {p.as_posix()} | {heading(lines, idx)} | {lines[idx].strip()[:180]}"
        )
    return "\n".join(out) + "\n"

def do_cite(notice: str, q: str) -> str:
    if not manual_installed():
        return "manual tool: not installed (need toolkit/manuals/tars-manual/current/TOC.md)\n"
    q = q.strip()
    if not q:
        return notice + "manual tool: missing query\n"
    ql = q.lower()
    best = None
    for p in iter_md(MANUAL_BASE):
        t = p.read_text(encoding="utf-8")
        c = t.lower().count(ql)
        if c and (best is None or c > best[0]):
            best = (c, p, t)
    if not best:
        return notice + f"[current] no hits for {q!r}\n"
    _, p, t = best
    lines = t.splitlines()
    idx = 0
    for i, ln in enumerate(lines):
        if ql in ln.lower():
            idx = i
            break
    h = heading(lines, idx)
    s = max(0, idx - 12)
    e = min(len(lines), idx + 40)
    ex = "\n".join(lines[s:e]).strip()
    return trunc(notice + f"[current] cite {q!r}\n\n{ex}\n\nCITE: current | {p.as_posix()} | {h}\n")

def do_index(notice: str, q: str) -> str:
    if not manual_installed():
        return "manual tool: not installed (need toolkit/manuals/tars-manual/current/TOC.md)\n"
    q = q.strip()
    if not q:
        return notice + "manual tool: missing query\n"
    ip = MANUAL_BASE / "CITATION_INDEX.md"
    if not ip.exists():
        return notice + "[current] CITATION_INDEX.md not found\n"
    t = ip.read_text(encoding="utf-8")
    ql = q.lower()
    lines = [ln.strip() for ln in t.splitlines() if ql in ln.lower()]
    if not lines:
        return notice + f"[current] index: no hits for {q!r}\n"
    return trunc(notice + f"[current] index hits for {q!r}\n\n" + "\n".join(lines[:TOP]) + "\n")

def do_open(notice: str, arg: str) -> str:
    if not manual_installed():
        return "manual tool: not installed (need toolkit/manuals/tars-manual/current/TOC.md)\n"

    m = re.search(r"--lines\s+(\d+)", arg)
    n = 80
    if m:
        try:
            n = max(10, min(400, int(m.group(1))))
        except Exception:
            n = 80
    mh = re.search(r'--heading\s+"([^"]+)"', arg)
    hq = mh.group(1).strip() if mh else None

    arg = re.sub(r"--lines\s+\d+", "", arg)
    arg = re.sub(r'--heading\s+"[^"]+"', "", arg).strip()
    if not arg:
        return notice + "manual tool: open requires path\n"

    p = Path(arg)

    # Allow either:
    # 1) paths relative to CURRENT root (recommended), or
    # 2) full repo paths, but ONLY if they still land under CURRENT.
    if arg.startswith("toolkit/manuals/tars-manual/"):
        target = Path(arg)
    else:
        target = MANUAL_BASE / p

    target = Path(target.as_posix().lstrip("/"))

    if not subpath(target, MANUAL_BASE):
        return notice + "manual tool: refused (outside CURRENT)\n"
    if not target.exists() or not target.is_file():
        return notice + f"manual tool: not found: {target.as_posix()}\n"

    t = target.read_text(encoding="utf-8")
    lines = t.splitlines()
    start = 0
    if hq:
        ql = hq.lower()
        for i, ln in enumerate(lines):
            if re.match(r"^#{1,6}\s+", ln) and ql in ln.lower():
                start = i
                break

    ex = "\n".join(lines[start : start + n]).rstrip()
    h = heading(lines, start)
    return trunc(notice + f"[current] open {target.as_posix()}\n\n{ex}\n\nCITE: current | {target.as_posix()} | {h}\n")

def handle_manual(data) -> str:
    if not manual_installed():
        return (
            "manual tool: not installed (need toolkit/manuals/tars-manual/current/TOC.md)\n"
            f"(base: {MANUAL_ROOT.as_posix()}/)\n"
        )

    body = (data.get("body") or "").strip()
    if not body:
        return cmd_help()

    if body.lower().startswith("manual:"):
        body = body.split(":", 1)[1].strip()

    toks = body.split()
    if not toks:
        return cmd_help()

    toks, notice = _split_deprecated_version_token(toks)
    if not toks:
        return cmd_help()

    cmd = toks[0].lower()
    rest = " ".join(toks[1:])

    if cmd == "help":
        return notice + cmd_help()
    if cmd == "versions":
        return cmd_versions(notice)
    if cmd == "toc":
        return cmd_toc(notice)
    if cmd == "search":
        return do_search(notice, rest)
    if cmd == "cite":
        return do_cite(notice, rest)
    if cmd == "index":
        return do_index(notice, rest)
    if cmd == "open":
        return do_open(notice, rest)

    return notice + cmd_help()

def main():
    INBOX.mkdir(parents=True, exist_ok=True)
    OUTBOX.mkdir(parents=True, exist_ok=True)

    state = {"last_processed": None}
    if STATE.exists():
        try:
            state = json.loads(STATE.read_text(encoding="utf-8"))
        except Exception:
            pass

    for mp in sorted(INBOX.glob("*.json")):
        data = json.loads(mp.read_text(encoding="utf-8"))
        ch = data.get("channel", "general")
        rtyp = "ack"
        rbody = "received"
        if ch == "manual":
            rtyp = "manual"
            rbody = handle_manual(data)

        reply = {
            "from": "tars",
            "to": data.get("from"),
            "channel": ch,
            "type": rtyp,
            "body": rbody,
            "in_reply_to": mp.name,
        }
        (OUTBOX / (mp.stem + ".reply.json")).write_text(
            json.dumps(reply, indent=2) + "\n", encoding="utf-8"
        )
        mp.unlink()
        state["last_processed"] = mp.name

    STATE.write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8")

if __name__ == "__main__":
    main()
