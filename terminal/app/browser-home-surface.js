(() => {
  const runtime = {
    contract: null,
    lastDevScreen: "request-history",
    devHubOpen: false,
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

  function injectDevDestinationStyles() {
    if (document.getElementById("terminal-dev-destination-style")) return;
    const style = document.createElement("style");
    style.id = "terminal-dev-destination-style";
    style.textContent = `
      .terminal-dev-hidden-tab {
        display: none !important;
      }
      .terminal-dev-drawer > summary {
        display: none !important;
      }
      .terminal-dev-selector-shell {
        display: grid;
        gap: 10px;
        padding-bottom: 12px;
        margin-bottom: 12px;
        border-bottom: 1px solid rgba(186, 156, 255, 0.16);
      }
      .terminal-dev-selector-title {
        color: #b38cff;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        font-size: 11px;
      }
      .terminal-dev-selector-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .terminal-dev-selector-button {
        border-radius: 999px;
        border: 1px solid rgba(186, 156, 255, 0.24);
        background: rgba(255, 255, 255, 0.02);
        color: #e6ebf2;
        padding: 10px 14px;
      }
      .terminal-dev-selector-button[data-active="true"] {
        border-color: rgba(88, 231, 243, 0.32);
        color: #58e7f3;
        box-shadow: 0 0 14px rgba(88, 231, 243, 0.08);
      }
      .terminal-dev-hub {
        display: grid;
        gap: 12px;
        border: 1px solid rgba(186, 156, 255, 0.18);
        border-radius: 18px;
        background: linear-gradient(180deg, rgba(18, 22, 34, 0.92), rgba(8, 10, 16, 0.96));
        padding: 18px;
        margin-bottom: 16px;
      }
      .terminal-dev-hub-title {
        color: #b38cff;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        font-size: 11px;
      }
      .terminal-dev-hub-detail {
        color: #aab4c5;
        line-height: 1.5;
      }
      .terminal-dev-hub-list {
        display: grid;
        gap: 10px;
      }
      .terminal-dev-hub-button {
        width: 100%;
        text-align: left;
        border-radius: 16px;
        border: 1px solid rgba(186, 156, 255, 0.24);
        background: rgba(255, 255, 255, 0.02);
        color: #e6ebf2;
        padding: 14px 16px;
      }
      .terminal-dev-hub-button[data-active="true"] {
        border-color: rgba(88, 231, 243, 0.32);
        color: #58e7f3;
        box-shadow: 0 0 14px rgba(88, 231, 243, 0.08);
      }
      .terminal-dev-hub-button .muted {
        display: block;
        margin-top: 4px;
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
      button.disabled = true;
      button.tabIndex = -1;
      button.setAttribute("aria-disabled", "true");
      button.classList.add("terminal-systems-pill");
    });
  }

  function getInspectionScreenFromText(value) {
    const text = normalizeLabelText(value).toLowerCase();
    if (text === "request history") return "request-history";
    if (text === "repo verified") return "repo-verified";
    return null;
  }

  function getInspectionLabel(screen) {
    return screen === "repo-verified" ? "Repo Verified" : "Request History";
  }

  function getInspectionSummary(screen) {
    return screen === "repo-verified"
      ? "Inspect authenticated repo verification."
      : "Inspect the mounted save and apply chain.";
  }

  function getCurrentInspectionScreen() {
    const activeChip = normalizeLabelText(document.querySelector(".terminal-active-screen")?.textContent).toLowerCase();
    const fromChip = getInspectionScreenFromText(activeChip);
    if (fromChip) return fromChip;

    const hiddenActive = document.querySelector(
      "#terminalScreenTabs .terminal-dev-hidden-tab[data-active='true'], #nav .terminal-dev-hidden-tab[data-active='true']",
    );
    return getInspectionScreenFromText(hiddenActive?.textContent) || runtime.lastDevScreen || "request-history";
  }

  function openDevDestination(screen) {
    runtime.devHubOpen = true;
    const nextScreen = screen || runtime.lastDevScreen || "request-history";
    runtime.lastDevScreen = nextScreen;
    renderDevHub();
    const runsViewport = document.getElementById("runsViewport");
    if (runsViewport) {
      runsViewport.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }

  function closeDevHub() {
    runtime.devHubOpen = false;
    removeDevHub();
    syncDevDestinationNavigation();
  }

  function activateDevScreen(screen) {
    runtime.lastDevScreen = screen || runtime.lastDevScreen || "request-history";
    runtime.devHubOpen = false;
    removeDevHub();
    window.dispatchEvent(new CustomEvent("tars:screen-request", { detail: { screen: runtime.lastDevScreen } }));
  }

  function markDevButtonActive(button, active) {
    button.dataset.active = String(active);
    button.dataset.selected = String(active);
    if (active) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  }

  function upsertDevDestinationButton(host, activeScreen) {
    if (!host) return;
    const exemplar = host.querySelector("button:not(.terminal-dev-hidden-tab):not([data-dev-destination='true'])");
    let button = host.querySelector("button[data-dev-destination='true']");
    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.dataset.devDestination = "true";
      button.className = exemplar?.className || "";
      button.addEventListener("click", () => {
        if (runtime.devHubOpen) {
          closeDevHub();
          return;
        }
        openDevDestination(activeScreen || runtime.lastDevScreen || "request-history");
      });
      host.appendChild(button);
    }
    button.textContent = "Dev";
    markDevButtonActive(button, Boolean(activeScreen) || runtime.devHubOpen);
  }

  function formatNavHostAsDevDestination(host) {
    if (!host) return;
    injectDevDestinationStyles();

    const buttons = Array.from(host.querySelectorAll("button"));
    const inspectionButtons = buttons.filter((button) => getInspectionScreenFromText(button.textContent));
    if (!inspectionButtons.length) return;

    let activeScreen = null;
    inspectionButtons.forEach((button) => {
      const screen = getInspectionScreenFromText(button.textContent);
      if (button.dataset.active === "true" || button.dataset.selected === "true" || button.getAttribute("aria-current") === "page") {
        activeScreen = screen;
      }
      button.classList.add("terminal-dev-hidden-tab");
      button.tabIndex = -1;
      button.setAttribute("aria-hidden", "true");
    });

    if (activeScreen) runtime.devHubOpen = false;
    runtime.lastDevScreen = activeScreen || runtime.lastDevScreen || "request-history";
    upsertDevDestinationButton(host, activeScreen);
  }

  function renderDevSelector() {
    injectDevDestinationStyles();
    const drawerContent = document.getElementById("terminalDevDrawerContent");
    if (!drawerContent) return;

    let selector = document.getElementById("terminalDevSelector");
    if (!selector) {
      selector = document.createElement("div");
      selector.id = "terminalDevSelector";
      selector.className = "terminal-dev-selector-shell";
      drawerContent.prepend(selector);
    }

    const activeScreen = getCurrentInspectionScreen();
    runtime.lastDevScreen = activeScreen || runtime.lastDevScreen || "request-history";

    selector.innerHTML = `
      <div class="terminal-dev-selector-title">Dev destination</div>
      <div class="terminal-dev-selector-row">
        ${["request-history", "repo-verified"]
          .map(
            (screen) => `
              <button
                type="button"
                class="terminal-dev-selector-button"
                data-dev-screen="${screen}"
                data-active="${String(activeScreen === screen)}"
              >
                ${getInspectionLabel(screen)}
              </button>
            `,
          )
          .join("")}
      </div>
    `;

    selector.querySelectorAll("[data-dev-screen]").forEach((button) => {
      button.addEventListener("click", () => activateDevScreen(button.dataset.devScreen));
    });
  }

  function removeDevHub() {
    document.getElementById("terminalDevHub")?.remove();
  }

  function renderDevHub() {
    injectDevDestinationStyles();
    const runsViewport = document.getElementById("runsViewport");
    if (!runsViewport) return;

    if (!runtime.devHubOpen) {
      removeDevHub();
      return;
    }

    const currentInspection = getCurrentInspectionScreen();
    runtime.lastDevScreen = currentInspection || runtime.lastDevScreen || "request-history";

    let hub = document.getElementById("terminalDevHub");
    if (!hub) {
      hub = document.createElement("div");
      hub.id = "terminalDevHub";
      hub.className = "terminal-dev-hub";
      runsViewport.prepend(hub);
    }

    hub.innerHTML = `
      <div class="terminal-dev-hub-title">Dev</div>
      <div class="terminal-dev-hub-detail">
        Choose an inspection surface for the main screen.
      </div>
      <div class="terminal-dev-hub-list">
        ${["request-history", "repo-verified"]
          .map(
            (screen) => `
              <button
                type="button"
                class="terminal-dev-hub-button"
                data-dev-hub-screen="${screen}"
                data-active="${String(runtime.lastDevScreen === screen)}"
              >
                <span class="surface-title">${getInspectionLabel(screen)}</span>
                <span class="muted">${getInspectionSummary(screen)}</span>
              </button>
            `,
          )
          .join("")}
      </div>
    `;

    hub.querySelectorAll("[data-dev-hub-screen]").forEach((button) => {
      button.addEventListener("click", () => activateDevScreen(button.dataset.devHubScreen));
    });
  }

  function syncDevDestinationNavigation() {
    formatNavHostAsDevDestination(document.getElementById("nav"));
    formatNavHostAsDevDestination(document.getElementById("terminalScreenTabs"));
    renderDevSelector();
    renderDevHub();
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

  function refresh() {
    const container = document.getElementById("homeSummary");
    if (!container) return;
    const rawState = extractRawState(container);
    const surface = deriveSurface(rawState);
    render(surface, rawState, container);
    stabilizeShellLabels();
    formatSystemsCheck();
    syncDevDestinationNavigation();
  }

  async function boot() {
    runtime.contract = await loadJson("app/home-surface.v1.json");
    refresh();

    const container = document.getElementById("homeSummary");
    if (container) {
      const observer = new MutationObserver(() => refresh());
      observer.observe(container, { childList: true, subtree: true, characterData: true });
    }

    const headerBar = document.getElementById("terminalHeaderBar");
    if (headerBar) {
      const headerObserver = new MutationObserver(() => {
        stabilizeShellLabels();
        formatSystemsCheck();
        syncDevDestinationNavigation();
      });
      headerObserver.observe(headerBar, { childList: true, subtree: true, characterData: true });
    }

    const actions = document.getElementById("actions");
    if (actions) {
      const actionsObserver = new MutationObserver(() => formatSystemsCheck());
      actionsObserver.observe(actions, { childList: true, subtree: true, characterData: true, attributes: true });
    }

    const navHosts = [document.getElementById("nav"), document.getElementById("terminalScreenTabs"), document.getElementById("terminalDevDrawerContent"), document.getElementById("runsViewport")].filter(Boolean);
    navHosts.forEach((host) => {
      const navObserver = new MutationObserver(() => syncDevDestinationNavigation());
      navObserver.observe(host, { childList: true, subtree: true, characterData: true, attributes: true });
    });

    [
      "tars:screen-changed",
      "tars:collections-updated",
      "tars:devtools-changed",
    ].forEach((eventName) => window.addEventListener(eventName, () => {
      if (getCurrentInspectionScreen()) {
        runtime.devHubOpen = false;
      }
      stabilizeShellLabels();
      formatSystemsCheck();
      syncDevDestinationNavigation();
    }));

    window.setInterval(refresh, 1500);
  }

  boot().catch(() => {});
})();