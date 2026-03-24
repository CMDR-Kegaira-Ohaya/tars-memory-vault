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
      title: "Repo verification",
      statusChip: input.status || "unknown",
      detail: "Repo verification presentation fallback.",
      trustLabel: input.trusted ? "trusted" : "review"
    };
  }

  function readPanelState() {
    return parseJson(document.getElementById("repoVerifiedPreview")?.textContent || "") || {};
  }

  function render(surface, panelState, container) {
    const rawState = panelState.repoVerifiedStatus || {};
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
          <div><span class="muted">save tag</span> ${rawState.saveTag || "none"}</div>
          <div><span class="muted">trust</span> ${surface.trustLabel}</div>
          <div><span class="muted">verified head</span> ${rawState.verifiedHead || "none"}</div>
          <div><span class="muted">paths verified</span> ${Array.isArray(rawState.pathsVerified) ? rawState.pathsVerified.length : 0}</div>
        </div>
        <div class="surface-detail">${surface.detail}</div>
        <div class="surface-foot muted">Repo-verified state remains distinct from local apply markers.</div>
      </div>
    `;
  }

  function refresh() {
    const container = document.getElementById("repoVerifiedSummary");
    if (!container) return;
    const panelState = readPanelState();
    const rawState = panelState.repoVerifiedStatus || {};
    const surface = deriveSurface({
      status: rawState.status || "none",
      trusted: rawState.trusted === true,
      pathsCount: Array.isArray(rawState.pathsVerified) ? rawState.pathsVerified.length : 0
    });
    render(surface, panelState, container);
  }

  async function boot() {
    runtime.contract = await loadJson("app/repo-verified-panel.v1.json");
    refresh();
    const preview = document.getElementById("repoVerifiedPreview");
    if (preview) {
      const observer = new MutationObserver(() => refresh());
      observer.observe(preview, { childList: true, subtree: true, characterData: true });
    }
    window.setInterval(refresh, 1500);
  }

  boot().catch(() => {});
})();
