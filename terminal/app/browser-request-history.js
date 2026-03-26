(() => {
  const devtoolsKey = "__TARS_DEVTOOLS__";
  const devtools = window[devtoolsKey] || (window[devtoolsKey] = {
    mountedCartridge: null,
    requestHistorySurface: null,
  });

  const runtime = {
    contract: null,
    currentSaveTag: null,
    historyPath: null,
    historyIndex: null,
    lastInputSignature: null,
    lastExportSignature: null,
    refreshScheduled: false,
    loadingPath: null,
  };

  function normalizePath(path) {
    return String(path || "").replace(/^terminal\//, "");
  }

  async function loadJson(path) {
    const response = await fetch(normalizePath(path));
    if (!response.ok) throw new Error(`failed to load ${path}`);
    return response.json();
  }

  async function loadOptionalJson(path) {
    const response = await fetch(normalizePath(path));
    if (!response.ok) return null;
    return response.json();
  }

  function parseJsonText(text) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  function readMountedSaveContext() {
    return parseJsonText(document.getElementById("mountedSaveContextPreview")?.textContent || "");
  }

  function readMountedSourceContext() {
    return parseJsonText(document.getElementById("mountedSourceContextPreview")?.textContent || "");
  }

  function deriveSaveTagFromSourcePath(sourcePath) {
    const segments = String(sourcePath || "").split("/").filter(Boolean);
    if (segments[0] !== "collections" || segments.length < 3) return null;
    return segments[2] || null;
  }

  function matches(match, input) {
    return Object.entries(match || {}).every(([key, expected]) => {
      const actual = input[key];
      if (expected === null) return actual == null;
      if (expected === "non-null") return actual != null;
      return String(actual) === String(expected);
    });
  }

  function resolveTemplate(value, input) {
    if (Array.isArray(value)) return value.map((item) => resolveTemplate(item, input));
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, resolveTemplate(nested, input)]));
    }
    if (typeof value !== "string") return value;
    switch (value) {
      case "from-current-save-tag":
        return input.currentSaveTag;
      case "from-history-path":
        return input.historyPath || "none";
      case "from-entry-count":
        return input.entryCount || 0;
      default:
        return value;
    }
  }

  function deriveSurface(input) {
    const states = runtime.contract?.states || {};
    for (const stateConfig of Object.values(states)) {
      if (matches(stateConfig.match || {}, input)) {
        return resolveTemplate(stateConfig.derive || {}, input);
      }
    }
    return {
      consumed: false,
      status: "unknown",
      saveTag: input.currentSaveTag,
      historyPath: input.historyPath || "none",
      entryCount: input.entryCount || 0,
      detail: "unmatched-history-surface-state",
    };
  }

  function buildDerivedInput() {
    const mountedSaveContext = readMountedSaveContext();
    const mountedSourceContext = readMountedSourceContext();
    const nextSaveTag =
      mountedSaveContext?.saveTag ||
      deriveSaveTagFromSourcePath(mountedSourceContext?.sourcePath) ||
      null;
    const nextHistoryPath =
      mountedSaveContext?.historyPath ||
      (nextSaveTag ? `terminal/saves/${nextSaveTag}/request-history-index.v1.json` : null);

    return {
      mountedSaveContext,
      mountedSourceContext,
      nextSaveTag,
      nextHistoryPath,
      inputSignature: JSON.stringify({
        saveTag: nextSaveTag,
        historyPath: nextHistoryPath,
      }),
    };
  }

  function exportSurface(mountedSaveContext, mountedSourceContext) {
    const surface = deriveSurface({
      currentSaveTag: runtime.currentSaveTag,
      historyLoaded: Boolean(runtime.historyIndex),
      historyPath: runtime.historyPath,
      entryCount: runtime.historyIndex?.entries?.length || 0,
    });

    const exportSignature = JSON.stringify({
      saveTag: surface.saveTag || null,
      historyPath: surface.historyPath || "none",
      entryCount: surface.entryCount || 0,
      status: surface.status || "unknown",
      detail: surface.detail || "",
    });
    if (runtime.lastExportSignature === exportSignature) return;
    runtime.lastExportSignature = exportSignature;

    devtools.requestHistorySurface = {
      mountedSaveContext,
      mountedSourceContext,
      surface,
      historyIndex: runtime.historyIndex,
      entries: runtime.historyIndex?.entries || [],
    };

    window.dispatchEvent(
      new CustomEvent("tars:request-history-updated", {
        detail: devtools.requestHistorySurface,
      }),
    );
  }

  async function refreshNow() {
    runtime.refreshScheduled = false;
    const derived = buildDerivedInput();

    if (runtime.lastInputSignature !== derived.inputSignature) {
      runtime.lastInputSignature = derived.inputSignature;
      runtime.currentSaveTag = derived.nextSaveTag;
      runtime.historyPath = derived.nextHistoryPath;

      if (derived.nextHistoryPath) {
        if (runtime.loadingPath !== derived.nextHistoryPath) {
          runtime.loadingPath = derived.nextHistoryPath;
          runtime.historyIndex = await loadOptionalJson(derived.nextHistoryPath);
          runtime.loadingPath = null;
        }
      } else {
        runtime.loadingPath = null;
        runtime.historyIndex = null;
      }
    }

    exportSurface(derived.mountedSaveContext, derived.mountedSourceContext);
  }

  function scheduleRefresh() {
    if (runtime.refreshScheduled) return;
    runtime.refreshScheduled = true;
    queueMicrotask(() => {
      refreshNow().catch(() => {
        runtime.refreshScheduled = false;
      });
    });
  }

  async function boot() {
    runtime.contract = await loadJson("app/request-history-surface.v1.json");
    await refreshNow();

    ["mountedSaveContextPreview", "mountedSourceContextPreview"].forEach((id) => {
      const target = document.getElementById(id);
      if (!target) return;
      const observer = new MutationObserver(() => {
        scheduleRefresh();
      });
      observer.observe(target, { childList: true, subtree: true, characterData: true });
    });

    ["tars:screen-changed", "tars:collections-updated", "tars:repo-verified-updated"].forEach((eventName) => {
      window.addEventListener(eventName, scheduleRefresh);
    });
  }

  boot().catch((error) => {
    devtools.requestHistorySurface = {
      mountedSaveContext: readMountedSaveContext(),
      mountedSourceContext: readMountedSourceContext(),
      surface: {
        status: "failed",
        saveTag: runtime.currentSaveTag,
        historyPath: runtime.historyPath || "none",
        entryCount: 0,
        detail: "request-history-bootstrap-failed",
      },
      historyIndex: null,
      entries: [],
      error: error.message,
    };
    window.dispatchEvent(
      new CustomEvent("tars:request-history-updated", {
        detail: devtools.requestHistorySurface,
      }),
    );
  });
})();
