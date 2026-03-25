import requests
from bs4 import BeautifulSoup

URLS = [
    "https://cmdr-kegaira-ohaya.github.io/tars-memory-vault/",
    "https://cmdr-kegaira-ohaya.github.io/tars-memory-vault/terminal/index.html",
]

EXPECTED_MARKERS = [
    "STATUS STRIP",
    "ACTIONS",
]

CRITICAL_SCRIPTS = [
    "browser-runtime.js",
    "browser-action-surface.js",
]


def check_url(url):
    result = {
        "url": url,
        "status": None,
        "scripts": [],
        "missing_scripts": [],
        "markers": {},
        "ok": True,
        "errors": [],
    }

    try:
        r = requests.get(url, timeout=10)
        result["status"] = r.status_code

        if r.status_code != 200:
            result["ok"] = False
            result["errors"].append(f"HTTP {r.status_code}")
            return result

        text = r.text
        soup = BeautifulSoup(text, "html.parser")

        scripts = [s.get("src") for s in soup.find_all("script") if s.get("src")]
        result["scripts"] = scripts

        for cs in CRITICAL_SCRIPTS:
            if not any(cs in s for s in scripts if s):
                result["missing_scripts"].append(cs)

        if result["missing_scripts"]:
            result["ok"] = False
            result["errors"].append("missing critical scripts")

        for m in EXPECTED_MARKERS:
            present = m in text
            result["markers"][m] = present
            if not present:
                result["ok"] = False
                result["errors"].append(f"missing marker: {m}")

    except Exception as e:
        result["ok"] = False
        result["errors"].append(str(e))

    return result


if __name__ == "__main__":
    results = [check_url(u) for u in URLS]

    overall_ok = True

    for r in results:
        print("---")
        print(f"URL: {r['url']}")
        print(f"Status: {r['status']}")
        print(f"OK: {r['ok']}")
        if r["errors"]:
            print("Errors:", r["errors"])

        if not r["ok"]:
            overall_ok = False

    if not overall_ok:
        raise SystemExit("terminal_live_smoke FAILED")
    else:
        print("terminal_live_smoke PASSED")
