(() => {
  const runtime = { contract: null };
  const rawKeys = [
    "surface",
    "displayMode",
    "source",
    "mountedKind",
    "renderer",
    "engine",
    "readOnly",
    "sessionPersistence",
    "viewState",
  ];
  const devtoolsKey = "__TARS_DEVTOOLS__";
  const devtools = window[devtoolsKey] || (window[devtoolsKey] = {
    mountedCartridge: null,
    requestHistorySurface: null,
    repoVerifiedSurface: null,
  });
  const screenUiKey = "__TARS_SCREEN_UI__";
  const screenUi = window[screenUiKey] || (window[screenUiKey] = { activeScreen: "home" });

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
      detail: "Runs surface presentation fallback.",
    };
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function setRawText(container, text) {
    container.dataset.rawText = text;
  }

  function renderHtml(container, type, payload, html, rawText = "") {
    const renderState = JSON.stringify({ type, payload });
    if (container.dataset.renderState === renderState) {
      if (rawText) setRawText(container, rawText);
      return;
    }
    container.dataset.renderState = renderState;
    if (rawText) setRawText(container, rawText);
    container.innerHTML = html;
  }

  function parseHomeRawState() {
    const home = document.getElementById("homeSummary");
    try {
      return JSON.parse(home?.dataset?.rawSummary || "{}");
    } catch {
      return {};
    }
  }

  function parseRawText(container) {
    const text = container.textContent || "";
    const looksRaw = rawKeys.some((key) => text.includes(`${key}:`));
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

  function mirrorScreenSource(container, type, sourceId, rawText, footerText = "") {
    const source = document.getElementById(sourceId);
    const sourceHtml =
      source?.innerHTML?.trim() ||
      `<div class="surface-stack"><div class="surface-detail">Source panel unavailable.</div></div>`;
    renderHtml(
      container,
      type,
      { sourceId, sourceHtml, footerText, rawText },
      `${sourceHtml}${footerText ? `<div class="surface-foot muted">${escapeHtml(footerText)}</div>` : ""}`,
      rawText,
    );
  }

  function renderHomeScreen(container) {
    const raw = parseHomeRawState();
    const rawText = [
      `source: ${raw.currentMount || "none"}`,
      `mode: ${raw.mode || "home"}`,
      `save: ${raw.save || "disabled"}`,
      `export: ${raw.exportSource || "disabled"}`,
    ].join("\n");
    mirrorScreenSource(container, "home", "homeSummary", rawText);
  }

  function renderCartridgeBayScreen(container) {
    const raw = parseHomeRawState();
    const rawText = [
      `source: ${raw.currentMount || "none"}`,
      "mode: cartridge-bay",
    ].join("\n");
    mirrorScreenSource(
      container,
      "cartridge-bay",
      "cartridgeBaySummary",
      rawText,
      "A hands the selected cartridge into Collections.",
    );
  }

  function renderCollectionsScreen(container) {
    const raw = parseHomeRawState();
    const mountButton = document.getElementById("collectionsMountConfirm");
    const rawText = [
      `source: ${raw.currentMount || "none"}`,
      `mode: ${raw.mode || "collections"}`,
    ].join("\n");
    mirrorScreenSource(
      container,
      "collections",
      "collectionsResolvedSummary",
      rawText,
      mountButton && !mountButton.disabled ? "A mounts the current collection." : "Select a collection in the rail to enable A.",
    );
  }

  function renderBoardsScreen(container) {
    const raw = parseHomeRawState();
    const mountButton = document.getElementById("boardsMountConfirm");
    const rawText = [
      `source: ${raw.currentMount || "none"}`,
      `mode: ${raw.mode || "boards"}`,
    ].join("\n");
    mirrorScreenSource(
      container,
      "boards",
      "boardsResolvedSummary",
      rawText,
      mountButton && !mountButton.disabled ? "A mounts the current board." : "Select a board in the rail to enable A.",
    );
  }

  function openScreen(screen) {
    const shellApi = window.__TARS_COLLECTIONS__?.runtimeApi || null;
    if (shellApi?.setActiveScreen) {
      shellApi.setActiveScreen(screen);
      return;
    }
    window.dispatchEvent(new CustomEvent("tars:screen-request", { detail: { screen } }));
  }

  function renderLoadScreen(container) {
    const payload = {
      mode: "load",
      options: ["repo-load", "external-load"],
    };
    renderHtml(
      container,
      "load",
      payload,
      `
        <div class="surface-stack screen-context">
          <div class="surface-header">
            <div class="surface-title">Load</div>
            <span class="surface-chip">entry menu</span>
          </div>
          <div class="surface-detail screen-copy">
            Choose how you want to bring material into the terminal. Repo Load opens existing repo-backed entries. External Load opens the import path for local or outside material.
          </div>
          <div class="load-option-grid">
            <button type="button" class="load-option-button" data-load-target="collections">
              <div class="load-option-title">Repo Load</div>
              <div class="load-option-copy">Browse repo-backed material through the catalogue and mount an existing entry.</div>
            </button>
            <button type="button" class="load-option-button" data-load-target="import-bay">
              <div class="load-option-title">External Load</div>
              <div class="load-option-copy">Open the import path for local files or external material, then stage or prepare a save request.</div>
            </button>
          </div>
          <div class="surface-foot muted">Loading from repo is not the same as authenticated repo write.</div>
        </div>
      `,
      "source: load\nmode: load"
    );

    container.querySelectorAll("[data-load-target]").forEach((button) => {
      if (button.dataset.loadBound === "true") return;
      button.dataset.loadBound = "true";
      button.addEventListener("click", () => openScreen(button.dataset.loadTarget));
    });
  }

  function renderRequestHistoryCartridge(container) {
    const data = devtools.requestHistorySurface || {
      surface: {
        status: "idle",
        saveTag: null,
        historyPath: "none",
        entryCount: 0,
        detail: "request-history-unavailable",
      },
      entries: [],
    };

    const entries = data.entries || [];
    const entriesHtml = entries.length
      ? entries.map((entry) => `
          <div class="surface-list-item">
            <div><span class="muted">${entry.order || "-"}. </span>${escapeHtml(entry.kind || "unknown")} — ${escapeHtml(entry.status || "unknown")}</div>
            <div class="muted">${escapeHtml(entry.path || "none")}</div>
          </div>
        `).join("")
      : `<div class="muted">${data.surface?.saveTag ? "history index unavailable" : "no mounted save slot"}</div>`;

    renderHtml(
      container,
      "request-history",
      data,
      `
        <div class="surface-stack screen-context screen-context-dev">
          <div class="surface-header">
            <div class="surface-title">Request History</div>
            <span class="surface-chip">${escapeHtml(data.surface?.status || "unknown")}</span>
          </div>
          <div class="surface-meta-grid">
            <div><span class="muted">save tag</span> ${escapeHtml(data.surface?.saveTag || "none")}</div>
            <div><span class="muted">entry count</span> ${data.surface?.entryCount ?? 0}</div>
            <div><span class="muted">discovery path</span> ${escapeHtml(data.surface?.historyPath || "none")}</div>
            <div><span class="muted">detail</span> ${escapeHtml(data.surface?.detail || "none")}</div>
          </div>
          <div class="surface-list">${entriesHtml}</div>
        </div>
      `,
      `source: ${data.surface?.historyPath || "none"}\nmode: request-history`
    );
  }

  function renderRepoVerifiedCartridge(container) {
    const data = devtools.repoVerifiedSurface || {
      repoVerifiedStatus: {
        consumed: false,
        status: "idle",
        detail: "repo-verified-unavailable",
        saveTag: null,
        verifiedHead: "none",
        pathsVerified: [],
        trusted: false,
      },
    };
    const status = data.repoVerifiedStatus || {};
    const paths = Array.isArray(status.pathsVerified) ? status.pathsVerified : [];
    const pathsHtml = paths.length
      ? paths.map((path) => `<div class="surface-list-item"><div>${escapeHtml(path)}</div></div>`).join("")
      : `<div class="muted">no verified paths recorded</div>`;

    renderHtml(
      container,
      "repo-verified",
      data,
      `
        <div class="surface-stack screen-context screen-context-dev">
          <div class="surface-header">
            <div class="surface-title">Repo Verified</div>
            <span class="surface-chip">${escapeHtml(status.status || "unknown")}</span>
          </div>
          <div class="surface-meta-grid">
            <div><span class="muted">consumed</span> ${escapeHtml(String(status.consumed))}</div>
            <div><span class="muted">save tag</span> ${escapeHtml(status.saveTag || "none")}</div>
            <div><span class="muted">verified head</span> ${escapeHtml(status.verifiedHead || "none")}</div>
            <div><span class="muted">trusted</span> ${escapeHtml(String(status.trusted))}</div>
            <div><span class="muted">paths verified</span> ${paths.length}</div>
            <div><span class="muted">detail</span> ${escapeHtml(status.detail || "none")}</div>
          </div>
          <div class="surface-list">${pathsHtml}</div>
        </div>
      `,
      `source: ${status.verifiedHead || "none"}\nmode: repo-verified`
    );
  }

  function renderDefaultSurface(container) {
    const rawState = parseRawText(container);
    const surface = deriveSurface(rawState);
    renderHtml(
      container,
      "default",
      { surface, rawState },
      `
        <div class="surface-stack">
          <div class="surface-header">
            <div class="surface-title">${escapeHtml(surface.title || "Runs surface")}</div>
            <span class="surface-chip">${escapeHtml(surface.statusChip || "idle")}</span>
          </div>
          <div class="surface-meta-grid">
            <div><span class="muted">source</span> ${escapeHtml(rawState.source || "none")}</div>
            <div><span class="muted">runtime</span> ${escapeHtml(surface.runtimeLabel || "unknown")}</div>
            <div><span class="muted">renderer</span> ${escapeHtml(rawState.renderer || "none")}</div>
            <div><span class="muted">engine</span> ${escapeHtml(rawState.engine || "none")}</div>
            <div><span class="muted">persistence</span> ${escapeHtml(surface.persistenceLabel || "none")}</div>
            <div><span class="muted">mutability</span> ${escapeHtml(surface.mutabilityLabel || "interactive")}</div>
          </div>
          <div class="surface-detail screen-copy">${escapeHtml(surface.detail || "Runs surface presentation fallback.")}</div>
        </div>
      `
    );
  }

  function getActiveScreen() {
    if (devtools.mountedCartridge === "request-history") return "request-history";
    if (devtools.mountedCartridge === "repo-verified") return "repo-verified";
    return screenUi.activeScreen || "home";
  }

  function refresh() {
    const container = document.getElementById("runsViewport");
    if (!container) return;

    const activeScreen = getActiveScreen();
    if (["debug-intake", "import-bay", "collections-explorer"].includes(activeScreen)) {
      return;
    }

    switch (activeScreen) {
      case "home":
        renderHomeScreen(container);
        return;
      case "cartridge-bay":
        renderCartridgeBayScreen(container);
        return;
      case "collections":
        renderCollectionsScreen(container);
        return;
      case "boards":
        renderBoardsScreen(container);
        return;
      case "load":
        renderLoadScreen(container);
        return;
      case "request-history":
        renderRequestHistoryCartridge(container);
        return;
      case "repo-verified":
        renderRepoVerifiedCartridge(container);
        return;
      default:
        renderDefaultSurface(container);
    }
  }

  async function boot() {
    runtime.contract = await loadJson("app/runs-surface.v1.json").catch(() => null);
    refresh();

    const container = document.getElementById("runsViewport");
    if (container) {
      const observer = new MutationObserver(() => {
        if (["debug-intake", "import-bay", "collections-explorer"].includes(getActiveScreen())) return;
        refresh();
      });
      observer.observe(container, { childList: true, subtree: true, characterData: true });
    }

    [
      "tars:screen-changed",
      "tars:devtools-changed",
      "tars:request-history-updated",
      "tars:repo-verified-updated",
      "tars:home-updated",
      "tars:cartridge-bay-updated",
      "tars:collections-updated",
      "tars:boards-updated",
    ].forEach((eventName) => window.addEventListener(eventName, refresh));

    window.setInterval(() => {
      if (["debug-intake", "import-bay", "collections-explorer"].includes(getActiveScreen())) return;
      refresh();
    }, 1500);
  }

  boot().catch(() => {});
})();