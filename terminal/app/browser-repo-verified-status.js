(() => {
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

  function render(surface) {
    const summary = document.getElementById("repoVerifiedSummary");
    const preview = document.getElementById("repoVerifiedPreview");
    if (!summary || !preview) {
      return;
    }

    summary.innerHTML = [
      `<div><span class="muted">consumed</span> ${surface.consumed}</div>`,
      `<div><span class="muted">status</span> ${surface.status}</div>`,
      `<div><span class="muted">detail</span> ${surface.detail}</div>`,
      `<div><span class="muted">save tag</span> ${surface.saveTag || "none"}</div>`,
      `<div><span class="muted">verified head</span> ${surface.verifiedHead}</div>`,
      `<div><span class="muted">trusted</span> ${surface.trusted}</div>`,
      `<div><span class="muted">paths verified</span> ${Array.isArray(surface.pathsVerified) ? surface.pathsVerified.length : 0}</div>`,
      `<div class="muted" style="margin-top:8px;">repo-verified state is driven from mounted save context path refs, not local apply markers</div>`
    ].join("");

    preview.textContent = JSON.stringify({
      mountedSaveContext: readMountedSaveContext(),
      repoVerifiedStatus: surface,
      repoVerifiedResponse: runtime.verifiedResponse
    }, null, 2);
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

    const surface = deriveSurface({
      responseLoaded: Boolean(runtime.verifiedResponse),
      responseStatus: runtime.verifiedResponse?.status || null,
      verificationHead: runtime.verifiedResponse?.verification?.head || null,
      verifiedPaths: (runtime.verifiedResponse?.verification?.pathsVerified || []).length ? "present" : "empty",
      currentSaveTag: runtime.currentSaveTag,
    });

    render(surface);
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
    const summary = document.getElementById("repoVerifiedSummary");
    const preview = document.getElementById("repoVerifiedPreview");
    if (summary) {
      summary.innerHTML = `<span class="warn">repo verified status bootstrap failed</span>`;
    }
    if (preview) {
      preview.textContent = error.message;
    }
  });
})();
