(() => {
  const devtoolsKey = "__TARS_DEVTOOLS__";
  const devtools = window[devtoolsKey] || (window[devtoolsKey] = {
    mountedCartridge: null,
    requestHistorySurface: null,
    repoVerifiedSurface: null,
  });

  const runtime = {
    contract: null,
    currentSaveTag: null,
    verifiedResponsePath: null,
    verifiedResponse: null,
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
      if (typeof expected === "string" && expected.includes("|")) {
        return expected.split("|").includes(String(actual));
      }
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
      case "from-verified-response-head":
        return runtime.verifiedResponse?.verification?.head || "none";
      case "from-verified-response-paths":
        return runtime.verifiedResponse?.verification?.pathsVerified || [];
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
      detail: "unmatched-repo-verified-state",
      saveTag: input.currentSaveTag,
      verifiedHead: "none",
      pathsVerified: [],
      trusted: false,
    };
  }

  function buildDerivedInput() {
    const mountedSaveContext = readMountedSaveContext();
    const mountedSourceContext = readMountedSourceContext();
    const nextSaveTag =
      mountedSaveContext?.saveTag ||
      deriveSaveTagFromSourcePath(mountedSourceContext?.sourcePath) ||
      null;
    const nextVerifiedResponsePath =
      mountedSaveContext?.verifiedResponsePath ||
      (nextSaveTag ? `terminal/saves/${nextSaveTag}/repo-write-response.v1.json` : null);

    return {
      mountedSaveContext,
      mountedSourceContext,
      nextSaveTag,
      nextVerifiedResponsePath,
      inputSignature: JSON.stringify({
        saveTag: nextSaveTag,
        verifiedResponsePath: nextVerifiedResponsePath,
      }),
    };
  }

  function exportSurface(mountedSaveContext, mountedSourceContext) {
    const surface = deriveSurface({
      responseLoaded: Boolean(runtime.verifiedResponse),
      responseStatus: runtime.verifiedResponse?.status || null,
      verificationHead: runtime.verifiedResponse?.verification?.head || null,
      verifiedPaths: (runtime.verifiedResponse?.verification?.pathsVerified || []).length ? "present" : "empty",
      currentSaveTag: runtime.currentSaveTag,
    });

    const exportSignature = JSON.stringify({
      saveTag: surface.saveTag || null,
      status: surface.status || "unknown",
      trusted: surface.trusted === true,
      verifiedHead: surface.verifiedHead || "none",
      pathsCount: Array.isArray(surface.pathsVerified) ? surface.pathsVerified.length : 0,
      detail: surface.detail || "",
    });
    if (runtime.lastExportSignature === exportSignature) return;
    runtime.lastExportSignature = exportSignature;

    devtools.repoVerifiedSurface = {
      mountedSaveContext,
      mountedSourceContext,
      repoVerifiedStatus: surface,
      repoVerifiedResponse: runtime.verifiedResponse,
      pathsCount: Array.isArray(surface.pathsVerified) ? surface.pathsVerified.length : 0,
    };

    window.dispatchEvent(
      new CustomEvent("tars:repo-verified-updated", {
        detail: devtools.repoVerifiedSurface,
      }),
    );
  }

  async function refreshNow() {
    runtime.refreshScheduled = false;
    const derived = buildDerivedInput();

    if (runtime.lastInputSignature !== derived.inputSignature) {
      runtime.lastInputSignature = derived.inputSignature;
      runtime.currentSaveTag = derived.nextSaveTag;
      runtime.verifiedResponsePath = derived.nextVerifiedResponsePath;

      if (derived.nextVerifiedResponsePath) {
        if (runtime.loadingPath !== derived.nextVerifiedResponsePath) {
          runtime.loadingPath = derived.nextVerifiedResponsePath;
          runtime.verifiedResponse = await loadOptionalJson(derived.nextVerifiedResponsePath);
          runtime.loadingPath = null;
        }
      } else {
        runtime.loadingPath = null;
        runtime.verifiedResponse = null;
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
    runtime.contract = await loadJson("app/repo-verified-save-status.v1.json");
    await refreshNow();

    ["mountedSaveContextPreview", "mountedSourceContextPreview"].forEach((id) => {
      const target = document.getElementById(id);
      if (!target) return;
      const observer = new MutationObserver(() => {
        scheduleRefresh();
      });
      observer.observe(target, { childList: true, subtree: true, characterData: true });
    });

    ["tars:screen-changed", "tars:collections-updated", "tars:request-history-updated"].forEach((eventName) => {
      window.addEventListener(eventName, scheduleRefresh);
    });
  }

  boot().catch((error) => {
    devtools.repoVerifiedSurface = {
      mountedSaveContext: readMountedSaveContext(),
      mountedSourceContext: readMountedSourceContext(),
      repoVerifiedStatus: {
        consumed: false,
        status: "failed",
        detail: "repo-verified-bootstrap-failed",
        saveTag: runtime.currentSaveTag,
        verifiedHead: "none",
        pathsVerified: [],
        trusted: false,
      },
      repoVerifiedResponse: null,
      pathsCount: 0,
      error: error.message,
    };
    window.dispatchEvent(
      new CustomEvent("tars:repo-verified-updated", {
        detail: devtools.repoVerifiedSurface,
      }),
    );
  });
})();
