(() => {
  const runtime = { contract: null };
  const RAW_KEYS = [
    "surface", "displayMode", "source", "mountedKind", "renderer", "engine", "readOnly", "sessionPersistence", "viewState"
  ];

  function normalizePath(path) {
    return String(path || "").replace(/^terminal\//, "");
  }

  async function loadJson(path) {
    const response = await fetch(normalizePath(path));
    if (!response.ok) throw new Error(`failed to load ${path}`);
    return response.json();
  }

  function matches(match, input) {
    return Object.entries(match || {}).every(([key, expected]) => {
      const actual = input[key];
      if (expected === null) return actual == null;
      if (expected === "non-null") return actual != null;
      if (typeof expected === "string" && expected.includes("|")) {
        return expected.split("|").includes(String(actual));
      }
      return String(actual) === String(expected);
    });
  }

  function deriveSurface(input) {
    const states = runtime.contract?.states || {};
    for (const stateConfig of Object.values(states)) {
      if (matches(stateConfig.match || {}, input)) {
        return stateConfig.derive || {};
      }
    }
    return {
      title: "Runs surface",
      statusChip: input.viewState || "idle",
      runtimeLabel: input.displayMode || "unknown",
      persistenceLabel: input.sessionPersistence || "none",
      mutabilityLabel: input.readOnly === "true" ? "read only" : "interactive",
      detail: "Runs surface presentation fallback."
    };
  }

  function parseRawText(container) {
    const text = container.textContent || "";
    const looksRaw = RAW_KEYS.some((key) => text.includes(`${key}:`));
    if (looksRaw) {
      container.dataset.rawText = text;
    }
    const rawText = container.dataset.rawText || text;
    const result = {};
    rawText.split("\n").forEach((line) => {
      const parts = line.split(": ");
      if (parts.length < 2) return;
      const key = parts.shift();
      result[key] = parts.join(": ");
    });
    return result;
  }

  function render(surface, rawState, container) {
    const renderState = JSON.stringify({ surface, rawState });
    if (container.dataset.renderState === renderState) return;
    container.dataset.renderState = renderState;
    container.innerHTML = `
      <div class="surface-stack">
        <div class="surface-header">
          <div class="surface-title">${surface.title}</div>
          <span class="surface-chip">${surface.statusChip}</span>
        </div>
        <div class="surface-meta-grid">
          <div><span class="muted">source</span> ${rawState.source || "none"}</div>
          <div><span class="muted">runtime</span> ${surface.runtimeLabel}</div>
          <div><span class="muted">renderer</span> ${rawState.renderer || "none"}</div>
          <div><span class="muted">engine</span> ${rawState.engine || "none"}</div>
          <div><span class="muted">persistence</span> ${surface.persistenceLabel}</div>
          <div><span class="muted">mutability</span> ${surface.mutabilityLabel}</div>
        </div>
        <div class="surface-detail">${surface.detail}</div>
      </div>
    `;
  }

  function refresh() {
    const container = document.getElementById("runsViewport");
    if (!container) return;
    const rawState = parseRawText(container);
    const surface = deriveSurface(rawState);
    render(surface, rawState, container);
  }

  async function boot() {
    runtime.contract = await loadJson("app/runs-surface.v1.json");
    refresh();
    const container = document.getElementById("runsViewport");
    if (container) {
      const observer = new MutationObserver(() => refresh());
      observer.observe(container, { childList: true, subtree: true, characterData: true });
    }
    window.setInterval(refresh, 1500);
  }

  boot().catch(() => {});
})();
