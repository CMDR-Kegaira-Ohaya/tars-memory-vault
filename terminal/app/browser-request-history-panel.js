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
      title: "Request History",
      statusChip: input.status || "unknown",
      detail: "Request history presentation fallback.",
      chainLabel: "history",
    };
  }

  function readPanelState() {
    return parseJson(document.getElementById("requestHistoryPreview")?.textContent || "") || {};
  }

  function humanizeKind(kind) {
    const map = {
      "staged-request": "Terminal staged request",
      "apply-handoff": "Apply handoff",
      "repo-handler": "Authenticated repo handler",
      "handler-response": "Handler response",
      "verified-status-ingest": "Repo Verified surface",
    };
    return map[String(kind || "")] || String(kind || "history item").replace(/-/g, " ");
  }

  function humanizeStatus(status) {
    return String(status || "unknown").replace(/-/g, " ");
  }

  function summarizeChain(entries) {
    const kinds = new Set((entries || []).map((entry) => entry.kind));
    const parts = [];
    if (kinds.has("staged-request")) parts.push("staged request");
    if (kinds.has("apply-handoff")) parts.push("handoff");
    if (kinds.has("repo-handler")) parts.push("handler");
    if (kinds.has("handler-response")) parts.push("response");
    if (!parts.length) return "request artifacts";
    return parts.join(" → ");
  }

  function recommendNextStep(panelState) {
    const surface = panelState.surface || {};
    const entries = panelState.historyIndex?.entries || [];
    if (!surface.saveTag) {
      return "Open Collections Explorer, select the item you want, mount it, then return here.";
    }
    if (!entries.length) {
      return "No indexed request chain is loaded yet. Refresh the catalogue or remount the item if you expected a save/apply chain.";
    }
    if (entries.some((entry) => entry.kind === "handler-response")) {
      return "The request chain is present. Open Repo Verified next if you want the authenticated repo confirmation.";
    }
    return "Use this screen to inspect the chain only. Use Collections Explorer for normal content browsing.";
  }

  function renderList(entries, listEl) {
    listEl.innerHTML = "";
    if (!entries.length) {
      listEl.innerHTML = `<div class="surface-foot muted">No indexed request chain is currently available for the mounted item.</div>`;
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "surface-list";

    entries.forEach((entry) => {
      const item = document.createElement("div");
      item.className = "surface-list-item";
      item.innerHTML = `
        <div class="surface-header">
          <div class="surface-title">${entry.order}. ${humanizeKind(entry.kind)}</div>
          <span class="surface-chip">${humanizeStatus(entry.status)}</span>
        </div>
        <div class="surface-detail">${entry.recordedAt || "time not recorded"}</div>
        <div class="surface-foot muted">${entry.path}</div>
      `;
      wrapper.appendChild(item);
    });

    listEl.appendChild(wrapper);
  }

  function render(surface, panelState, summaryEl, listEl) {
    const entries = panelState.historyIndex?.entries || [];
    const nextStep = recommendNextStep(panelState);
    const chainSummary = summarizeChain(entries);
    const renderState = JSON.stringify({ surface, saveTag: panelState.surface?.saveTag, entryCount: entries.length, nextStep, chainSummary });
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
          <div><span class="muted">entries</span> ${entries.length}</div>
          <div><span class="muted">history path</span> ${panelState.surface?.historyPath || "none"}</div>
          <div><span class="muted">chain</span> ${entries.length ? chainSummary : surface.chainLabel}</div>
        </div>
        <div class="surface-detail">${surface.detail}</div>
        <div class="surface-foot muted">Next step: ${nextStep}</div>
      </div>
    `;

    renderList(entries, listEl);
  }

  function refresh() {
    const summaryEl = document.getElementById("requestHistorySummary");
    const listEl = document.getElementById("requestHistoryList");
    if (!summaryEl || !listEl) return;

    const panelState = readPanelState();
    const surface = deriveSurface({
      status: panelState.surface?.status || "disabled",
      entryCount: panelState.surface?.entryCount || 0,
      saveTag: panelState.surface?.saveTag || null,
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

    [
      "tars:request-history-updated",
      "tars:screen-changed",
      "tars:devtools-changed",
      "tars:collections-updated",
    ].forEach((eventName) => window.addEventListener(eventName, () => refresh()));

    window.setInterval(refresh, 1500);
  }

  boot().catch(() => {});
})();
