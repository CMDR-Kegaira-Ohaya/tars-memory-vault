(() => {
  const shared = window.__TARS_BOARDS__ || (window.__TARS_BOARDS__ = {});
  const runtime = {
    contract: null,
    boardEnumeration: null,
    selectedEntry: null,
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

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
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
      title: "Boards browser",
      statusChip: input.selectedBoardId ? "resolved" : "idle",
      detail: "Boards browser presentation fallback.",
      mountAction: input.selectedBoardId ? "confirm" : "disabled"
    };
  }

  function readMountedSourcePath() {
    const viewport = document.getElementById("runsViewport");
    const rawText = viewport?.dataset?.rawText || viewport?.textContent || "";
    const line = rawText.split("\n").find((entry) => entry.startsWith("source: "));
    return line ? line.slice(8) : null;
  }

  function readCurrentMode() {
    const strip = document.getElementById("statusStrip")?.textContent || "";
    const line = strip.split("\n").find((entry) => entry.startsWith("MODE: "));
    return line ? line.slice(6).toLowerCase() : "home";
  }

  function validateBoardEntry(entry) {
    const root = runtime.boardEnumeration?.root || shared.boardEnumeration?.root || "work/dev/projects/";
    const sourcePath = String(entry?.sourcePath || "");
    const sourceClass = String(entry?.sourceClass || "");
    const mountedKind = String(entry?.mountedKind || "");
    return {
      valid: Boolean(entry) && sourcePath.startsWith(root) && sourceClass === "repo-board" && mountedKind === "board" && entry?.readOnly === true,
      rootAllowed: sourcePath.startsWith(root),
      sourceClassAllowed: sourceClass === "repo-board",
      mountedKindAllowed: mountedKind === "board",
      readOnlyAllowed: entry?.readOnly === true
    };
  }

  function getRuntimeApi() {
    return shared.runtimeApi || null;
  }

  function getResolvedSelection() {
    const runtimeApi = getRuntimeApi();
    if (!runtimeApi?.getResolvedSelection) return null;
    try {
      const resolved = runtimeApi.getResolvedSelection();
      return resolved?.boardId ? resolved : null;
    } catch {
      return null;
    }
  }

  function syncLocalSelectionWithRuntime() {
    const resolved = getResolvedSelection();
    if (!resolved?.boardId) return;
    const entry = (runtime.boardEnumeration?.entries || []).find((item) => item.boardId === resolved.boardId) || null;
    if (entry) {
      runtime.selectedEntry = entry;
    }
  }

  function switchToBoardsMode() {
    if (readCurrentMode() === "boards") return;
    const navButtons = Array.from(document.querySelectorAll("#nav button"));
    const target = navButtons.find((button) => button.textContent.trim().toUpperCase() === "BOARDS");
    target?.click();
  }

  function ensureFallbackRuntimeApi() {
    if (shared.runtimeApi) return shared.runtimeApi;

    shared.resolvedSelection = shared.resolvedSelection || {
      boardId: null,
      sourcePath: null,
      entry: null,
      valid: false,
      rootAllowed: false,
      sourceClassAllowed: false,
      mountedKindAllowed: false,
      readOnlyAllowed: false
    };

    shared.runtimeApi = {
      selectBoardById(boardId) {
        const entry = (shared.boardEnumeration?.entries || runtime.boardEnumeration?.entries || []).find((item) => item.boardId === boardId) || null;
        if (!entry) {
          shared.resolvedSelection = {
            boardId: null,
            sourcePath: null,
            entry: null,
            valid: false,
            rootAllowed: false,
            sourceClassAllowed: false,
            mountedKindAllowed: false,
            readOnlyAllowed: false
          };
          return null;
        }
        const validation = validateBoardEntry(entry);
        shared.resolvedSelection = {
          boardId: entry.boardId,
          sourcePath: entry.sourcePath,
          entry: clone(entry),
          valid: validation.valid,
          rootAllowed: validation.rootAllowed,
          sourceClassAllowed: validation.sourceClassAllowed,
          mountedKindAllowed: validation.mountedKindAllowed,
          readOnlyAllowed: validation.readOnlyAllowed
        };
        switchToBoardsMode();
        return clone(shared.resolvedSelection);
      },
      confirmMountSelectedBoard() {
        const resolved = shared.resolvedSelection || {};
        if (!resolved.boardId) return null;
        const entry = (shared.boardEnumeration?.entries || runtime.boardEnumeration?.entries || []).find((item) => item.boardId === resolved.boardId) || null;
        const validation = validateBoardEntry(entry);
        if (!entry || !validation.valid) {
          shared.resolvedSelection = {
            boardId: entry?.boardId || null,
            sourcePath: entry?.sourcePath || null,
            entry: entry ? clone(entry) : null,
            valid: false,
            rootAllowed: validation.rootAllowed,
            sourceClassAllowed: validation.sourceClassAllowed,
            mountedKindAllowed: validation.mountedKindAllowed,
            readOnlyAllowed: validation.readOnlyAllowed
          };
          return {
            mounted: false,
            reason: "board-validation-failed",
            resolvedSelection: clone(shared.resolvedSelection)
          };
        }
        const boardEnumeration = shared.boardEnumeration || runtime.boardEnumeration;
        if (!boardEnumeration?.entries) {
          return {
            mounted: false,
            reason: "board-enumeration-unavailable",
            resolvedSelection: clone(shared.resolvedSelection)
          };
        }
        const currentIndex = boardEnumeration.entries.findIndex((item) => item.boardId === entry.boardId);
        if (currentIndex < 0) {
          return {
            mounted: false,
            reason: "board-entry-not-found",
            resolvedSelection: clone(shared.resolvedSelection)
          };
        }
        if (currentIndex !== 0) {
          const [selected] = boardEnumeration.entries.splice(currentIndex, 1);
          boardEnumeration.entries.unshift(selected);
        }
        const mountButton = document.getElementById("mountBoard");
        if (!mountButton) {
          return {
            mounted: false,
            reason: "mount-button-unavailable",
            resolvedSelection: clone(shared.resolvedSelection)
          };
        }
        mountButton.click();
        return {
          mounted: true,
          boardId: entry.boardId,
          sourcePath: entry.sourcePath,
          resolvedSelection: clone(shared.resolvedSelection)
        };
      },
      getResolvedSelection() {
        return clone(shared.resolvedSelection);
      },
      clearResolvedSelection() {
        shared.resolvedSelection = {
          boardId: null,
          sourcePath: null,
          entry: null,
          valid: false,
          rootAllowed: false,
          sourceClassAllowed: false,
          mountedKindAllowed: false,
          readOnlyAllowed: false
        };
      }
    };

    return shared.runtimeApi;
  }

  async function selectEntry(boardId) {
    runtime.selectedEntry = (runtime.boardEnumeration?.entries || []).find((item) => item.boardId === boardId) || null;

    const runtimeApi = getRuntimeApi() || ensureFallbackRuntimeApi();
    if (runtimeApi?.selectBoardById && runtime.selectedEntry) {
      try {
        runtimeApi.selectBoardById(runtime.selectedEntry.boardId);
      } catch {
        // keep local preview state if the runtime bridge cannot resolve
      }
    }

    syncLocalSelectionWithRuntime();
    render();
  }

  function renderEntryButton(entry) {
    const button = document.createElement("button");
    button.className = "manifest-entry";
    if (runtime.selectedEntry?.boardId === entry.boardId) {
      button.dataset.selected = "true";
    }
    button.innerHTML = `
      <div class="surface-header">
        <div class="surface-title">${entry.title || entry.boardId}</div>
        <span class="surface-chip">board</span>
      </div>
      <div class="manifest-entry-meta">
        <span>${entry.sourceClass || "repo-board"}</span>
        <span>${entry.readOnly ? "read-only" : "mutable"}</span>
        <span>${entry.exportSource || "enabled"}</span>
      </div>
      <div class="surface-foot muted">${entry.sourcePath}</div>
    `;
    button.addEventListener("click", () => {
      selectEntry(entry.boardId).catch(showError);
    });
    return button;
  }

  async function renderList() {
    const container = document.getElementById("boardsBrowserList");
    if (!container) return;
    container.innerHTML = "";

    const entries = runtime.boardEnumeration?.entries || [];
    if (!entries.length) {
      container.innerHTML = `<div class="surface-foot muted">No approved boards are currently indexed.</div>`;
      return;
    }

    const group = document.createElement("div");
    group.className = "manifest-group";
    const title = document.createElement("div");
    title.className = "manifest-group-title";
    title.textContent = "approved boards";
    group.appendChild(title);

    for (const entry of entries) {
      group.appendChild(renderEntryButton(entry));
    }

    container.appendChild(group);
  }

  function renderResolved() {
    const container = document.getElementById("boardsResolvedSummary");
    const button = document.getElementById("boardsMountConfirm");
    if (!container || !button) return;

    const validation = runtime.selectedEntry
      ? validateBoardEntry(runtime.selectedEntry)
      : { valid: false, rootAllowed: false, sourceClassAllowed: false, mountedKindAllowed: false, readOnlyAllowed: false };
    const mountedSourcePath = readMountedSourcePath();
    const input = {
      selectedBoardId: runtime.selectedEntry?.boardId || null,
      selectedSourcePath: runtime.selectedEntry?.sourcePath || null,
      currentMountedBoardPath: mountedSourcePath,
      boardValid: validation.valid,
      selectionMatchesMount: runtime.selectedEntry?.sourcePath === mountedSourcePath
    };
    const surface = deriveSurface(input);

    if (!runtime.selectedEntry) {
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

    const entry = runtime.selectedEntry;
    button.disabled = !(surface.mountAction === "confirm" || surface.mountAction === "mounted");
    button.textContent = surface.mountAction === "mounted" ? "Mount selected board again" : "Mount selected board";

    container.innerHTML = `
      <div class="surface-stack">
        <div class="surface-header">
          <div class="surface-title">${entry.title}</div>
          <span class="surface-chip">${surface.statusChip}</span>
        </div>
        <div class="surface-meta-grid">
          <div><span class="muted">mode</span> ${readCurrentMode()}</div>
          <div><span class="muted">board id</span> ${entry.boardId}</div>
          <div><span class="muted">title</span> ${entry.title}</div>
          <div><span class="muted">source path</span> ${entry.sourcePath}</div>
          <div><span class="muted">source class</span> ${entry.sourceClass}</div>
          <div><span class="muted">mounted kind</span> ${entry.mountedKind}</div>
          <div><span class="muted">read only</span> ${entry.readOnly}</div>
          <div><span class="muted">save</span> ${entry.save || "disabled"}</div>
          <div><span class="muted">export source</span> ${entry.exportSource || "enabled"}</div>
          <div><span class="muted">export output</span> placeholder-disabled</div>
        </div>
        <div class="surface-detail">${surface.detail}</div>
        <div class="surface-foot muted">last mount request: ${runtime.lastMountRequest.status} — ${runtime.lastMountRequest.detail}</div>
        ${validation.valid ? "" : `<div class=\"surface-foot warn\">board validation failed</div>`}
      </div>
    `;
  }

  async function requestMountSelected() {
    if (!runtime.selectedEntry) return;
    const validation = validateBoardEntry(runtime.selectedEntry);
    if (!validation.valid) {
      runtime.lastMountRequest = {
        status: "blocked",
        detail: "board-validation-failed"
      };
      renderResolved();
      return;
    }

    const runtimeApi = getRuntimeApi() || ensureFallbackRuntimeApi();
    if (runtimeApi?.confirmMountSelectedBoard) {
      const result = await runtimeApi.confirmMountSelectedBoard();
      runtime.lastMountRequest = result?.mounted
        ? { status: "mounted", detail: result.boardId || runtime.selectedEntry.boardId }
        : { status: "blocked", detail: result?.reason || "mount-not-confirmed" };
      syncLocalSelectionWithRuntime();
      render();
      return;
    }

    runtime.lastMountRequest = {
      status: "blocked",
      detail: "runtime-api-unavailable"
    };
    renderResolved();
  }

  function render() {
    renderList().catch(showError);
    renderResolved();
  }

  function showError(error) {
    const container = document.getElementById("boardsResolvedSummary");
    if (container) {
      container.innerHTML = `<span class="warn">boards browser failed: ${error.message}</span>`;
    }
  }

  async function boot() {
    runtime.contract = await loadJson("app/boards-browser.v1.json");
    runtime.boardEnumeration = shared.boardEnumeration || await loadJson("app/board-enumeration.v1.json");
    shared.boardEnumeration = runtime.boardEnumeration;

    ensureFallbackRuntimeApi();
    syncLocalSelectionWithRuntime();
    render();

    const button = document.getElementById("boardsMountConfirm");
    if (button) {
      button.addEventListener("click", requestMountSelected);
    }

    const viewport = document.getElementById("runsViewport");
    if (viewport) {
      const observer = new MutationObserver(() => {
        syncLocalSelectionWithRuntime();
        renderResolved();
      });
      observer.observe(viewport, { childList: true, subtree: true, characterData: true });
    }
  }

  boot().catch(showError);
})();
