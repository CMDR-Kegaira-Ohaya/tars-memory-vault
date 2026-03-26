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

  async function loadOptionalJson(path) {
    const response = await fetch(normalizePath(path));
    if (!response.ok) {
      return null;
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

  function readMountedSaveContext() {
    return parseJsonText(document.getElementById("mountedSaveContextPreview")?.textContent || "");
  }

  function matches(match, input) {
    return Object.entries(match || {}).every(([key, expected]) => {
      const actual = input[key];
      if (expected === null) {
        return actual == null;
      }
      if (expected === "non-null") {
        return actual != null;
      }
      if (typeof expected === "string" && expected.includes("|")) {
        return expected.split("|").includes(String(actual));
      }
      return String(actual) === String(expected);
    });
  }

  function resolveTemplate(value, input) {
    if (Array.isArray(value)) {
      return value.map((item) => resolveTemplate(item, input));
    }
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, nested]) => [key, resolveTemplate(nested, input)])
      );
    }
    if (typeof value !== "string") {
      return value;
    }
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
      trusted: false
    };
  }

  function exportSurface() {
    const mountedSaveContext = readMountedSaveContext();
    const surface = deriveSurface({
      responseLoaded: Boolean(runtime.verifiedResponse),
      responseStatus: runtime.verifiedResponse?.status || null,
      verificationHead: runtime.verifiedResponse?.verification?.head || null,
      verifiedPaths: (runtime.verifiedResponse?.verification?.pathsVerified || []).length ? "present" : "empty",
      currentSaveTag: runtime.currentSaveTag
    });

    devtools.repoVerifiedSurface = {
      mountedSaveContext,
      repoVerifiedStatus: surface,
      repoVerifiedResponse: runtime.verifiedResponse,
      pathsCount: Array.isArray(surface.pathsVerified) ? surface.pathsVerified.length : 0
    };

    window.dispatchEvent(new CustomEvent("tars:repo-verified-updated", {
      detail: devtools.repoVerifiedSurface
    }));
  }

  async function refresh() {
    const mountedSaveContext = readMountedSaveContext();
    const nextSaveTag = mountedSaveContext?.saveTag || null;
    const nextVerifiedResponsePath = mountedSaveContext?.verifiedResponsePath || null;

    if (nextSaveTag !== runtime.currentSaveTag || nextVerifiedResponsePath !== runtime.verifiedResponsePath) {
      runtime.currentSaveTag = nextSaveTag;
      runtime.verifiedResponsePath = nextVerifiedResponsePath;
      runtime.verifiedResponse = nextVerifiedResponsePath ? await loadOptionalJson(nextVerifiedResponsePath) : null;
    } else if (nextVerifiedResponsePath && !runtime.verifiedResponse) {
      runtime.verifiedResponse = await loadOptionalJson(nextVerifiedResponsePath);
    }

    exportSurface();
  }

  async function boot() {
    runtime.contract = await loadJson("app/repo-verified-save-status.v1.json");
    await refresh();

    const contextTarget = document.getElementById("mountedSaveContextPreview");
    if (contextTarget) {
      const observer = new MutationObserver(() => {
        refresh().catch(() => {});
      });
      observer.observe(contextTarget, { childList: true, subtree: true, characterData: true });
    }

    window.setInterval(() => {
      refresh().catch(() => {});
    }, 1500);
  }

  boot().catch((error) => {
    devtools.repoVerifiedSurface = {
      mountedSaveContext: readMountedSaveContext(),
      repoVerifiedStatus: {
        consumed: false,
        status: "failed",
        detail: "repo-verified-bootstrap-failed",
        saveTag: runtime.currentSaveTag,
        verifiedHead: "none",
        pathsVerified: [],
        trusted: false
      },
      repoVerifiedResponse: null,
      pathsCount: 0,
      error: error.message
    };
    window.dispatchEvent(new CustomEvent("tars:repo-verified-updated", {
      detail: devtools.repoVerifiedSurface
    }));
  });
})();
