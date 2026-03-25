import ast


def slice_file(path):
    with open(path, "r", encoding="utf-8") as f:
        tree = ast.parse(f.read())

    funcs = [n.name for n in tree.body if isinstance(n, ast.FunctionDef)]
    print("Functions:", funcs)


if __name__ == "__main__":
    import sys
    slice_file(sys.argv[1])
