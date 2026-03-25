(() => {
  const runtime = {
    contract: null,
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
      title: "Export controls",
      stateChip: "inactive",
      detail: "Export controls presentation fallback.",
      sourceSummary: "No active export source path.",
      outputSummary: "No active export output path.",
      outputExplanation: "No active placeholder explanation."
    };
  }

  function readStatusLine(prefix) {
    const text = document.getElementById("statusStrip")?.textContent || "";
    const line = text.split("\n").find((entry) => entry.startsWith(`${prefix}: `));
    return line ? line.slice(prefix.length + 2).trim() : null;
  }

  function readInput() {
    const source = readStatusLine("SOURCE");
    const mount = readStatusLine("MOUNT");
    const mode = readStatusLine("MODE");
    const exportSource = readStatusLine("EXPORT SOURCE");
    const exportOutput = readStatusLine("EXPORT OUTPUT");
    return {
      currentMode: mode ? mode.toLowerCase() : "home",
      mountedKind: mount ? mount.toLowerCase() : null,
      sourceClass: source && source.startsWith("work/dev/projects/") ? "repo-board" : source && source.startsWith("collections/") ? "repo-cartridge" : null,
      exportSourceState: exportSource ? exportSource.toLowerCase() : "disabled",
      exportOutputState: exportOutput ? exportOutput.toLowerCase() : "placeholder-disabled"
    };
  }

  function render() {
    const summary = document.getElementById("exportControlsSummary");
    const popup = document.getElementById("exportOutputExplanationPopup");
    const popupText = document.getElementById("exportOutputExplanationText");
    if (!summary || !popup || !popupText) return;

    const surface = deriveSurface(readInput());
    popupText.textContent = surface.outputExplanation;
    summary.innerHTML = `
      <div class="surface-stack">
        <div class="surface-header">
          <div class="surface-title">${surface.title}</div>
          <span class="surface-chip">${surface.stateChip}</span>
        </div>
        <div class="surface-detail">${surface.detail}</div>
        <div class="surface-foot"><span class="muted">export source</span> ${surface.sourceSummary}</div>
        <div class="surface-foot"><span class="muted">export output</span> ${surface.outputSummary}</div>
      </div>
    `;
  }

  function showPopup() {
    const popup = document.getElementById("exportOutputExplanationPopup");
    if (popup) popup.open = true;
  }

  function hidePopup() {
    const popup = document.getElementById("exportOutputExplanationPopup");
    if (popup) popup.open = false;
  }

  function onDocumentClick(event) {
    const target = event.target instanceof Element ? event.target.closest("button[data-guardrail-action]") : null;
    if (!target) return;
    if (target.dataset.guardrailAction !== "placeholder-export-output-explained") return;
    event.preventDefault();
    event.stopPropagation();
    showPopup();
  }

  async function boot() {
    runtime.contract = await loadJson("app/export-controls.v1.json");
    render();

    document.addEventListener("click", onDocumentClick, true);
    document.getElementById("exportOutputExplanationDismiss")?.addEventListener("click", hidePopup);

    const strip = document.getElementById("statusStrip");
    if (strip) {
      const observer = new MutationObserver(() => render());
      observer.observe(strip, { childList: true, subtree: true, characterData: true });
    }

    const actions = document.getElementById("actions");
    if (actions) {
      const observer = new MutationObserver(() => render());
      observer.observe(actions, { childList: true, subtree: true, characterData: true, attributes: true });
    }
  }

  boot().catch(() => {});
})();
