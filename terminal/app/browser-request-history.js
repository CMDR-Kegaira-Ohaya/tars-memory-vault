(() => {
  const runtime = {
    contract: null,
    currentSaveTag: null,
    historyPath: null,
    historyIndex: null,
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
      entryCount: 0,
      detail: "unmatched-history-surface-state"
    };
  }

  function matches(match, input) {
    return Object.entries(match).every(([key, expected]) => {
      const actual = input[key];
      if (expected === null) {
        return actual == null;
      }
      if (expected === "non-null") {
        return actual != null;
      }
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
      case "from-entry-count":
        return input.entryCount || 0;
      default:
        return value;
    }
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

  function render(surface) {
    const summary = document.getElementById("requestHistorySummary");
    const list = document.getElementById("requestHistoryList");
    const preview = document.getElementById("requestHistoryPreview");
    if (!summary || !list || !preview) {
      return;
    }

    summary.innerHTML = [
      `<div><span class="muted">status</span> ${surface.status}</div>`,
      `<div><span class="muted">save tag</span> ${surface.saveTag || "none"}</div>`,
      `<div><span class="muted">history path</span> ${surface.historyPath}</div>`,
      `<div><span class="muted">entry count</span> ${surface.entryCount}</div>`,
      `<div><span class="muted">detail</span> ${surface.detail}</div>`
    ].join("");

    list.innerHTML = "";
    const entries = runtime.historyIndex?.entries || [];
    if (!entries.length) {
      const span = document.createElement("span");
      span.className = "muted";
      span.textContent = runtime.currentSaveTag ? "history index unavailable" : "no mounted save slot";
      list.appendChild(span);
    } else {
      for (const entry of entries) {
        const item = document.createElement("div");
        item.className = "value";
        item.innerHTML = `<span class="muted">${entry.order}.</span> ${entry.kind} — ${entry.status}<br><span class="muted">${entry.path}</span>`;
        list.appendChild(item);
      }
    }

    preview.textContent = JSON.stringify({
      mountedSaveContext: readMountedSaveContext(),
      surface,
      historyIndex: runtime.historyIndex
    }, null, 2);
  }

  async function refresh() {
    const mountedSaveContext = readMountedSaveContext();
    const nextSaveTag = mountedSaveContext?.saveTag || null;
    const nextHistoryPath = mountedSaveContext?.historyPath || (nextSaveTag ? `terminal/saves/${nextSaveTag}/request-history-index.v1.json` : null);

    if (nextSaveTag !== runtime.currentSaveTag) {
      runtime.currentSaveTag = nextSaveTag;
      runtime.historyPath = nextHistoryPath;
      runtime.historyIndex = nextSaveTag ? await loadOptionalJson(nextHistoryPath) : null;
    } else if (nextSaveTag && !runtime.historyIndex) {
      runtime.historyIndex = await loadOptionalJson(nextHistoryPath);
    }

    const surface = deriveSurface({
      currentSaveTag: runtime.currentSaveTag,
      historyLoaded: Boolean(runtime.historyIndex),
      historyPath: runtime.historyPath,
      entryCount: runtime.historyIndex?.entries?.length || 0
    });
    render(surface);
  }

  async function boot() {
    runtime.contract = await loadJson("app/request-history-surface.v1.json");
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
    const preview = document.getElementById("requestHistoryPreview");
    const summary = document.getElementById("requestHistorySummary");
    if (summary) {
      summary.innerHTML = `<span class="warn">request history bootstrap failed</span>`;
    }
    if (preview) {
      preview.textContent = error.message;
    }
  });
})();
