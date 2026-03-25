import requests
from bs4 import BeautifulSoup

URLS = [
    "https://cmdr-kegaira-ohaya.github.io/tars-memory-vault/",
    "https://cmdr-kegaira-ohaya.github.io/tars-memory-vault/terminal/index.html",
]

EXPECTED_MARKERS = [
    "SYSTEM / ADVANCED",
    "Status",
]


def check_url(url):
    r = requests.get(url, timeout=10)
    status = r.status_code
    text = r.text

    soup = BeautifulSoup(text, "html.parser")
    scripts = [s.get("src") for s in soup.find_all("script") if s.get("src")]

    markers = {m: (m in text) for m in EXPECTED_MARKERS}

    return {
        "url": url,
        "status": status,
        "scripts": scripts,
        "markers": markers,
    }


if __name__ == "__main__":
    results = [check_url(u) for u in URLS]
    for r in results:
        print(r)
