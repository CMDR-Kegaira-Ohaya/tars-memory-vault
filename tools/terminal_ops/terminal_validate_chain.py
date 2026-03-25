#!/usr/bin/env python3

import argparse
import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
ENTRY_AUDIT = ROOT / "terminal_entry_audit.mjs"
CUT_CHECK = ROOT / "terminal_cut_check.mjs"
LIVE_SMOKE = ROOT / "terminal_live_smoke.py"


def run_step(name, cmd):
    proc = subprocess.run(cmd, capture_output=True, text=True)
    return {
        "name": name,
        "cmd": cmd,
        "returncode": proc.returncode,
        "stdout": proc.stdout.strip(),
        "stderr": proc.stderr.strip(),
        "ok": proc.returncode == 0,
    }


def main():
    parser = argparse.ArgumentParser(description="Run the terminal validation chain.")
    parser.add_argument("--skip-live-smoke", action="store_true", help="Skip the live Pages smoke probe.")
    parser.add_argument("--root", default="terminal", help="Root path for cut-check.")
    args = parser.parse_args()

    steps = [
        run_step("entry-audit", ["node", str(ENTRY_AUDIT), "terminal/index.html"]),
        run_step("cut-check", ["node", str(CUT_CHECK), args.root]),
    ]

    if not args.skip_live_smoke:
        steps.append(run_step("live-smoke", [sys.executable, str(LIVE_SMOKE)]))

    overall_ok = all(step["ok"] for step in steps)

    summary = {
        "overall_ok": overall_ok,
        "steps": steps,
    }

    print(json.dumps(summary, indent=2))

    if not overall_ok:
        raise SystemExit("terminal_validate_chain FAILED")


if __name__ == "__main__":
    main()
