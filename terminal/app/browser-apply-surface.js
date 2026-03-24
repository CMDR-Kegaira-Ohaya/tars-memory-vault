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
      title: "Save apply",
      statusChip: input.status || "unknown",
      detail: "Apply surface presentation fallback.",
      trustLabel: input.verificationRequired ? "verification required" : "none",
      nextStep: "Inspect staged save state."
    };
  }

  function readApplyState() {
    return parseJson(document.getElementById("applyStatusPreview")?.textContent || "") || {};
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
          <div><span class="muted">consent</span> ${rawState.consentGranted}</div>
          <div><span class="muted">verification</span> ${surface.trustLabel}</div>
          <div><span class="muted">handoff</span> ${rawState.handoffTarget || "none"}</div>
          <div><span class="muted">repo handler</span> ${rawState.repoHandlerTarget || "none"}</div>
        </div>
        <div class="surface-detail">${surface.detail}</div>
        <div class="surface-foot muted">next: ${surface.nextStep}</div>
      </div>
    `;
  }

  function refresh() {
    const container = document.getElementById("applyStatusSummary");
    if (!container) return;
    const rawState = readApplyState();
    const surface = deriveSurface({
      status: rawState.status || "disabled",
      consentGranted: rawState.consentGranted,
      verificationRequired: rawState.verificationRequired
    });
    render(surface, rawState, container);
  }

  async function boot() {
    runtime.contract = await loadJson("app/apply-surface.v1.json");
    refresh();
    const preview = document.getElementById("applyStatusPreview");
    if (preview) {
      const observer = new MutationObserver(() => refresh());
      observer.observe(preview, { childList: true, subtree: true, characterData: true });
    }
    window.setInterval(refresh, 1500);
  }

  boot().catch(() => {});
})();
