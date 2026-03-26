(() => {
  const runtime = { contract: null };

  const shellLabelCacheKey = "__TARS_SHELL_LABEL_CACHE__";
  const shellLabelCache =
    window[shellLabelCacheKey] ||
    (window[shellLabelCacheKey] = {
      activeChip: null,
      pathLine: null,
    });

  function normalizePath(path) {
    return String(path || "").replace(/^terminal\//, "");
  }

  async function loadJson(path) {
    const response = await fetch(normalizePath(path));
    if (!response.ok) throw new Error(`failed to load ${path}`);
    return response.json();
  }

  function normalizeLabelText(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
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
    if (value === "from-recent-save") return input.recentSave || "none";
    return value;
  }

  function deriveSurface(input) {
    const states = runtime.contract?.states || {};
    for (const stateConfig of Object.values(states)) {
      if (matches(stateConfig.match || {}, input)) {
        return resolveTemplate(stateConfig.derive || {}, input);
      }
    }
    return {
      title: "Terminal summary",
      mountChip: input.currentMount || "none",
      availabilityChip: input.exportSource || "disabled",
      detail: "Home surface presentation fallback.",
      recentSaveLabel: input.recentSave || "none",
    };
  }

  function extractRawState(container) {
    const rows = Array.from(container.querySelectorAll(":scope > div"));
    const state = {};
    let found = false;

    rows.forEach((row) => {
      const label = row.querySelector(".muted")?.textContent?.trim()?.replace(/:$/, "");
      if (!label) return;
      const value = row.textContent.replace(label, "").trim();
      found = true;
      switch (label) {
        case "mode":
          state.mode = value;
          break;
        case "current mount":
          state.currentMount = value;
          break;
        case "recent save":
          state.recentSave = value;
          break;
        case "save":
          state.save = value;
          break;
        case "export source":
          state.exportSource = value;
          break;
        case "export output":
          state.exportOutput = value;
          break;
        case "runs surface":
          state.runsSurface = value;
          break;
        case "notes":
          state.notesState = value;
          break;
        case "quick actions":
          state.quickActions = value;
          break;
      }
    });

    if (found) {
      container.dataset.rawSummary = JSON.stringify(state);
      return state;
    }

    try {
      return JSON.parse(container.dataset.rawSummary || "{}");
    } catch {
      return {};
    }
  }

  function render(surface, rawState, container) {
    const renderState = JSON.stringify({ surface, rawState });
    if (container.dataset.renderState === renderState) return;
    container.dataset.renderState = renderState;
    container.innerHTML = `
      <div class="surface-stack">
        <div class="surface-header">
          <div class="surface-title">${surface.title}</div>
          <span class="surface-chip">${surface.mountChip}</span>
        </div>
        <div class="surface-meta-grid">
          <div><span class="muted">availability</span> ${surface.availabilityChip}</div>
          <div><span class="muted">recent save</span> ${surface.recentSaveLabel}</div>
          <div><span class="muted">save</span> ${rawState.save || "disabled"}</div>
          <div><span class="muted">export</span> ${rawState.exportSource || "disabled"}</div>
          <div><span class="muted">notes</span> ${rawState.notesState || "disabled"}</div>
          <div><span class="muted">runs</span> ${rawState.runsSurface || "idle"}</div>
        </div>
        <div class="surface-detail">${surface.detail}</div>
        <div class="surface-foot muted">quick actions: ${rawState.quickActions || "none"}</div>
      </div>
    `;
  }

  function stabilizeShellLabels() {
    const activeChip = document.querySelector(".terminal-active-screen");
    const pathLine = document.querySelector(".terminal-path-line");

    if (activeChip) {
      const activeText = normalizeLabelText(activeChip.textContent);
      if (activeText && activeText.toLowerCase() !== "screen") {
        shellLabelCache.activeChip = activeText;
      } else if (shellLabelCache.activeChip && activeText !== shellLabelCache.activeChip) {
        activeChip.textContent = shellLabelCache.activeChip;
      }
    }

    if (pathLine) {
      const pathText = normalizeLabelText(pathLine.textContent);
      const activeText = normalizeLabelText(activeChip?.textContent || shellLabelCache.activeChip);
      const looksFallback =
        !pathText ||
        /\/\s*none$/i.test(pathText) ||
        /\/\s*screen$/i.test(pathText) ||
        (/collections/i.test(activeText) && /\/\s*cartridges\b/i.test(pathText));

      if (!looksFallback) {
        shellLabelCache.pathLine = pathText;
      } else if (shellLabelCache.pathLine && pathText !== shellLabelCache.pathLine) {
        pathLine.textContent = shellLabelCache.pathLine;
      }
    }
  }

  function setLabelText(labelElement, text) {
    if (labelElement && labelElement.textContent !== text) {
      labelElement.textContent = text;
    }
  }

  function cleanHeaderTools() {
    const actionsHost = document.getElementById("actions");
    const panelLabel = actionsHost?.closest(".panel")?.querySelector(".label");
    setLabelText(panelLabel, "TOOLS");

    const hiddenActionKeys = new Set(["import-bay", "collections-explorer"]);
    Array.from(actionsHost?.querySelectorAll("button[data-action-key]") || []).forEach((button) => {
      const key = button.dataset.actionKey || "";
      button.style.display = hiddenActionKeys.has(key) ? "none" : "";
    });
  }

  function cleanMainTabs() {
    Array.from(document.querySelectorAll("#terminalScreenTabs button")).forEach((button) => {
      const label = normalizeLabelText(button.textContent).toLowerCase();
      button.style.display = ["request history", "repo verified"].includes(label) ? "none" : "";
    });
  }

  function ensureCollectionsHint(viewport) {
    const rawText = viewport.textContent || "";
    const looksCollections = /browse the repo catalogue under \/collections\//i.test(rawText);
    const existing = document.getElementById("terminalCollectionsHint");

    if (!looksCollections) {
      if (existing) existing.remove();
      return;
    }

    if (existing) return;

    const hint = document.createElement("div");
    hint.id = "terminalCollectionsHint";
    hint.className = "surface-list-item";
    hint.style.marginBottom = "12px";
    hint.innerHTML = `
      <div class="surface-header">
        <div class="surface-title">Start here</div>
        <span class="surface-chip">guided path</span>
      </div>
      <div class="surface-detail">1. Refresh catalogue if needed. 2. Import file to bring something in. 3. Select an item below. 4. Use Request History or Repo Verified only when you are checking a save path.</div>
    `;
    viewport.prepend(hint);
  }

  function renameViewportButtons(viewport) {
    Array.from(viewport.querySelectorAll("button")).forEach((button) => {
      const text = normalizeLabelText(button.textContent);
      if (text === "Open import bay") {
        button.textContent = "Import file";
      }
      if ((text === "Copy selected request" || text === "Remove local stage") && button.disabled) {
        button.style.display = "none";
      } else if (text === "Copy selected request" || text === "Remove local stage") {
        button.style.display = "";
      }
    });
  }

  function applyTerminalUxCleanup() {
    cleanHeaderTools();
    cleanMainTabs();

    const viewport = document.getElementById("runsViewport");
    if (viewport) {
      renameViewportButtons(viewport);
      ensureCollectionsHint(viewport);
    }
  }

  function refresh() {
    const container = document.getElementById("homeSummary");
    if (!container) return;
    const rawState = extractRawState(container);
    const surface = deriveSurface(rawState);
    render(surface, rawState, container);
    stabilizeShellLabels();
    applyTerminalUxCleanup();
  }

  async function boot() {
    runtime.contract = await loadJson("app/home-surface.v1.json");
    refresh();

    const observeIds = ["homeSummary", "terminalHeaderBar", "runsViewport", "actions", "terminalScreenTabs"];
    observeIds.forEach((id) => {
      const node = document.getElementById(id);
      if (!node) return;
      const observer = new MutationObserver(() => refresh());
      observer.observe(node, { childList: true, subtree: true, characterData: true, attributes: true });
    });

    [
      "tars:screen-changed",
      "tars:collections-updated",
      "tars:request-history-updated",
      "tars:repo-verified-updated",
      "tars:devtools-changed",
    ].forEach((eventName) => window.addEventListener(eventName, () => refresh()));

    window.setInterval(refresh, 1500);
  }

  boot().catch(() => {});
})();
