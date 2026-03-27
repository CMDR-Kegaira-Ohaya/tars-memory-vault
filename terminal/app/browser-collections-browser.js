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
      detail: "no-mount-request-yet",
    },
  };

  function normalizePath(path) {
    return String(path || "").replace(/^terminal\//, "");
  }

  async function loadJson(path) {
    const response = await fetch(normalizePath(path));
    if (!response.ok) throw new Error(`failed to load ${path}`);
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
      mountAction: input.selectedManifestId ? "confirm" : "disabled",
    };
  }

  function getShellScreen() {
    return String(window.__TARS_SCREEN_UI__?.activeScreen || "home");
  }

  function isRepoLoadScreen() {
    return getShellScreen() === "repo-load";
  }

  function getRuntimeApi() {
    return shared.runtimeApi || null;
  }

  function requestScreen(screen) {
    window.dispatchEvent(new CustomEvent("tars:screen-request", { detail: { screen } }));
  }

  function emitCollectionsUpdated() {
    window.dispatchEvent(new CustomEvent("tars:collections-updated"));
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

  function readMountedSourcePath() {
    const viewport = document.getElementById("runsViewport");
    const rawText = viewport?.dataset?.rawText || viewport?.textContent || "";
    const line = rawText.split("\n").find((entry) => entry.startsWith("source: "));
    return line ? line.slice(8) : null;
  }

  function getResolvedSelection() {
    const runtimeApi = getRuntimeApi();
    if (!runtimeApi?.getResolvedSelection) return null;
    try {
      const resolved = runtimeApi.getResolvedSelection();
      return resolved?.manifestId ? resolved : null;
    } catch {
      return null;
    }
  }

  function syncLocalSelectionWithRuntime() {
    const resolved = getResolvedSelection();
    if (!resolved?.manifestId) return;
    const entry = (runtime.manifestIndex?.entries || []).find((item) => item.manifestId === resolved.manifestId) || null;
    if (entry) runtime.selectedEntry = entry;
    if (resolved.manifest) {
      runtime.selectedManifest = resolved.manifest;
      if (entry?.manifestPath) runtime.manifestCache.set(entry.manifestPath, resolved.manifest);
    }
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

  function validateSelectedManifest(entry, manifest) {
    const required = runtime.selectionContract?.manifestShape?.required || [];
    const missing = required.filter((path) => getByPath(manifest, path) == null);
    const selectionRoot = runtime.selectionContract?.selectionRoot || "collections/";
    const allowedSurfaces = runtime.selectionContract?.selectionSurfaces || [];
    const entryPath = String(manifest?.entry || "");
    const manifestSource = String(manifest?.source || "");
    const entryAllowed = entryPath.startsWith(selectionRoot)
      && (allowedSurfaces.length === 0 || allowedSurfaces.some((surface) => entryPath.startsWith(surface)));
    const sourceAllowed = manifestSource === "repo";
    return {
      valid: missing.length === 0 && sourceAllowed && entryAllowed && entry?.manifestId === manifest?.id,
      missing,
      sourceAllowed,
      entryAllowed,
    };
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

  function autoLoadFromRepoLoad() {
    return isRepoLoadScreen();
  }

  async function selectEntry(manifestId, { autoLoad = false } = {}) {
    const entry = (runtime.manifestIndex?.entries || []).find((item) => item.manifestId === manifestId) || null;
    runtime.selectedEntry = entry;
    runtime.selectedManifest = entry ? await ensureManifest(entry) : null;

    const runtimeApi = getRuntimeApi();
    if (runtimeApi?.selectManifestById && entry) {
      try {
        const resolved = await runtimeApi.selectManifestById(entry.manifestId);
        if (resolved?.manifest) {
          runtime.selectedManifest = resolved.manifest;
          runtime.manifestCache.set(entry.manifestPath, resolved.manifest);
        }
      } catch {
        // local preview still works even if runtime selection bridge is unavailable
      }
    }

    syncLocalSelectionWithRuntime();
    render();

    if (autoLoad && entry) {
      await requestMountSelected({ returnHome: true, trigger: "repo-load-click" });
    }
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
      selectEntry(entry.manifestId, { autoLoad: autoLoadFromRepoLoad() }).catch(showError);
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
      selectionMatchesMount: runtime.selectedManifest?.entry === mountedSourcePath,
    };
    const surface = deriveSurface(input);

    if (!runtime.selectedEntry || !runtime.selectedManifest) {
      button.disabled = true;
      button.textContent = isRepoLoadScreen() ? "Load selected" : "Mount selected";
      container.innerHTML = `
        <div class="surface-stack">
          <div class="surface-header">
            <div class="surface-title">${surface.title}</div>
            <span class="surface-chip">${surface.statusChip}</span>
          </div>
          <div class="surface-detail">${isRepoLoadScreen()
            ? "Choose a repo file from the rail. Clicking a file in Repo Load loads it into Home immediately."
            : surface.detail}</div>
        </div>
      `;
      return;
    }

    const manifest = runtime.selectedManifest;
    const saveTag = manifest?.save?.tag || manifest?.id || "none";
    const saveAvailability = manifest?.save?.enabled ? "enabled-or-conditional" : "disabled";
    const actionLabel = isRepoLoadScreen() ? "Load selected" : (surface.mountAction === "mounted" ? "Mount selected again" : "Mount selected");
    button.disabled = !(surface.mountAction === "confirm" || surface.mountAction === "mounted");
    button.textContent = actionLabel;

    container.innerHTML = `
      <div class="surface-stack">
        <div class="surface-header">
          <div class="surface-title">${manifest.title}</div>
          <span class="surface-chip">${isRepoLoadScreen() ? (validation.valid ? "ready" : "invalid") : surface.statusChip}</span>
        </div>
        <div class="surface-meta-grid">
          <div><span class="muted">mode</span> ${isRepoLoadScreen() ? "repo-load" : readCurrentMode()}</div>
          <div><span class="muted">manifest id</span> ${manifest.id}</div>
          <div><span class="muted">title</span> ${manifest.title}</div>
          <div><span class="muted">type</span> ${manifest.type}</div>
          <div><span class="muted">renderer</span> ${manifest.renderer || "none"}</div>
          <div><span class="muted">save tag</span> ${saveTag}</div>
          <div><span class="muted">save</span> ${saveAvailability}</div>
          <div><span class="muted">source</span> ${manifest.source}</div>
          <div><span class="muted">entry</span> ${manifest.entry}</div>
          <div><span class="muted">loaded now</span> ${mountedSourcePath === manifest.entry ? "yes" : "no"}</div>
        </div>
        <div class="surface-detail">${isRepoLoadScreen()
          ? "Repo Load is now direct: clicking a file loads it into Home."
          : surface.detail}</div>
        <div class="surface-foot muted">last mount request: ${runtime.lastMountRequest.status} — ${runtime.lastMountRequest.detail}</div>
        ${validation.valid ? "" : `<div class="surface-foot warn">manifest validation failed${validation.missing.length ? ` (missing: ${validation.missing.join(", ")})` : ""}</div>`}
      </div>
    `;
  }

  function scheduleHomeRefresh() {
    [80, 220].forEach((delay) => {
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent("tars:home-updated"));
      }, delay);
    });
  }

  async function requestMountSelected({ returnHome = false, trigger = "button" } = {}) {
    if (!runtime.selectedEntry || !runtime.selectedManifest) return;

    const validation = validateSelectedManifest(runtime.selectedEntry, runtime.selectedManifest);
    if (!validation.valid) {
      runtime.lastMountRequest = {
        status: "blocked",
        detail: "manifest-validation-failed",
      };
      renderResolved();
      emitCollectionsUpdated();
      return;
    }

    const runtimeApi = getRuntimeApi();
    if (runtimeApi?.confirmMountSelectedManifest) {
      const result = await runtimeApi.confirmMountSelectedManifest();
      runtime.lastMountRequest = result?.mounted
        ? { status: "mounted", detail: result.manifestId || runtime.selectedManifest.id }
        : { status: "blocked", detail: result?.reason || "mount-not-confirmed" };
      syncLocalSelectionWithRuntime();
      render();
      if (result?.mounted) {
        scheduleHomeRefresh();
        if (returnHome || trigger === "repo-load-click") {
          requestScreen("home");
        }
      }
      return;
    }

    runtime.lastMountRequest = {
      status: "blocked",
      detail: "runtime-api-unavailable",
    };
    renderResolved();
    emitCollectionsUpdated();
  }

  function render() {
    renderList().catch(showError);
    renderResolved();
    emitCollectionsUpdated();
  }

  function showError(error) {
    const container = document.getElementById("collectionsResolvedSummary");
    if (container) {
      container.innerHTML = `<span class="warn">collections browser failed: ${error.message}</span>`;
    }
    emitCollectionsUpdated();
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
        // unresolved until selected
      }
    }));

    syncLocalSelectionWithRuntime();
    render();

    const button = document.getElementById("collectionsMountConfirm");
    if (button) {
      button.addEventListener("click", () => {
        requestMountSelected({ returnHome: isRepoLoadScreen(), trigger: "button" }).catch(showError);
      });
    }

    const viewport = document.getElementById("runsViewport");
    if (viewport) {
      const observer = new MutationObserver(() => {
        syncLocalSelectionWithRuntime();
        renderResolved();
        emitCollectionsUpdated();
      });
      observer.observe(viewport, { childList: true, subtree: true, characterData: true });
    }

    [
      "tars:screen-changed",
      "tars:home-updated",
      "tars:runs-content-updated",
    ].forEach((eventName) => window.addEventListener(eventName, () => {
      syncLocalSelectionWithRuntime();
      render();
    }));
  }

  boot().catch(showError);
})();