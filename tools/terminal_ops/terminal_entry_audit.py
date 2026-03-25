from bs4 import BeautifulSoup


def audit_index(path="terminal/index.html"):
    with open(path, "r", encoding="utf-8") as f:
        html = f.read()

    soup = BeautifulSoup(html, "html.parser")

    scripts = [s.get("src") for s in soup.find_all("script") if s.get("src")]
    css = [l.get("href") for l in soup.find_all("link") if l.get("href")]

    print("JS entrypoints:", scripts)
    print("CSS:", css)


if __name__ == "__main__":
    audit_index()
