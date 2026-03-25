#!/usr/bin/env node

(() => {
  const runtime = { contract: null };
  const RAW_KEYS = [
    "surface", "displayMode", "source", "mountedKind", "renderer", "engine", "readOnly", "sessionPersistence", "viewState"
  ];
  const devtoolsKey = "__TARS_DEVTOOLS__";
  const devtools = window[devtoolsKey] || (window[devtoolsKey] = {
    mountedCartridge: null,
    requestHistorySurface: null,
  });

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

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderDefaultSurface(surface, rawState, container) {
    const renderState = JSON.stringify({ type: "default", surface, rawState });
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

  function renderRequestHistoryCartridge(container) {
    const data = devtools.requestHistorySurface || {
      surface: {
        status: "idle",
        saveTag: null,
        historyPath: "none",
        entryCount: 0,
        detail: "request-history-unavailable"
      },
      entries: [],
      historyIndex: null,
      mountedSaveContext: null
    };

    const renderState = JSON.stringify({ type: "request-history", data });
    if (container.dataset.renderState === renderState) return;
    container.dataset.renderState = renderState;

    const entries = data.entries || [];
    const entriesHtml = entries.length
      ? entries.map((entry) => `
          <div class="surface-list-item">
            <div><span class="muted">${entry.order || "-"}.</span> ${escapeHtml(entry.kind || "unknown")} — ${escapeHtml(entry.status || "unknown")}</div>
            <div class="muted">${escapeHtml(entry.path || "none")}</div>
          </div>
        `).join("")
      : `<div class="muted">${data.surface?.saveTag ? "history index unavailable" : "no mounted save slot"}</div>`;

    container.innerHTML = `
      <div class="surface-stack">
        <div class="surface-header">
          <div class="surface-title">Request History Cartridge</div>
          <span class="surface-chip">${escapeHtml(data.surface?.status || "unknown")}</span>
        </div>
        <div class="surface-meta-grid">
          <div><span class="muted">save tag</span> ${escapeHtml(data.surface?.saveTag || "none")}</div>
          <div><span class="muted">entry count</span> ${data.surface?.entryCount ?? 0}</div>
          <div><span class="muted">discovery path</span> ${escapeHtml(data.surface?.historyPath || "none")}</div>
          <div><span class="muted">detail</span> ${escapeHtml(data.surface?.detail || "none")}</div>
        </div>
        <div class="surface-detail">Dev surface mounted into the main viewport.</div>
        <div class="surface-list">${entriesHtml}</div>
        <details class="inspector-panel">
          <summary>Open raw preview</summary>
          <pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>
        </details>
      </div>
    `;
  }

  function refresh() {
    const container = document.getElementById("runsViewport");
    if (!container) return;

    if (devtools.mountedCartridge === "request-history") {
      renderRequestHistoryCartridge(container);
      return;
    }

    const rawState = parseRawText(container);
    const surface = deriveSurface(rawState);
    renderDefaultSurface(surface, rawState, container);
  }

  async function boot() {
    runtime.contract = await loadJson("app/runs-surface.v1.json");
    refresh();
    const container = document.getElementById("runsViewport");
    if (container) {
      const observer = new MutationObserver(() => refresh());
      observer.observe(container, { childList: true, subtree: true, characterData: true });
    }
    window.addEventListener("tars:devtools-changed", refresh);
    window.addEventListener("tars:request-history-updated", refresh);
    window.setInterval(refresh, 1500);
  }

  boot().catch(() => {});
})();
