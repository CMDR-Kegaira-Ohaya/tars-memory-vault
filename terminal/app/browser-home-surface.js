(() => {
  const runtime = { contract: null };

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

  function resolveTemplate(value, input) {
    if (Array.isArray(value)) return value.map((item) => resolveTemplate(item, input));
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, resolveTemplate(nested, input)]));
    }
    if (value === "from-recent-save") return input.recentSave || "none";
    return value;
  }

  function deriveSurface(input) {
    const states = runtime.contract?.states || {};
    for (const stateConfig of Object.values(states)) {
      if (matches(stateConfig.match || {}, input)) {
        return resolveTemplate(stateConfig.derive || {}, input);
      }
    }
    return {
      title: "Terminal summary",
      mountChip: input.currentMount || "none",
      availabilityChip: input.exportSource || "disabled",
      detail: "Home surface presentation fallback.",
      recentSaveLabel: input.recentSave || "none"
    };
  }

  function extractRawState(container) {
    const rows = Array.from(container.querySelectorAll(':scope > div'));
    const state = {};
    let found = false;

    rows.forEach((row) => {
      const label = row.querySelector('.muted')?.textContent?.trim()?.replace(/:$/, "");
      if (!label) return;
      const value = row.textContent.replace(label, "").trim();
      found = true;
      switch (label) {
        case "mode": state.mode = value; break;
        case "current mount": state.currentMount = value; break;
        case "recent save": state.recentSave = value; break;
        case "save": state.save = value; break;
        case "export source": state.exportSource = value; break;
        case "export output": state.exportOutput = value; break;
        case "runs surface": state.runsSurface = value; break;
        case "notes": state.notesState = value; break;
        case "quick actions": state.quickActions = value; break;
      }
    });

    if (found) {
      container.dataset.rawSummary = JSON.stringify(state);
      return state;
    }

    try {
      return JSON.parse(container.dataset.rawSummary || "{}");
    } catch {
      return {};
    }
  }

  function render(surface, rawState, container) {
    const renderState = JSON.stringify({ surface, rawState });
    if (container.dataset.renderState === renderState) return;
    container.dataset.renderState = renderState;
    container.innerHTML = `
      <div class="surface-stack">
        <div class="surface-header">
          <div class="surface-title">${surface.title}</div>
          <span class="surface-chip">${surface.mountChip}</span>
        </div>
        <div class="surface-meta-grid">
          <div><span class="muted">availability</span> ${surface.availabilityChip}</div>
          <div><span class="muted">recent save</span> ${surface.recentSaveLabel}</div>
          <div><span class="muted">save</span> ${rawState.save || "disabled"}</div>
          <div><span class="muted">export</span> ${rawState.exportSource || "disabled"}</div>
          <div><span class="muted">notes</span> ${rawState.notesState || "disabled"}</div>
          <div><span class="muted">runs</span> ${rawState.runsSurface || "idle"}</div>
        </div>
        <div class="surface-detail">${surface.detail}</div>
        <div class="surface-foot muted">quick actions: ${rawState.quickActions || "none"}</div>
      </div>
    `;
  }

  function refresh() {
    const container = document.getElementById("homeSummary");
    if (!container) return;
    const rawState = extractRawState(container);
    const surface = deriveSurface(rawState);
    render(surface, rawState, container);
  }

  async function boot() {
    runtime.contract = await loadJson("app/home-surface.v1.json");
    refresh();
    const container = document.getElementById("homeSummary");
    if (container) {
      const observer = new MutationObserver(() => refresh());
      observer.observe(container, { childList: true, subtree: true, characterData: true });
    }
    window.setInterval(refresh, 1500);
  }

  boot().catch(() => {});
})();
