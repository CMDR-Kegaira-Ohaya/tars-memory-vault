(() => {
  const collectionsKey = "__TARS_COLLECTIONS__";
  const runtime = {
    contract: null,
    surface: null,
    lastInputSignature: null,
    lastRenderSignature: null,
    refreshScheduled: false,
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

  function parseJsonText(text) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
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
    if (Array.isArray(value)) {
      return value.map((item) => resolveTemplate(item, input));
    }
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, resolveTemplate(nested, input)]));
    }
    if (typeof value !== "string") {
      return value;
    }
    switch (value) {
      case "from-current-save-tag":
        return input.currentSaveTag;
      case "from-history-path":
        return input.historyPath || "none";
      case "from-verified-response-path":
        return input.verifiedResponsePath || "none";
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
      status: "unknown",
      saveTag: input.currentSaveTag,
      historyPath: input.historyPath || "none",
      verifiedResponsePath: input.verifiedResponsePath || "none",
      source: input.source || "dedicated-runtime-field",
    };
  }

  function readSaveBridgeRequest() {
    return parseJsonText(document.getElementById("saveBridgePreview")?.textContent || "");
  }

  function readRepoVerifiedPreview() {
    return parseJsonText(document.getElementById("repoVerifiedPreview")?.textContent || "");
  }

  function readMountedSourceContext() {
    return parseJsonText(document.getElementById("mountedSourceContextPreview")?.textContent || "");
  }

  function getResolvedSelection() {
    const shared = window[collectionsKey] || {};
    const runtimeApi = shared.runtimeApi;
    if (!runtimeApi?.getResolvedSelection) return null;
    try {
      const resolved = runtimeApi.getResolvedSelection();
      return resolved?.manifestId ? resolved : null;
    } catch {
      return null;
    }
  }

  function deriveSaveTagFromSourcePath(sourcePath) {
    const segments = String(sourcePath || "").split("/").filter(Boolean);
    if (segments[0] !== "collections" || segments.length < 3) {
      return null;
    }
    return segments[2] || null;
  }

  function buildInput() {
    const saveBridgeRequest = readSaveBridgeRequest();
    const repoVerifiedPreview = readRepoVerifiedPreview();
    const mountedSourceContext = readMountedSourceContext();
    const resolvedSelection = getResolvedSelection();
    const resolvedManifest = resolvedSelection?.manifest || null;
    const resolvedSelectionSaveTag = resolvedManifest?.save?.tag || resolvedManifest?.id || null;
    const sourcePathSaveTag = deriveSaveTagFromSourcePath(mountedSourceContext?.sourcePath);

    const currentSaveTag =
      saveBridgeRequest?.saveTag ||
      repoVerifiedPreview?.repoVerifiedStatus?.saveTag ||
      resolvedSelectionSaveTag ||
      sourcePathSaveTag ||
      null;

    const source = saveBridgeRequest?.saveTag
      ? "save-bridge-preview"
      : repoVerifiedPreview?.repoVerifiedStatus?.saveTag
        ? "repo-verified-preview"
        : resolvedSelectionSaveTag
          ? "resolved-selection"
          : sourcePathSaveTag
            ? "mounted-source-context"
            : "dedicated-runtime-field";

    return {
      currentSaveTag,
      historyPath: currentSaveTag ? `terminal/saves/${currentSaveTag}/request-history-index.v1.json` : null,
      verifiedResponsePath: currentSaveTag ? `terminal/saves/${currentSaveTag}/repo-write-response.v1.json` : null,
      source,
      inputSignature: JSON.stringify({
        currentSaveTag,
        historyPath: currentSaveTag ? `terminal/saves/${currentSaveTag}/request-history-index.v1.json` : null,
        verifiedResponsePath: currentSaveTag ? `terminal/saves/${currentSaveTag}/repo-write-response.v1.json` : null,
        source,
      }),
    };
  }

  function render(surface) {
    const renderSignature = JSON.stringify(surface);
    if (runtime.lastRenderSignature === renderSignature) return;
    runtime.lastRenderSignature = renderSignature;
    runtime.surface = surface;

    const summary = document.getElementById("mountedSaveContextSummary");
    if (summary) {
      summary.innerHTML = [
        `<div><span class="muted">status</span> ${surface.status}</div>`,
        `<div><span class="muted">save tag</span> ${surface.saveTag || "none"}</div>`,
        `<div><span class="muted">history path</span> ${surface.historyPath}</div>`,
        `<div><span class="muted">verified response</span> ${surface.verifiedResponsePath}</div>`,
        `<div><span class="muted">source</span> ${surface.source}</div>`,
      ].join("");
    }

    const preview = document.getElementById("mountedSaveContextPreview");
    if (!preview) return;
    preview.textContent = JSON.stringify(surface, null, 2);
    preview.dataset.saveTag = surface.saveTag || "";
  }

  function refreshNow() {
    runtime.refreshScheduled = false;
    const input = buildInput();
    if (runtime.lastInputSignature === input.inputSignature) return;
    runtime.lastInputSignature = input.inputSignature;
    render(deriveSurface(input));
  }

  function scheduleRefresh() {
    if (runtime.refreshScheduled) return;
    runtime.refreshScheduled = true;
    queueMicrotask(() => {
      try {
        refreshNow();
      } catch {
        runtime.refreshScheduled = false;
      }
    });
  }

  async function boot() {
    runtime.contract = await loadJson("app/mounted-save-context.v1.json");
    refreshNow();

    ["saveBridgePreview", "repoVerifiedPreview", "mountedSourceContextPreview"].forEach((id) => {
      const target = document.getElementById(id);
      if (!target) return;
      const observer = new MutationObserver(() => {
        scheduleRefresh();
      });
      observer.observe(target, { childList: true, subtree: true, characterData: true });
    });

    ["tars:collections-updated", "tars:screen-changed", "tars:devtools-changed"].forEach((eventName) => {
      window.addEventListener(eventName, scheduleRefresh);
    });
  }

  boot().catch((error) => {
    const summary = document.getElementById("mountedSaveContextSummary");
    const preview = document.getElementById("mountedSaveContextPreview");
    if (summary) {
      summary.innerHTML = `<span class="warn">mounted save context bootstrap failed</span>`;
    }
    if (preview) {
      preview.textContent = JSON.stringify(
        {
          status: "bootstrap-error",
          message: error.message,
          source: "dedicated-runtime-field",
        },
        null,
        2,
      );
    }
  });
})();
