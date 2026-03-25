# minimal codemod placeholder


def remove_import_line(path, symbol):
    with open(path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    out = [l for l in lines if symbol not in l]

    with open(path, "w", encoding="utf-8") as f:
        f.writelines(out)


if __name__ == "__main__":
    pass
