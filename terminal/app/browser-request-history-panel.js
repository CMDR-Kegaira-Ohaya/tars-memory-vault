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

  function parseJson(text) {
    try { return JSON.parse(text); } catch { return null; }
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
      if (matches(stateConfig.match || {}, input)) return stateConfig.derive || {};
    }
    return {
      title: "Request history",
      statusChip: input.status || "unknown",
      detail: "Request history presentation fallback.",
      chainLabel: "history"
    };
  }

  function readPanelState() {
    return parseJson(document.getElementById("requestHistoryPreview")?.textContent || "") || {};
  }

  function renderList(entries, listEl) {
    listEl.innerHTML = "";
    if (!entries.length) {
      listEl.innerHTML = `<div class="surface-foot muted">No indexed request chain is currently available.</div>`;
      return;
    }
    const wrapper = document.createElement("div");
    wrapper.className = "surface-list";
    entries.forEach((entry) => {
      const item = document.createElement("div");
      item.className = "surface-list-item";
      item.innerHTML = `
        <div class="surface-header">
          <div class="surface-title">${entry.order}. ${entry.kind}</div>
          <span class="surface-chip">${entry.status}</span>
        </div>
        <div class="surface-foot muted">${entry.path}</div>
      `;
      wrapper.appendChild(item);
    });
    listEl.appendChild(wrapper);
  }

  function render(surface, panelState, summaryEl, listEl) {
    const renderState = JSON.stringify({ surface, panelState });
    if (summaryEl.dataset.renderState === renderState) return;
    summaryEl.dataset.renderState = renderState;
    summaryEl.innerHTML = `
      <div class="surface-stack">
        <div class="surface-header">
          <div class="surface-title">${surface.title}</div>
          <span class="surface-chip">${surface.statusChip}</span>
        </div>
        <div class="surface-meta-grid">
          <div><span class="muted">save tag</span> ${panelState.surface?.saveTag || "none"}</div>
          <div><span class="muted">entries</span> ${panelState.surface?.entryCount || 0}</div>
          <div><span class="muted">history path</span> ${panelState.surface?.historyPath || "none"}</div>
          <div><span class="muted">chain</span> ${surface.chainLabel}</div>
        </div>
        <div class="surface-detail">${surface.detail}</div>
      </div>
    `;
    renderList(panelState.historyIndex?.entries || [], listEl);
  }

  function refresh() {
    const summaryEl = document.getElementById("requestHistorySummary");
    const listEl = document.getElementById("requestHistoryList");
    if (!summaryEl || !listEl) return;
    const panelState = readPanelState();
    const surface = deriveSurface({
      status: panelState.surface?.status || "disabled",
      entryCount: panelState.surface?.entryCount || 0,
      saveTag: panelState.surface?.saveTag || null
    });
    render(surface, panelState, summaryEl, listEl);
  }

  async function boot() {
    runtime.contract = await loadJson("app/request-history-panel.v1.json");
    refresh();
    const preview = document.getElementById("requestHistoryPreview");
    if (preview) {
      const observer = new MutationObserver(() => refresh());
      observer.observe(preview, { childList: true, subtree: true, characterData: true });
    }
    window.setInterval(refresh, 1500);
  }

  boot().catch(() => {});
})();
