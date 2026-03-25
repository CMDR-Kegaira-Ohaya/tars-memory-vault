(() => {
  const shared = window.__TARS_CARTRIDGE_BAY__ || (window.__TARS_CARTRIDGE_BAY__ = {});
  const runtime = {
    contract: null,
    manifestIndex: null,
    selectedManifestId: null
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
      title: "Cartridge bay",
      statusChip: "idle",
      detail: "Manifest-backed repo cartridge selector.",
      selectionAction: "select"
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

  function groupEntries(entries) {
    const groups = new Map();
    for (const entry of entries || []) {
      const category = entry.category || "uncategorized";
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(entry);
    }
    return Array.from(groups.entries());
  }

  async function selectManifest(manifestId) {
    runtime.selectedManifestId = manifestId || null;
    const runtimeApi = getCollectionsRuntimeApi();
    if (runtimeApi?.selectManifestById && manifestId) {
      await runtimeApi.selectManifestById(manifestId);
    }
    render();
  }

  function renderEntryButton(entry, manifest) {
    const button = document.createElement("button");
    button.className = "manifest-entry";
    if (runtime.selectedManifestId === entry.manifestId) {
      button.dataset.selected = "true";
    }
    const title = manifest?.title || entry.manifestId;
    const type = manifest?.type || entry.type || "unknown";
    const source = manifest?.source || entry.source || "repo";
    const saveLabel = manifest?.save?.enabled ? "save" : "read-only";
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
      <div class="surface-foot muted">${manifest?.entry || entry.entry}</div>
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
    const entries = runtime.manifestIndex?.entries || [];
    if (!entries.length) {
      container.innerHTML = `<div class="surface-foot muted">No manifest-backed repo cartridges are indexed.</div>`;
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
        let manifest = null;
        try {
          manifest = await loadJson(entry.manifestPath);
        } catch {
          manifest = null;
        }
        group.appendChild(renderEntryButton(entry, manifest));
      }

      container.appendChild(group);
    }
  }

  function renderSummary() {
    const container = document.getElementById("cartridgeBaySummary");
    if (!container) return;
    const resolved = getResolvedSelection();
    const input = {
      selectedManifestId: runtime.selectedManifestId,
      resolvedManifestId: resolved?.manifestId || null
    };
    const surface = deriveSurface(input);

    if (!runtime.selectedManifestId) {
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

    const manifestEntry = (runtime.manifestIndex?.entries || []).find(
      (entry) => entry.manifestId === runtime.selectedManifestId
    ) || null;

    container.innerHTML = `
      <div class="surface-stack">
        <div class="surface-header">
          <div class="surface-title">${surface.title}</div>
          <span class="surface-chip">${surface.statusChip}</span>
        </div>
        <div class="surface-meta-grid">
          <div><span class="muted">selected</span> ${runtime.selectedManifestId}</div>
          <div><span class="muted">resolved</span> ${resolved?.manifestId || "none"}</div>
          <div><span class="muted">entry</span> ${manifestEntry?.entry || "none"}</div>
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

  async function boot() {
    runtime.contract = await loadJson("app/cartridge-bay.v1.json");
    runtime.manifestIndex = await loadJson("manifests/manifest-index.v1.json");
    const resolved = getResolvedSelection();
    runtime.selectedManifestId = resolved?.manifestId || null;
    shared.contract = runtime.contract;
    shared.manifestIndex = runtime.manifestIndex;
    render();
  }

  boot().catch(showError);
})();
