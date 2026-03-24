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

  function validateSelectedBoard(entry) {
    const root = runtime.boardEnumeration?.root || "work/dev/projects/";
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

  async function selectEntry(boardId) {
    runtime.selectedEntry = (runtime.boardEnumeration?.entries || []).find((item) => item.boardId === boardId) || null;
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
      ? validateSelectedBoard(runtime.selectedEntry)
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

  function reorderSharedEnumerationToSelection() {
    const boardEnumeration = shared.boardEnumeration || runtime.boardEnumeration;
    if (!boardEnumeration?.entries || !runtime.selectedEntry) {
      return false;
    }
    const currentIndex = boardEnumeration.entries.findIndex((entry) => entry.boardId === runtime.selectedEntry.boardId);
    if (currentIndex < 0) return false;
    if (currentIndex !== 0) {
      const [selected] = boardEnumeration.entries.splice(currentIndex, 1);
      boardEnumeration.entries.unshift(selected);
    }
    runtime.boardEnumeration = boardEnumeration;
    return true;
  }

  function requestMountSelected() {
    if (!runtime.selectedEntry) return;
    const validation = validateSelectedBoard(runtime.selectedEntry);
    if (!validation.valid) {
      runtime.lastMountRequest = {
        status: "blocked",
        detail: "board-validation-failed"
      };
      renderResolved();
      return;
    }
    const reordered = reorderSharedEnumerationToSelection();
    if (!reordered) {
      runtime.lastMountRequest = {
        status: "blocked",
        detail: "shared-board-enumeration-unavailable"
      };
      renderResolved();
      return;
    }
    const mountButton = document.getElementById("mountBoard");
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
      detail: runtime.selectedEntry.boardId
    };
    mountButton.click();
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

    render();

    const button = document.getElementById("boardsMountConfirm");
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
