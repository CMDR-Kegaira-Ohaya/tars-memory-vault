(() => {
  const shared = window.__TARS_COLLECTIONS__ || (window.__TARS_COLLECTIONS__ = {});
  const runtime = {
    contract: null,
    selectionContract: null,
    manifestIndex: null,
    manifestCache: new Map(),
    selectedEntry: null,
    selectedManifest: null,
    lastMountRequest: {
      status: "idle",
      detail: "no-mount-request-yet"
    }
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

  function getByPath(obj, path) {
    return String(path || "").split(".").reduce((acc, key) => {
      if (acc == null) return undefined;
      return acc[key];
    }, obj);
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
      title: "Collections browser",
      statusChip: input.selectedManifestId ? "resolved" : "idle",
      detail: "Collections browser presentation fallback.",
      mountAction: input.selectedManifestId ? "confirm" : "disabled"
    };
  }

  function readMountedSourcePath() {
    const viewport = document.getElementById("runsViewport");
    const rawText = viewport?.dataset?.rawText || viewport?.textContent || "";
    const line = rawText.split("\n").find((entry) => entry.startsWith("source: "));
    return line ? line.slice(8) : null;
  }

  function readCurrentMode() {
    const home = document.getElementById("homeSummary");
    try {
      const raw = JSON.parse(home?.dataset?.rawSummary || "{}");
      return raw.mode || "home";
    } catch {
      return "home";
    }
  }

  function validateSelectedManifest(entry, manifest) {
    const required = runtime.selectionContract?.manifestShape?.required || [];
    const missing = required.filter((path) => getByPath(manifest, path) == null);
    const selectionRoot = runtime.selectionContract?.selectionRoot || "collections/";
    const allowedSurfaces = runtime.selectionContract?.selectionSurfaces || [];
    const entryPath = String(manifest?.entry || "");
    const manifestSource = String(manifest?.source || "");
    const entryAllowed = entryPath.startsWith(selectionRoot) && (allowedSurfaces.length === 0 || allowedSurfaces.some((surface) => entryPath.startsWith(surface)));
    const sourceAllowed = manifestSource === "repo";
    return {
      valid: missing.length === 0 && sourceAllowed && entryAllowed && entry?.manifestId === manifest?.id,
      missing,
      sourceAllowed,
      entryAllowed
    };
  }

  async function ensureManifest(entry) {
    if (!entry) return null;
    if (runtime.manifestCache.has(entry.manifestPath)) {
      return runtime.manifestCache.get(entry.manifestPath);
    }
    const manifest = await loadJson(entry.manifestPath);
    runtime.manifestCache.set(entry.manifestPath, manifest);
    return manifest;
  }

  async function selectEntry(manifestId) {
    const entry = (runtime.manifestIndex?.entries || []).find((item) => item.manifestId === manifestId) || null;
    runtime.selectedEntry = entry;
    runtime.selectedManifest = entry ? await ensureManifest(entry) : null;
    render();
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

  function renderEntryButton(entry, manifest) {
    const button = document.createElement("button");
    button.className = "manifest-entry";
    if (runtime.selectedEntry?.manifestId === entry.manifestId) {
      button.dataset.selected = "true";
    }
    const title = manifest?.title || entry.manifestId;
    const type = manifest?.type || entry.type || "unknown";
    button.innerHTML = `
      <div class="surface-header">
        <div class="surface-title">${title}</div>
        <span class="surface-chip">${entry.category || "uncategorized"}</span>
      </div>
      <div class="manifest-entry-meta">
        <span>${type}</span>
        <span>${entry.source || manifest?.source || "repo"}</span>
        <span>${manifest?.save?.enabled ? "save" : "read-only"}</span>
      </div>
      <div class="surface-foot muted">${manifest?.entry || entry.entry}</div>
    `;
    button.addEventListener("click", () => {
      selectEntry(entry.manifestId).catch(showError);
    });
    return button;
  }

  async function renderList() {
    const container = document.getElementById("collectionsBrowserList");
    if (!container) return;
    container.innerHTML = "";

    const entries = runtime.manifestIndex?.entries || [];
    if (!entries.length) {
      container.innerHTML = `<div class="surface-foot muted">No canonical Collections manifests are currently indexed.</div>`;
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
        const manifest = runtime.manifestCache.get(entry.manifestPath) || null;
        group.appendChild(renderEntryButton(entry, manifest));
      }
      container.appendChild(group);
    }
  }

  function renderResolved() {
    const container = document.getElementById("collectionsResolvedSummary");
    const button = document.getElementById("collectionsMountConfirm");
    if (!container || !button) return;

    const validation = runtime.selectedEntry && runtime.selectedManifest
      ? validateSelectedManifest(runtime.selectedEntry, runtime.selectedManifest)
      : { valid: false, missing: [], sourceAllowed: false, entryAllowed: false };
    const mountedSourcePath = readMountedSourcePath();
    const input = {
      selectedManifestId: runtime.selectedManifest?.id || null,
      selectedEntryPath: runtime.selectedManifest?.entry || null,
      currentMountedEntryPath: mountedSourcePath,
      manifestValid: validation.valid,
      selectionMatchesMount: runtime.selectedManifest?.entry === mountedSourcePath
    };
    const surface = deriveSurface(input);

    if (!runtime.selectedEntry || !runtime.selectedManifest) {
      button.disabled = true;
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

    const manifest = runtime.selectedManifest;
    const saveTag = manifest?.save?.tag || manifest?.id || "none";
    const saveAvailability = manifest?.save?.enabled ? "enabled-or-conditional" : "disabled";
    button.disabled = !(surface.mountAction === "confirm" || surface.mountAction === "mounted");
    button.textContent = surface.mountAction === "mounted" ? "Mount selected again" : "Mount selected";

    container.innerHTML = `
      <div class="surface-stack">
        <div class="surface-header">
          <div class="surface-title">${manifest.title}</div>
          <span class="surface-chip">${surface.statusChip}</span>
        </div>
        <div class="surface-meta-grid">
          <div><span class="muted">mode</span> ${readCurrentMode()}</div>
          <div><span class="muted">manifest id</span> ${manifest.id}</div>
          <div><span class="muted">title</span> ${manifest.title}</div>
          <div><span class="muted">type</span> ${manifest.type}</div>
          <div><span class="muted">renderer</span> ${manifest.renderer || "none"}</div>
          <div><span class="muted">save tag</span> ${saveTag}</div>
          <div><span class="muted">save</span> ${saveAvailability}</div>
          <div><span class="muted">export source</span> conditional</div>
          <div><span class="muted">entry</span> ${manifest.entry}</div>
          <div><span class="muted">source</span> ${manifest.source}</div>
        </div>
        <div class="surface-detail">${surface.detail}</div>
        <div class="surface-foot muted">last mount request: ${runtime.lastMountRequest.status} — ${runtime.lastMountRequest.detail}</div>
        ${validation.valid ? "" : `<div class=\"surface-foot warn\">manifest validation failed${validation.missing.length ? ` (missing: ${validation.missing.join(", ")})` : ""}</div>`}
      </div>
    `;
  }

  function reorderSharedIndexToSelection() {
    const manifestIndex = shared.manifestIndex || runtime.manifestIndex;
    if (!manifestIndex?.entries || !runtime.selectedEntry) {
      return false;
    }
    const currentIndex = manifestIndex.entries.findIndex((entry) => entry.manifestId === runtime.selectedEntry.manifestId);
    if (currentIndex < 0) return false;
    if (currentIndex !== 0) {
      const [selected] = manifestIndex.entries.splice(currentIndex, 1);
      manifestIndex.entries.unshift(selected);
    }
    runtime.manifestIndex = manifestIndex;
    return true;
  }

  function requestMountSelected() {
    if (!runtime.selectedEntry || !runtime.selectedManifest) return;
    const validation = validateSelectedManifest(runtime.selectedEntry, runtime.selectedManifest);
    if (!validation.valid) {
      runtime.lastMountRequest = {
        status: "blocked",
        detail: "manifest-validation-failed"
      };
      renderResolved();
      return;
    }
    const reordered = reorderSharedIndexToSelection();
    if (!reordered) {
      runtime.lastMountRequest = {
        status: "blocked",
        detail: "shared-manifest-index-unavailable"
      };
      renderResolved();
      return;
    }
    const mountButton = document.getElementById("mountCartridge");
    if (!mountButton) {
      runtime.lastMountRequest = {
        status: "blocked",
        detail: "mount-button-unavailable"
      };
      renderResolved();
      return;
    }
    runtime.lastMountRequest = {
      status: "requested",
      detail: runtime.selectedManifest.id
    };
    mountButton.click();
    renderResolved();
  }

  function render() {
    renderList().catch(showError);
    renderResolved();
  }

  function showError(error) {
    const container = document.getElementById("collectionsResolvedSummary");
    if (container) {
      container.innerHTML = `<span class="warn">collections browser failed: ${error.message}</span>`;
    }
  }

  async function boot() {
    runtime.contract = await loadJson("app/collections-browser.v1.json");
    runtime.selectionContract = await loadJson("manifests/repo-manifest-selection.v1.json");
    runtime.manifestIndex = shared.manifestIndex || await loadJson("manifests/manifest-index.v1.json");
    shared.manifestIndex = runtime.manifestIndex;

    const entries = runtime.manifestIndex?.entries || [];
    await Promise.all(entries.map(async (entry) => {
      try {
        const manifest = await ensureManifest(entry);
        runtime.manifestCache.set(entry.manifestPath, manifest);
      } catch {
        // leave unresolved until selection
      }
    }));

    render();

    const button = document.getElementById("collectionsMountConfirm");
    if (button) {
      button.addEventListener("click", requestMountSelected);
    }

    const viewport = document.getElementById("runsViewport");
    if (viewport) {
      const observer = new MutationObserver(() => renderResolved());
      observer.observe(viewport, { childList: true, subtree: true, characterData: true });
    }
  }

  boot().catch(showError);
})();
