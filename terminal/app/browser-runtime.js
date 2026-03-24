(() => {
  const MODE_LABELS = ["home", "collections", "boards", "cartridges", "runs", "saves", "system"];
  const ACTION_KEYS = ["save", "exportSource", "exportOutput", "notes", "bookmarks"];

  const state = {
    initialState: null,
    session: null,
    manifestIndex: null,
    boardEnumeration: null,
    saveSlotIndex: null,
    contracts: {},
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

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function getFieldValue(source, key) {
    if (key === "pathPrefix" || key === "pathSuffix") {
      return source.sourcePath || "";
    }
    return source[key];
  }

  function matchExpected(expected, actual) {
    if (expected === null) {
      return actual == null;
    }
    if (Array.isArray(expected)) {
      return expected.includes(actual);
    }
    if (typeof expected === "string") {
      if (expected === "non-null") {
        return actual != null;
      }
      if (expected.includes("|")) {
        return expected.split("|").includes(String(actual));
      }
      return String(actual) === expected;
    }
    return actual === expected;
  }

  function matches(match, source) {
    return Object.entries(match || {}).every(([key, expected]) => {
      const actual = getFieldValue(source, key);
      if (key === "pathPrefix") {
        return String(actual).startsWith(String(expected));
      }
      if (key === "pathSuffix") {
        return String(actual).endsWith(String(expected));
      }
      return matchExpected(expected, actual);
    });
  }

  function resolveRule(rules, source) {
    for (const rule of rules || []) {
      if (matches(rule.match || {}, source)) {
        return rule.resolve || null;
      }
    }
    return null;
  }

  function resolveToken(token, session, path) {
    const key = path[path.length - 1];
    switch (token) {
      case "from-current-mode":
        return String(session.currentMode || "home").toUpperCase();
      case "live-source-path":
        return session.sourcePath || "live-source-path";
      case "mounted-source-path":
        return session.sourcePath || "mounted-source-path";
      case "from-session-state":
        return session.state || "mounted";
      case "derived-renderer":
        return session.renderer || (session.sourceClass === "repo-board" ? "markdown-reader" : "unresolved");
      case "resolved-renderer":
        return session.renderer || "unresolved";
      case "resolved-renderer-or-none":
        return session.renderer || "none";
      case "derived-engine-or-none":
      case "resolved-engine":
        return session.engine || "none";
      case "from-action-state":
        if (key === "notesState") {
          return session.actionState?.notes || "disabled";
        }
        return session.actionState?.[key] || "disabled";
      case "from-mounted-viewport":
        return session.mountedViewport?.displayMode || "idle-placeholder";
      case "from-save-slot-index-if-present":
        return state.saveSlotIndex?.entries?.length ? state.saveSlotIndex.entries[0].saveTag : "none";
      case "matching-save-tag-or-latest-related-save":
        return session.saveTag || state.saveSlotIndex?.entries?.[0]?.saveTag || "none";
      default:
        return token;
    }
  }

  function resolveTemplate(value, session, path = []) {
    if (Array.isArray(value)) {
      return value.map((item, index) => resolveTemplate(item, session, path.concat(index)));
    }
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, nested]) => [key, resolveTemplate(nested, session, path.concat(key))])
      );
    }
    if (typeof value === "string") {
      return resolveToken(value, session, path);
    }
    return value;
  }

  function deriveFromContract(contract, session) {
    const states = contract?.states || {};
    for (const stateConfig of Object.values(states)) {
      if (matches(stateConfig.match || {}, session)) {
        return resolveTemplate(stateConfig.derive || {}, session);
      }
    }
    return {};
  }

  function refreshDerivedState() {
    state.session.actionState = deriveFromContract(state.contracts.actionState, state.session);
    state.session.statusStrip = deriveFromContract(state.contracts.statusStrip, state.session);
    state.session.mountedViewport = deriveFromContract(state.contracts.mountedViewport, state.session);
    state.session.homeSummary = deriveFromContract(state.contracts.homeSummary, state.session);
  }

  function setSessionPatch(patch) {
    Object.assign(state.session, patch);
    refreshDerivedState();
    render();
  }

  async function mountExampleCartridge() {
    const entry = state.manifestIndex?.entries?.[0];
    if (!entry) return;

    const manifest = await loadJson(entry.manifestPath);
    const modeResolved = resolveRule(state.contracts.modeResolver?.rules, {
      requestedMode: "collections",
      sourceOrigin: "repo",
      sourcePath: manifest.entry,
    }) || {};
    const rendererResolved = resolveRule(state.contracts.rendererSelection?.rules, {
      mountedKind: "cartridge",
      sourceClass: "repo-cartridge",
      sourcePath: manifest.entry,
      declaredType: manifest.type,
      rendererHint: manifest.renderer,
    }) || {};

    const renderer = rendererResolved.renderer === "hint-if-allowed"
      ? manifest.renderer
      : rendererResolved.renderer || manifest.renderer || null;

    setSessionPatch({
      currentMode: "collections",
      mountedId: manifest.id,
      mountedKind: "cartridge",
      sourcePath: manifest.entry,
      sourceClass: "repo-cartridge",
      renderer,
      engine: null,
      saveTag: manifest.save?.tag || manifest.id,
      save: modeResolved.save || (manifest.save?.enabled ? "conditional" : "disabled"),
      exportSource: modeResolved.exportSource || "conditional",
      exportOutput: modeResolved.exportOutput || "placeholder",
      state: "mounted",
    });
  }

  async function mountLiveBoard() {
    const entry = state.boardEnumeration?.entries?.[0];
    if (!entry) return;

    const rendererResolved = resolveRule(state.contracts.rendererSelection?.rules, {
      mountedKind: "board",
      sourceClass: "repo-board",
      sourcePath: entry.sourcePath,
      declaredType: "markdown",
      rendererHint: null,
    }) || {};

    const boardsMode = state.contracts.boardsMode || {};

    setSessionPatch({
      currentMode: "boards",
      mountedId: entry.boardId,
      mountedKind: "board",
      sourcePath: entry.sourcePath,
      sourceClass: "repo-board",
      renderer: rendererResolved.renderer || "markdown-reader",
      engine: null,
      saveTag: null,
      save: boardsMode.actions?.save?.status || "disabled",
      exportSource: boardsMode.actions?.exportSource?.status || "enabled",
      exportOutput: boardsMode.actions?.exportOutput?.status || "placeholder-disabled",
      state: boardsMode.runtimeState?.stateLabel || "read-only-live-board",
    });
  }

  function clearMount() {
    state.session = clone(state.initialState);
    refreshDerivedState();
    render();
  }

  function switchMode(mode) {
    state.session.currentMode = mode;
    refreshDerivedState();
    render();
  }

  function formatStatus(strip) {
    return [
      `MODE: ${strip.mode || "HOME"}`,
      `SOURCE: ${strip.source || "none"}`,
      `MOUNT: ${strip.mountedKind || "none"}`,
      `STATE: ${strip.state || "idle"}`,
      `RENDERER: ${strip.renderer || "none"}`,
      `ENGINE: ${strip.engine || "none"}`,
      `SAVE: ${strip.save || "disabled"}`,
      `EXPORT SOURCE: ${strip.exportSource || "disabled"}`,
      `EXPORT OUTPUT: ${strip.exportOutput || "placeholder-disabled"}`,
    ].join("\n");
  }

  function renderNav() {
    const nav = document.getElementById("nav");
    nav.innerHTML = "";
    for (const mode of MODE_LABELS) {
      const button = document.createElement("button");
      button.textContent = mode.toUpperCase();
      if (state.session.currentMode === mode) {
        button.style.borderColor = "#7dd3fc";
      }
      button.addEventListener("click", () => switchMode(mode));
      nav.appendChild(button);
    }
  }

  function renderActions() {
    const container = document.getElementById("actions");
    container.innerHTML = "";
    for (const key of ACTION_KEYS) {
      const value = state.session.actionState?.[key] || "disabled";
      const button = document.createElement("button");
      button.textContent = `${key} : ${value}`;
      button.disabled = value.includes("disabled") || value.includes("placeholder");
      container.appendChild(button);
    }
  }

  function renderHomeSummary() {
    const home = state.session.homeSummary;
    document.getElementById("homeSummary").innerHTML = [
      `<div><span class="muted">mode</span> ${home.mode}</div>`,
      `<div><span class="muted">current mount</span> ${home.currentMount}</div>`,
      `<div><span class="muted">recent save</span> ${home.recentSave}</div>`,
      `<div><span class="muted">save</span> ${home.currentAvailability.save}</div>`,
      `<div><span class="muted">export source</span> ${home.currentAvailability.exportSource}</div>`,
      `<div><span class="muted">export output</span> ${home.currentAvailability.exportOutput}</div>`,
      `<div><span class="muted">runs surface</span> ${home.runsSurface}</div>`,
      `<div><span class="muted">notes</span> ${home.notesState}</div>`,
      `<div><span class="muted">quick actions</span> ${home.quickActions.join(", ")}</div>`
    ].join("");
  }

  function renderViewport() {
    const viewport = state.session.mountedViewport;
    const lines = [
      `surface: ${viewport.surface}`,
      `displayMode: ${viewport.displayMode}`,
      `source: ${viewport.source}`,
      `mountedKind: ${viewport.mountedKind}`,
      `renderer: ${viewport.renderer}`,
      `engine: ${viewport.engine}`,
      `readOnly: ${viewport.readOnly}`,
      `sessionPersistence: ${viewport.sessionPersistence}`,
      `viewState: ${viewport.viewState}`,
      "",
      `resolver: ${state.contracts.browserResolver?.id || "unavailable"}`,
    ];
    document.getElementById("runsViewport").textContent = lines.join("\n");
  }

  function render() {
    document.getElementById("statusStrip").textContent = formatStatus(state.session.statusStrip);
    renderNav();
    renderActions();
    renderHomeSummary();
    renderViewport();
  }

  async function boot() {
    const [
      shellSession,
      manifestIndex,
      boardEnumeration,
      saveSlotIndex,
      browserResolver,
      modeResolver,
      rendererSelection,
      actionState,
      statusStrip,
      mountedViewport,
      homeSummary,
      boardsMode
    ] = await Promise.all([
      loadJson("app/shell-session.v1.json"),
      loadJson("manifests/manifest-index.v1.json"),
      loadJson("app/board-enumeration.v1.json"),
      loadJson("saves/save-slot-index.v1.json"),
      loadJson("app/browser-resolver.v1.json"),
      loadJson("loaders/mode-resolver.v1.json"),
      loadJson("renderers/renderer-selection.v1.json"),
      loadJson("app/action-state.v1.json"),
      loadJson("app/status-strip.v1.json"),
      loadJson("app/mounted-viewport.v1.json"),
      loadJson("app/home-summary.v1.json"),
      loadJson("app/boards-mode.v1.json")
    ]);

    state.initialState = clone(shellSession.initialState);
    state.session = clone(shellSession.initialState);
    state.manifestIndex = manifestIndex;
    state.boardEnumeration = boardEnumeration;
    state.saveSlotIndex = saveSlotIndex;
    state.contracts = {
      browserResolver,
      modeResolver,
      rendererSelection,
      actionState,
      statusStrip,
      mountedViewport,
      homeSummary,
      boardsMode,
    };

    refreshDerivedState();
    render();

    document.getElementById("mountCartridge").addEventListener("click", () => {
      mountExampleCartridge().catch(showBootError);
    });
    document.getElementById("mountBoard").addEventListener("click", () => {
      mountLiveBoard().catch(showBootError);
    });
    document.getElementById("clearMount").addEventListener("click", clearMount);
  }

  function showBootError(error) {
    document.getElementById("statusStrip").textContent = `BOOT ERROR\n${error.message}`;
    document.getElementById("homeSummary").innerHTML = `<span class="warn">runtime bootstrap failed</span>`;
    document.getElementById("runsViewport").textContent = "failed to load runtime contracts";
  }

  boot().catch(showBootError);
})();
