import json, re
from pathlib import Path

INBOX = Path("ops/relay/inbox")
OUTBOX = Path("ops/relay/outbox")
STATE = Path("ops/relay/state.json")

BASE = Path("toolkit/manuals/tars-manual")
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

def versions():
    if not BASE.exists():
        return []
    vs = [p for p in BASE.iterdir() if p.is_dir() and re.match(r"^v\d+$", p.name)]
    vs.sort(key=lambda p: int(p.name[1:]))
    out = []
    for v in vs:
        c = []
        if (v / "TOC.md").exists():
            c.append(v)
        for s in v.iterdir():
            if s.is_dir() and (s / "TOC.md").exists():
                c.append(s)
        if c:
            c.sort(key=lambda p: p.name)
            out.append((v.name, c[-1]))
    return out

def latest():
    vs = versions()
    return vs[-1] if vs else None

def heading(lines, i):
    for j in range(i, -1, -1):
        if re.match(r"^#{1,6}\s+", lines[j]):
            return lines[j].strip()
    return "(no heading)"

def iter_md(root: Path):
    for p in root.rglob("*.md"):
        if p.is_file():
            yield p

def cmd_help():
    return (
        'manual: help | versions | toc [vN] | search <q> [vN] | cite <q> [vN] | '
        'index <q> [vN] | open <path> [--heading "..." ] [--lines N] [vN]\n'
    )

def select(tokens):
    if tokens and re.match(r"^v\d+$", tokens[-1]):
        want = tokens[-1]
        d = dict(versions())
        if want in d:
            return (want, d[want]), tokens[:-1]
    return latest(), tokens

def cmd_versions():
    vs = versions()
    if not vs:
        return "manual tool: not installed\n"
    return "manual versions:\n" + "\n".join([f"- {v}: {r.as_posix()}" for v, r in vs]) + "\n"

def cmd_toc(v):
    vl, root = v
    p = root / "TOC.md"
    return f"[{vl}] TOC\n\n" + p.read_text(encoding="utf-8") if p.exists() else f"manual tool: TOC missing for {vl}\n"

def do_search(v, q):
    vl, root = v
    q = q.strip()
    if not q:
        return "manual tool: missing query\n"
    ql = q.lower()
    hits = []
    for p in iter_md(root):
        t = p.read_text(encoding="utf-8")
        c = t.lower().count(ql)
        if c:
            hits.append((c, p, t))
    if not hits:
        return f"[{vl}] no hits for {q!r}\n"
    hits.sort(key=lambda x: (-x[0], x[1].as_posix()))
    out = [f"[{vl}] search {q!r} (top {min(TOP, len(hits))})"]
    for c, p, t in hits[:TOP]:
        lines = t.splitlines()
        idx = 0
        for i, ln in enumerate(lines):
            if ql in ln.lower():
                idx = i
                break
        out.append(f"- ({c}) {p.as_posix()} | {heading(lines, idx)} | {lines[idx].strip()[:180]}")
    return "\n".join(out) + "\n"

def do_cite(v, q):
    vl, root = v
    q = q.strip()
    if not q:
        return "manual tool: missing query\n"
    ql = q.lower()
    best = None
    for p in iter_md(root):
        t = p.read_text(encoding="utf-8")
        c = t.lower().count(ql)
        if c and (best is None or c > best[0]):
            best = (c, p, t)
    if not best:
        return f"[{vl}] no hits for {q!r}\n"
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
    return trunc(f"[{vl}] cite {q!r}\n\n{ex}\n\nCITE: {vl} | {p.as_posix()} | {h}\n")

def do_index(v, q):
    vl, root = v
    q = q.strip()
    if not q:
        return "manual tool: missing query\n"
    cand = []
    if (root / "CITATION_INDEX.md").exists():
        cand.append(root / "CITATION_INDEX.md")
    vdir = root.parent if root.parent.name == vl else None
    if vdir and (vdir / "CITATION_INDEX.md").exists():
        cand.append(vdir / "CITATION_INDEX.md")
    if not cand:
        return f"[{vl}] CITATION_INDEX.md not found\n"
    t = cand[0].read_text(encoding="utf-8")
    ql = q.lower()
    lines = [ln.strip() for ln in t.splitlines() if ql in ln.lower()]
    if not lines:
        return f"[{vl}] index: no hits for {q!r}\n"
    return trunc(f"[{vl}] index hits for {q!r}\n\n" + "\n".join(lines[:TOP]) + "\n")

def do_open(v, arg):
    vl, root = v
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
        return "manual tool: open requires path\n"

    p = Path(arg)
    target = p if arg.startswith("toolkit/manuals/tars-manual/") else (root / p)
    target = Path(target.as_posix().lstrip("/"))

    if not subpath(target, BASE):
        return "manual tool: refused (outside base)\n"
    if not target.exists() or not target.is_file():
        return f"manual tool: not found: {target.as_posix()}\n"

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
    return trunc(f"[{vl}] open {target.as_posix()}\n\n{ex}\n\nCITE: {vl} | {target.as_posix()} | {h}\n")

def handle_manual(data):
    if latest() is None:
        return "manual tool: not installed (need toolkit/manuals/tars-manual/vN/.../TOC.md)\n"
    body = (data.get("body") or "").strip()
    if not body:
        return cmd_help()
    if body.lower().startswith("manual:"):
        body = body.split(":", 1)[1].strip()
    toks = body.split()
    if not toks:
        return cmd_help()
    v, toks = select(toks)
    if v is None:
        return "manual tool: no versions installed\n"
    cmd = toks[0].lower()
    rest = " ".join(toks[1:])
    if cmd == "help":
        return cmd_help()
    if cmd == "versions":
        return cmd_versions()
    if cmd == "toc":
        return cmd_toc(v)
    if cmd == "search":
        return do_search(v, rest)
    if cmd == "cite":
        return do_cite(v, rest)
    if cmd == "index":
        return do_index(v, rest)
    if cmd == "open":
        return do_open(v, rest)
    return cmd_help()

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
        rtype = "ack"
        rbody = "received"
        if ch == "manual":
            rtype = "manual"
            rbody = handle_manual(data)

        reply = {
            "from": "tars",
            "to": data.get("from"),
            "channel": ch,
            "type": rtype,
            "body": rbody,
            "in_reply_to": mp.name,
        }
        (OUTBOX / (mp.stem + ".reply.json")).write_text(json.dumps(reply, indent=2) + "\n", encoding="utf-8")
        mp.unlink()
        state["last_processed"] = mp.name

    STATE.write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8")

if __name__ == "__main__":
    main()
