(() => {
  const runtime = {
    contract: null,
    lastRuntimeToken: null,
    controlsInstalled: false,
  };

  const shellLabelCacheKey = "__TARS_SHELL_LABEL_CACHE__";
  const shellLabelCache = window[shellLabelCacheKey] || (window[shellLabelCacheKey] = {
    activeChip: null,
    pathLine: null,
  });

  function normalizeLabelText(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
  }

  function injectSystemsCheckStyles() {
    if (document.getElementById("terminal-systems-check-style")) return;
    const style = document.createElement("style");
    style.id = "terminal-systems-check-style";
    style.textContent = `
      #actions.terminal-systems-check {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 8px;
      }
      #actions.terminal-systems-check button {
        pointer-events: none;
        cursor: default;
      }
      #actions.terminal-systems-check .terminal-systems-pill {
        border-radius: 14px;
        border: 1px solid rgba(186, 156, 255, 0.2);
        background: rgba(255, 255, 255, 0.02);
        color: #e6ebf2;
        padding: 10px 12px;
        text-align: left;
        box-shadow: none;
      }
      #actions.terminal-systems-check .terminal-systems-pill-label {
        display: block;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: #b38cff;
        margin-bottom: 6px;
      }
      #actions.terminal-systems-check .terminal-systems-pill-value {
        display: block;
        color: #aab4c5;
        line-height: 1.35;
      }
    `;
    document.head.appendChild(style);
  }

  function splitActionText(value) {
    const raw = normalizeLabelText(value);
    const match = raw.match(/^(.*?)(?:\s*:\s*(.*))?$/);
    const label = normalizeLabelText(match?.[1] || raw || "system");
    const status = normalizeLabelText(match?.[2] || "") || "available";
    return { label, status };
  }

  function formatSystemsCheck() {
    injectSystemsCheckStyles();
    const actions = document.getElementById("actions");
    const actionsPanel = actions?.closest(".panel");
    const actionsLabel = actionsPanel?.querySelector(".label");
    if (actionsLabel) actionsLabel.textContent = "systems check";
    if (!actions) return;
    actions.classList.add("terminal-systems-check");

    actions.querySelectorAll("button.terminal-runtime-action").forEach((button) => button.remove());

    Array.from(actions.querySelectorAll("button")).forEach((button) => {
      const parsed = splitActionText(button.dataset.rawText || button.textContent || "");
      const renderState = JSON.stringify(parsed);
      if (button.dataset.systemsCheckRenderState !== renderState) {
        button.dataset.systemsCheckRenderState = renderState;
        button.innerHTML = `
          <span class="terminal-systems-pill-label">${parsed.label}</span>
          <span class="terminal-systems-pill-value">${parsed.status}</span>
        `;
      }
      if (!button.disabled) button.disabled = true;
      if (button.tabIndex !== -1) button.tabIndex = -1;
      if (button.getAttribute("aria-disabled") !== "true") {
        button.setAttribute("aria-disabled", "true");
      }
      button.classList.add("terminal-systems-pill");
    });
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

  function normalizePath(path) {
    return String(path || "").replace(/^terminal\//, "");
  }

  async function loadJson(path) {
    const response = await fetch(normalizePath(path));
    if (!response.ok) throw new Error(`failed to load ${path}`);
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
        case "mode": state.mode = value; break;
        case "current mount": state.currentMount = value; break;
        case "recent save": state.recentSave = value; break;
        case "save": state.save = value; break;
        case "export source": state.exportSource = value; break;
        case "export output": state.exportOutput = value; break;
        case "runs surface": state.runsSurface = value; break;
        case "notes": state.notesState = value; break;
        case "quick actions": state.quickActions = value; break;
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

  function hasActiveRuntimeState(rawState) {
    const currentMount = normalizeLabelText(rawState?.currentMount || "").toLowerCase();
    if (currentMount && !["none", "idle", "unmounted"].includes(currentMount)) return true;
    const mode = normalizeLabelText(rawState?.mode || "").toLowerCase();
    return ["runs", "mounted", "import-bay"].includes(mode);
  }

  function getRuntimeToken(rawState) {
    if (!hasActiveRuntimeState(rawState)) return "none";
    const currentMount = normalizeLabelText(rawState?.currentMount || "none");
    const mode = normalizeLabelText(rawState?.mode || "home");
    return `${mode}::${currentMount}`;
  }

  function requestHomeScreen() {
    window.dispatchEvent(new CustomEvent("tars:screen-request", { detail: { screen: "home" } }));
  }

  function syncMountedRuntimeToHome(rawState) {
    const nextToken = getRuntimeToken(rawState);
    if (runtime.lastRuntimeToken === nextToken) return;
    const previousToken = runtime.lastRuntimeToken;
    runtime.lastRuntimeToken = nextToken;

    if (nextToken === "none") return;
    if (previousToken === nextToken) return;

    const activeScreen = String(window.__TARS_SCREEN_UI__?.activeScreen || "home");
    if (["home", "request-history", "repo-verified"].includes(activeScreen)) return;
    requestHomeScreen();
  }

  function scheduleHomeSync(reason) {
    [80, 220].forEach((delay) => {
      window.setTimeout(() => {
        if (reason === "clear") {
          requestHomeScreen();
        }
        refresh();
        window.dispatchEvent(new CustomEvent("tars:home-updated"));
      }, delay);
    });
  }

  function installRuntimeControls() {
    if (runtime.controlsInstalled) return;
    runtime.controlsInstalled = true;

    document.addEventListener("click", (event) => {
      const target = event.target?.closest?.("button");
      if (!target) return;
      if (target.matches("#collectionsMountConfirm, #boardsMountConfirm, #mountCartridge, #mountBoard")) {
        scheduleHomeSync("mount");
      }
      if (target.matches("#clearMount")) {
        scheduleHomeSync("clear");
      }
    }, true);
  }

  function refresh() {
    const container = document.getElementById("homeSummary");
    if (!container) return;
    const rawState = extractRawState(container);
    const surface = deriveSurface(rawState);
    render(surface, rawState, container);
    stabilizeShellLabels();
    formatSystemsCheck();
    syncMountedRuntimeToHome(rawState);
  }

  async function boot() {
    runtime.contract = await loadJson("app/home-surface.v1.json");
    installRuntimeControls();
    refresh();

    [
      "tars:screen-changed",
      "tars:collections-updated",
      "tars:devtools-changed",
      "tars:request-history-updated",
      "tars:repo-verified-updated",
      "tars:home-updated",
    ].forEach((eventName) => window.addEventListener(eventName, refresh));
  }

  boot().catch(() => {});
})();