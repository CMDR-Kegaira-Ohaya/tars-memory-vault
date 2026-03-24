(() => {
  const runtime = {
    contract: null,
    surface: null,
  };

  function normalizePath(path) {
    return String(path || "").replace(/^terminal\//, "");
  }

  async function loadJson(path) {
    const response = await fetch(normalizePath(path));
    if (!response.ok) {
      throw new Error(`failed to load ${path}`);
    }
    return response.json();
  }

  function parseJsonText(text) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  function matches(match, input) {
    return Object.entries(match || {}).every(([key, expected]) => {
      const actual = input[key];
      if (expected === null) return actual == null;
      if (expected === "non-null") return actual != null;
      return String(actual) === String(expected);
    });
  }

  function resolveTemplate(value, input) {
    if (Array.isArray(value)) {
      return value.map((item) => resolveTemplate(item, input));
    }
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, resolveTemplate(nested, input)]));
    }
    if (typeof value !== "string") {
      return value;
    }
    switch (value) {
      case "from-current-save-tag":
        return input.currentSaveTag;
      case "from-history-path":
        return input.historyPath || "none";
      case "from-verified-response-path":
        return input.verifiedResponsePath || "none";
      default:
        return value;
    }
  }

  function deriveSurface(input) {
    const states = runtime.contract?.states || {};
    for (const stateConfig of Object.values(states)) {
      if (matches(stateConfig.match || {}, input)) {
        return resolveTemplate(stateConfig.derive || {}, input);
      }
    }
    return {
      status: "unknown",
      saveTag: input.currentSaveTag,
      historyPath: input.historyPath || "none",
      verifiedResponsePath: input.verifiedResponsePath || "none",
      source: "dedicated-runtime-field"
    };
  }

  function readSaveBridgeRequest() {
    return parseJsonText(document.getElementById("saveBridgePreview")?.textContent || "");
  }

  function readRepoVerifiedPreview() {
    return parseJsonText(document.getElementById("repoVerifiedPreview")?.textContent || "");
  }

  function buildInput() {
    const saveBridgeRequest = readSaveBridgeRequest();
    const repoVerifiedPreview = readRepoVerifiedPreview();
    const currentSaveTag = saveBridgeRequest?.saveTag || repoVerifiedPreview?.repoVerifiedStatus?.saveTag || null;
    return {
      currentSaveTag,
      historyPath: currentSaveTag ? `terminal/saves/${currentSaveTag}/request-history-index.v1.json` : null,
      verifiedResponsePath: currentSaveTag ? `terminal/saves/${currentSaveTag}/repo-write-response.v1.json` : null
    };
  }

  function render(surface) {
    runtime.surface = surface;
    const target = document.getElementById("mountedSaveContextPreview");
    if (!target) return;
    target.textContent = JSON.stringify(surface, null, 2);
    target.dataset.saveTag = surface.saveTag || "";
  }

  async function refresh() {
    render(deriveSurface(buildInput()));
  }

  async function boot() {
    runtime.contract = await loadJson("app/mounted-save-context.v1.json");
    await refresh();

    const observerTargets = [
      document.getElementById("saveBridgePreview"),
      document.getElementById("repoVerifiedPreview")
    ].filter(Boolean);

    const observer = new MutationObserver(() => {
      refresh().catch(() => {});
    });
    observerTargets.forEach((target) => observer.observe(target, { childList: true, subtree: true, characterData: true }));

    window.setInterval(() => {
      refresh().catch(() => {});
    }, 1500);
  }

  boot().catch((error) => {
    const target = document.getElementById("mountedSaveContextPreview");
    if (target) {
      target.textContent = JSON.stringify({
        status: "bootstrap-error",
        message: error.message,
        source: "dedicated-runtime-field"
      }, null, 2);
    }
  });
})();
