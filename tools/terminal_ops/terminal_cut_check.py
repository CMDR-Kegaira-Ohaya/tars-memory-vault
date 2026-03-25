import os


def scan_for_missing_imports(root="."):
    issues = []
    for dirpath, _, files in os.walk(root):
        for f in files:
            if f.endswith(".js"):
                p = os.path.join(dirpath, f)
                with open(p, "r", encoding="utf-8", errors="ignore") as fh:
                    content = fh.read()
                if "import" in content and "./" in content:
                    # naive check placeholder
                    pass
    return issues


if __name__ == "__main__":
    print(scan_for_missing_imports())
