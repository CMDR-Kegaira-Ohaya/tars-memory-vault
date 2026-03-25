(() => {
  const runtime = {
    contract: null,
    surface: null,
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
    try {
      return await loadJson(path);
    } catch {
      return null;
    }
  }

  function parseJsonText(text) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  function readSaveBridgeRequest() {
    return parseJsonText(document.getElementById("saveBridgePreview")?.textContent || "");
  }

  function readRepoVerifiedPreview() {
    return parseJsonText(document.getElementById("repoVerifiedPreview")?.textContent || "");
  }

  function matches(match, input) {
    return Object.entries(match || {}).every(([key, expected]) => {
      const actual = input[key];
      if (expected === null) return actual == null;
      if (expected === "non-null") return actual != null;
      return String(actual) === String(expected);
    });
  }

  function stableStringify(value) {
    if (Array.isArray(value)) {
      return `[${value.map((item) => stableStringify(item)).join(",")}]`;
    }
    if (value && typeof value === "object") {
      return `{
        ...Object.keys(value)
          .sort()
          .reduce((accord, key) => {
            accord[key] = value[key];
            return accord;
          }, {})
      };
    }
    return value;
  }

  function isEqual(a, b) {
    return JSON.stringify(stableStringify(a)) === JSON.stringify(stableStringify(b));
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
      case "from-current-request-id":
        return input.currentRequestId || null;
      case "from-changed-files":
        return input.changedFiles;
      case "from-change-count":
        return input.changeCount;
      case "from-targets":
        return input.targets;
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
      requestId: input.currentRequestId || null,
      changedFiles: input.changedFiles || [],
      changeCount: input.changeCount || 0,
      detail: "unknown-delta-state",
      targets: input.targets || []
    };
  }

  function buildTargets(saveTag) {
    if (!saveTag) return [];
    return [
      `terminal/saves/${saveTag}/state.json`,
      `terminal/saves/${saveTag}/session.json`,
      `terminal/saves/${saveTag}/notes.json`
    ];
  }

  async function buildInput() {
    const saveBridgeRequest = readSaveBridgeRequest();
    const repoVerifiedPreview = readRepoVerifiedPreview();
    const currentSaveTag = saveBridgeRequest?.saveTag || repoVerifiedPreview?.repoVerifiedStatus?.saveTag || null;
    const currentWrites = saveBridgeRequest?.writes || null;
    const currentRequestId = saveBridgeRequest?.requestId || repoVerifiedPreview?.repoVerifiedStatus?.requestId || null;
    const targets = buildTargets(currentSaveTag);

    let savedState = null;
    let savedSession = null;
    let savedNotes = null;
    if (currentSaveTag) {
      savedState = await loadOptionalJson(`terminal/saves/${currentSaveTag}/state.json`);
      savedSession = await loadOptionalJson(`terminal/saves/${currentSaveTag}/session.json`);
      savedNotes = await loadOptionalJson(`terminal/saves/${currentSaveTag}/notes.json`);
    }

    const changedFiles = [];
    if (Array.isArray(currentWrites)) {
      for (const write of currentWrites) {
        const kind = write?.kind || "unknown";
        const payload = write?.payload || null;
        let saved = null;
        let file = write?.path || null;
        if (kind === "state") {
          saved = savedState;
          file = file || `terminal/saves/${currentSaveTag}/state.json`;
        } else if (kind === "session") {
          saved = savedSession;
          file = file || `terminal/saves/${currentSaveTag}/session.json`;
        } else if (kind === "notes") {
          saved = savedNotes;
          file = file || `terminal/saves/${currentSaveTag}/notes.json`;
        }
        if (!isEqual(payload, saved)) {
          changedFiles.push({ kind, path: file, state: saved == null ? "new-or-unsaved" : "changed" });
        }
      }
    }

    return {
      currentSaveTag,
      currentRequestId,
      currentWrites,
      savedState,
      savedSession,
      savedNotes,
      verifiedStatus: repoVerifiedPreview?.repoVerifiedStatus || null,
      changedFiles,
      changeCount: changedFiles.length,
      targets
    };
  }

  function render(surface) {
    runtime.surface = surface;
    const summary = document.getElementById("deltaSummary");
    if (summary) {
      const changedFiles = Array.isArray(surface.changedFiles) ? surface.changedFiles : [];
      const changesHtml = changedFiles.length
        ? changedFiles
            .map((entry) => `<div class="surface-list-item"><div><span class="muted">${entry.kind}</span> ${entry.state}</div><div>${entry.path}</div></div>`)
            .join("")
        : `<div><span class="muted">changed files</span> none</div>`;
      summary.innerHTML = [
        `<div><span class="muted">status</span> ${surface.status}</div>`,
        `<div><span class="muted">save tag</span> ${surface.saveTag || "none"}</div>`,
        `<div><span class="muted">request id</span> ${surface.requestId || "none"}</div>`,
        `<div><span class="muted">change count</span> ${surface.changeCount || 0}</div>`,
        `<div class="surface-foot">${surface.detail}</div>`,
        changesHtml
      ].join("");
    }

    const preview = document.getElementById("deltaPreview");
    if (preview) {
      preview.textContent = JSON.stringify(surface, null, 2);
    }
  }

  async function refresh() {
    render(deriveSurface(await buildInput()));
  }

  async function boot() {
    runtime.contract = await loadJson("app/delta-surface.v1.json");
    await refresh();

    const observerTargets = [
      document.getElementById("saveBridgePreview"),
      document.getElementById("repoVerifiedPreview")
    ].filter(Boolean);

    const observer = new MutationObserver(() => {
      refresh().catch(() => {});
    });
    observerTargets.forEach((target) => observer.observe(target, { childList: true, subtree: true, characterData: true }));

    window.setInterval(() => {
      refresh().catch(() => {});
    }, 1500);
  }

  boot().catch((error) => {
    const summary = document.getElementById("deltaSummary");
    const preview = document.getElementById("deltaPreview");
    if (summary) {
      summary.innerHTML = `<span class="warn">delta surface bootstrap failed</span>`;
    }
    if (preview) {
      preview.textContent = JSON.stringify({
        status: "bootstrap-error",
        message: error.message,
        source: "delta-surface"
      }, null, 2);
    }
  });
})();
