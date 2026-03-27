(() => {
  const shared = window.__TARS_CARTRIDGE_BAY__ || (window.__TARS_CARTRIDGE_BAY__ = {});
  const runtime = {
    contract: null,
    manifestIndex: null,
    manifestCache: new Map(),
    selectedManifestId: null,
  };

  const DEV_ENTRIES = [
    {
      manifestId: "dev/request-history",
      category: "dev cartridges",
      kind: "dev-cartridge",
      title: "Request History",
      type: "dev-cartridge",
      source: "terminal",
      entry: "surface://request-history",
      screen: "request-history",
      save: { enabled: false },
      mountable: true,
    },
    {
      manifestId: "dev/repo-verified",
      category: "dev cartridges",
      kind: "dev-cartridge",
      title: "Repo Verified",
      type: "dev-cartridge",
      source: "terminal",
      entry: "surface://repo-verified",
      screen: "repo-verified",
      save: { enabled: false },
      mountable: true,
    },
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
      title: "Cartridge bay",
      statusChip: "idle",
      detail: "Manifest-backed repo cartridge selector.",
      selectionAction: "select",
    };
  }

  function getCollectionsRuntimeApi() {
    return window.__TARS_COLLECTIONS__?.runtimeApi || null;
  }

  function getResolvedSelection() {
    const runtimeApi = getCollectionsRuntimeApi();
    if (!runtimeApi?.getResolvedSelection) return null;
    try {
      return runtimeApi.getResolvedSelection();
    } catch {
      return null;
    }
  }

  function allRepoEntries() {
    return runtime.manifestIndex?.entries || [];
  }

  function allEntries() {
    return [...DEV_ENTRIES, ...allRepoEntries()];
  }

  function groupEntries(entries) {
    const groups = new Map();
    for (const entry of entries || []) {
      const category = entry.category || "uncategorized";
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(entry);
    }
    return Array.from(groups.entries());
  }

  function isDevEntry(entryOrId) {
    const manifestId = typeof entryOrId === "string" ? entryOrId : entryOrId?.manifestId;
    return DEV_ENTRIES.some((entry) => entry.manifestId === manifestId);
  }

  function getEntryById(manifestId) {
    return allEntries().find((entry) => entry.manifestId === manifestId) || null;
  }

  async function getManifestMeta(entry) {
    if (!entry || isDevEntry(entry)) return entry;
    if (!entry.manifestPath) return entry;
    if (!runtime.manifestCache.has(entry.manifestPath)) {
      const manifest = await loadJson(entry.manifestPath).catch(() => null);
      runtime.manifestCache.set(entry.manifestPath, manifest);
    }
    return runtime.manifestCache.get(entry.manifestPath) || entry;
  }

  function getSelectedEntry() {
    return getEntryById(runtime.selectedManifestId);
  }

  function getSelectedDevEntry() {
    const selected = getSelectedEntry();
    return isDevEntry(selected) ? selected : null;
  }

  function getActiveScreen() {
    return window.__TARS_SCREEN_UI__?.activeScreen || "home";
  }

  async function selectManifest(manifestId, { syncCollections = true } = {}) {
    runtime.selectedManifestId = manifestId || null;
    const runtimeApi = getCollectionsRuntimeApi();
    if (syncCollections && runtimeApi?.selectManifestById && manifestId && !isDevEntry(manifestId)) {
      await runtimeApi.selectManifestById(manifestId);
    }
    render();
  }

  function openSelectedDevCartridge() {
    const entry = getSelectedDevEntry();
    if (!entry?.screen) return false;
    window.dispatchEvent(new CustomEvent("tars:screen-request", { detail: { screen: entry.screen } }));
    return true;
  }

  function renderEntryButton(entry, meta) {
    const button = document.createElement("button");
    button.className = "manifest-entry";
    if (runtime.selectedManifestId === entry.manifestId) {
      button.dataset.selected = "true";
    }

    const title = meta?.title || entry.title || entry.manifestId;
    const type = meta?.type || entry.type || "unknown";
    const source = meta?.source || entry.source || "repo";
    const saveLabel = meta?.save?.enabled ? "save" : (entry.mountable ? "mountable" : "read-only");

    button.innerHTML = `
      <div class="surface-header">
        <div class="surface-title">${title}</div>
        <span class="surface-chip">${entry.category || "uncategorized"}</span>
      </div>
      <div class="manifest-entry-meta">
        <span>${type}</span>
        <span>${source}</span>
        <span>${saveLabel}</span>
      </div>
      <div class="surface-foot muted">${meta?.entry || entry.entry || "none"}</div>
    `;

    button.addEventListener("click", () => {
      selectManifest(entry.manifestId).catch(showError);
    });

    return button;
  }

  async function renderList() {
    const container = document.getElementById("cartridgeBayList");
    if (!container) return;
    container.innerHTML = "";

    const entries = allEntries();
    if (!entries.length) {
      container.innerHTML = `<div class="surface-foot muted">No mountable cartridges are indexed.</div>`;
      return;
    }

    for (const [category, items] of groupEntries(entries)) {
      const group = document.createElement("div");
      group.className = "manifest-group";
      const title = document.createElement("div");
      title.className = "manifest-group-title";
      title.textContent = category;
      group.appendChild(title);

      for (const entry of items) {
        const meta = await getManifestMeta(entry);
        group.appendChild(renderEntryButton(entry, meta));
      }

      container.appendChild(group);
    }
  }

  function renderSummary() {
    const container = document.getElementById("cartridgeBaySummary");
    if (!container) return;

    const selected = getSelectedEntry();
    const resolved = getResolvedSelection();

    if (!selected) {
      const surface = deriveSurface({
        selectedManifestId: null,
        resolvedManifestId: resolved?.manifestId || null,
      });
      container.innerHTML = `
        <div class="surface-stack">
          <div class="surface-header">
            <div class="surface-title">${surface.title}</div>
            <span class="surface-chip">${surface.statusChip}</span>
          </div>
          <div class="surface-detail">${surface.detail}</div>
        </div>
      `;
      return;
    }

    if (isDevEntry(selected)) {
      container.innerHTML = `
        <div class="surface-stack">
          <div class="surface-header">
            <div class="surface-title">${selected.title}</div>
            <span class="surface-chip">dev cartridge</span>
          </div>
          <div class="surface-meta-grid">
            <div><span class="muted">selected</span> ${selected.manifestId}</div>
            <div><span class="muted">screen</span> ${selected.screen}</div>
            <div><span class="muted">entry</span> ${selected.entry}</div>
            <div><span class="muted">mount</span> direct in-terminal</div>
          </div>
          <div class="surface-detail">A opens the selected Dev cartridge directly into the main screen.</div>
        </div>
      `;
      return;
    }

    const surface = deriveSurface({
      selectedManifestId: runtime.selectedManifestId,
      resolvedManifestId: resolved?.manifestId || null,
    });

    container.innerHTML = `
      <div class="surface-stack">
        <div class="surface-header">
          <div class="surface-title">${surface.title}</div>
          <span class="surface-chip">${surface.statusChip}</span>
        </div>
        <div class="surface-meta-grid">
          <div><span class="muted">selected</span> ${runtime.selectedManifestId}</div>
          <div><span class="muted">resolved</span> ${resolved?.manifestId || "none"}</div>
          <div><span class="muted">entry</span> ${selected.entry || "none"}</div>
          <div><span class="muted">handoff</span> collections resolve flow</div>
        </div>
        <div class="surface-detail">${surface.detail}</div>
      </div>
    `;
  }

  function render() {
    renderList().catch(showError);
    renderSummary();
  }

  function showError(error) {
    const container = document.getElementById("cartridgeBaySummary");
    if (container) {
      container.innerHTML = `<span class="warn">cartridge bay failed: ${error.message}</span>`;
    }
  }

  function injectLegacyDevStyles() {
    if (document.getElementById("terminal-dev-cartridge-style")) return;
    const style = document.createElement("style");
    style.id = "terminal-dev-cartridge-style";
    style.textContent = `
      .terminal-legacy-dev-button {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function looksLegacyDevButton(button) {
    const text = String(button?.textContent || "").trim().toLowerCase();
    const actionKey = String(button?.dataset?.actionKey || "").trim().toLowerCase();
    return ["request history", "repo verified"].includes(text) || ["request-history", "repo-verified"].includes(actionKey);
  }

  function hideLegacyDevButtons() {
    injectLegacyDevStyles();
    ["nav", "terminalScreenTabs", "actions"].forEach((id) => {
      const host = document.getElementById(id);
      if (!host) return;
      host.querySelectorAll("button").forEach((button) => {
        if (looksLegacyDevButton(button)) {
          button.classList.add("terminal-legacy-dev-button");
          button.tabIndex = -1;
          button.setAttribute("aria-hidden", "true");
        }
      });
    });
  }

  function interceptPrimaryControl(event) {
    const button = event.target?.closest?.("#terminalControlPad .control-pad-button");
    if (!button) return;
    if (String(button.textContent || "").trim() !== "A") return;
    if (getActiveScreen() !== "cartridge-bay") return;
    if (!getSelectedDevEntry()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openSelectedDevCartridge();
  }

  function installDomHooks() {
    hideLegacyDevButtons();
    document.addEventListener("click", interceptPrimaryControl, true);

    ["nav", "terminalScreenTabs", "actions"].forEach((id) => {
      const host = document.getElementById(id);
      if (!host) return;
      const observer = new MutationObserver(() => hideLegacyDevButtons());
      observer.observe(host, { childList: true, subtree: true, attributes: true, characterData: true });
    });

    [
      "tars:screen-changed",
      "tars:devtools-changed",
      "tars:request-history-updated",
      "tars:repo-verified-updated",
    ].forEach((eventName) => window.addEventListener(eventName, hideLegacyDevButtons));
  }

  async function boot() {
    runtime.contract = await loadJson("app/cartridge-bay.v1.json");
    runtime.manifestIndex = await loadJson("manifests/manifest-index.v1.json");
    const resolved = getResolvedSelection();
    runtime.selectedManifestId = resolved?.manifestId || null;

    shared.contract = runtime.contract;
    shared.manifestIndex = runtime.manifestIndex;
    shared.runtimeApi = {
      getSelectedEntry,
      isDevEntry,
      openSelectedDevCartridge,
      selectManifestById: (manifestId) => selectManifest(manifestId, { syncCollections: !isDevEntry(manifestId) }),
    };

    render();
    installDomHooks();
  }

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", () => boot().catch(showError), { once: true });
  } else {
    boot().catch(showError);
  }
})();