(() => {
  const runtime = {
    contract: null,
    boardsMode: null,
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
      title: "Boards mode guardrails",
      stateChip: "inactive",
      detail: "Boards guardrails presentation fallback.",
      saveExplanation: "No active explanation.",
      exportSummary: "No active export summary."
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
    const save = readStatusLine("SAVE");
    const exportSource = readStatusLine("EXPORT SOURCE");
    const exportOutput = readStatusLine("EXPORT OUTPUT");
    const mode = readStatusLine("MODE");
    return {
      currentMode: mode ? mode.toLowerCase() : "home",
      mountedKind: mount ? mount.toLowerCase() : null,
      sourceClass: source && source.startsWith("work/dev/projects/") ? "repo-board" : null,
      saveState: save ? save.toLowerCase() : "disabled",
      exportSourceState: exportSource ? exportSource.toLowerCase() : "disabled",
      exportOutputState: exportOutput ? exportOutput.toLowerCase() : "placeholder-disabled"
    };
  }

  function render() {
    const summary = document.getElementById("boardsGuardrailsSummary");
    const popup = document.getElementById("boardsSaveExplanationPopup");
    const popupText = document.getElementById("boardsSaveExplanationText");
    if (!summary || !popup || !popupText) return;

    const input = readInput();
    const surface = deriveSurface(input);
    popupText.textContent = surface.saveExplanation;

    summary.innerHTML = `
      <div class="surface-stack">
        <div class="surface-header">
          <div class="surface-title">${surface.title}</div>
          <span class="surface-chip">${surface.stateChip}</span>
        </div>
        <div class="surface-detail">${surface.detail}</div>
        <div class="surface-foot"><span class="muted">save explanation</span> ${surface.saveExplanation}</div>
        <div class="surface-foot"><span class="muted">export</span> ${surface.exportSummary}</div>
      </div>
    `;
  }

  function showPopup() {
    const popup = document.getElementById("boardsSaveExplanationPopup");
    if (!popup) return;
    popup.open = true;
  }

  function hidePopup() {
    const popup = document.getElementById("boardsSaveExplanationPopup");
    if (!popup) return;
    popup.open = false;
  }

  function onDocumentClick(event) {
    const target = event.target instanceof Element ? event.target.closest("button[data-guardrail-action]") : null;
    if (!target) return;
    if (target.dataset.guardrailAction !== "disabled-save-explained") return;
    event.preventDefault();
    event.stopPropagation();
    showPopup();
  }

  async function boot() {
    runtime.contract = await loadJson("app/boards-guardrails.v1.json");
    runtime.boardsMode = await loadJson("app/boards-mode.v1.json");
    render();

    document.addEventListener("click", onDocumentClick, true);
    document.getElementById("boardsSaveExplanationDismiss")?.addEventListener("click", hidePopup);

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
