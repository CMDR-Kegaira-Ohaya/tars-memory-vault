(() => {
  const collectionsKey = "__TARS_COLLECTIONS__";
  const shared = window[collectionsKey] || (window[collectionsKey] = {});
  const devtoolsKey = "__TARS_DEVTOOLS__";
  const devtools = window[devtoolsKey] || (window[devtoolsKey] = {
    mountedCartridge: null,
    requestHistorySurface: null,
    repoVerifiedSurface: null,
  });
  const screenSourcesKey = "__TARS_SCREEN_SOURCES__";
  const screenSources = window[screenSourcesKey] || (window[screenSourcesKey] = {});
  const screenUiKey = "__TARS_SCREEN_UI__";
  const screenUi = window[screenUiKey] || (window[screenUiKey] = {
    activeScreen: "home",
    lastBaseScreen: "cartridge-bay",
    shellBuilt: false,
  });

  if (shared.fetchBridgeInstalled) {
    return;
  }

  const screenOrder = [
    "home",
    "cartridge-bay",
    "collections",
    "boards",
    "request-history",
    "repo-verified",
  ];

  const legacyMarkAppliedButton = document.getElementById("markApplyAsAapplied");
  if (legacyMarkAppliedButton && !document.getElementById("markApplyAsApplied")) {
    legacyMarkAppliedButton.id = "markApplyAsApplied";
  }

  function displayName(screen) {
    switch (screen) {
      case "home":
        return "Home";
      case "cartridge-bay":
        return "Cartridges";
      case "collections":
        return "Collections";
      case "boards":
        return "Boards";
      case "request-history":
        return "Request History";
      case "repo-verified":
        return "Repo Verified";
      default:
        return "Screen";
    }
  }

  function emitDevtoolsChanged() {
    window.dispatchEvent(
      new CustomEvent("tars:devtools-changed", {
        detail: { mountedCartridge: devtools.mountedCartridge },
      })
    );
  }

  function emitScreenChanged() {
    window.dispatchEvent(
      new CustomEvent("tars:screen-changed", {
        detail: {
          activeScreen: screenUi.activeScreen,
          lastBaseScreen: screenUi.lastBaseScreen,
        },
      })
    );
  }

  function getActiveScreen() {
    if (devtools.mountedCartridge === "request-history") return "request-history";
    if (devtools.mountedCartridge === "repo-verified") return "repo-verified";
    return screenUi.activeScreen || "home";
  }

  function setActiveScreen(screen, { syncDevtools = true } = {}) {
    const nextScreen = screen || "home";
    const previousMounted = devtools.mountedCartridge;
    if (syncDevtools) {
      if (nextScreen === "request-history" || nextScreen === "repo-verified") {
        devtools.mountedCartridge = nextScreen;
      } else if (devtools.mountedCartridge) {
        devtools.mountedCartridge = null;
      }
    }

    if (nextScreen !== "request-history" && nextScreen !== "repo-verified") {
      screenUi.activeScreen = nextScreen;
      screenUi.lastBaseScreen = nextScreen;
    } else {
      screenUi.activeScreen = nextScreen;
    }

    if (previousMounted !== devtools.mountedCartridge) {
      emitDevtoolsChanged();
    }
    emitScreenChanged();
    renderShellChrome();
  }

  function handleScreenRequest(event) {
    const requested = event?.detail?.screen;
    if (!requested) return;
    setActiveScreen(requested);
  }

  function upsertLauncher(actions, id, key, label) {
    let button = document.getElementById(id);
    if (!button || button.parentElement !== actions) {
      button = document.createElement("button");
      button.id = id;
      button.addEventListener("click", () => {
        if (getActiveScreen() === key) {
          setActiveScreen(screenUi.lastBaseScreen || "home");
        } else {
          setActiveScreen(key);
        }
      });
      actions.appendChild(button);
    }

    const state = getActiveScreen() === key ? "active" : "available";
    button.disabled = false;
    button.removeAttribute("aria-disabled");
    button.dataset.actionKey = key;
    button.dataset.actionState = state;
    button.dataset.rawActionState = state;
    button.dataset.rawText = `${label} : ${state}`;
    button.textContent = button.dataset.rawText;
  }

  function ensureDevtoolsLaunchers() {
    const actions = document.getElementById("actions");
    if (!actions) return;
    upsertLauncher(actions, "action-request-history", "request-history", "request-history");
    upsertLauncher(actions, "action-repo-verified", "repo-verified", "repo-verified");
  }

  function normalizeInput(input) {
    const raw = typeof input === "string" ? input : input?.url || "";
    return String(raw).replace(/^terminal\//, "");
  }

  function wrapJsonResponse(response, onJson) {
    return new Proxy(response, {
      get(target, prop) {
        if (prop === "json") {
          return async () => {
            const data = await target.clone().json();
            return onJson(data);
          };
        }
        const value = target[prop];
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
  }

  function injectStyles() {
    if (document.getElementById("terminal-shell-v2-style")) return;
    const style = document.createElement("style");
    style.id = "terminal-shell-v2-style";
    style.textContent = `
      :root {
        --bg: #090b12;
        --panel: #10131c;
        --line: rgba(179, 140, 255, 0.22);
        --line-strong: rgba(88, 231, 243, 0.28);
        --text: #c8ced7;
        --muted: #8f96ab;
        --accent: #58e7f3;
        --accent-2: #b38cff;
        --warn: #ffbe86;
        --screen: #0b0f16;
        --screen-edge: rgba(179, 140, 255, 0.18);
        --glow-soft: 0 0 14px rgba(88, 231, 243, 0.08);
      }

      body {
        background:
          radial-gradient(circle at top left, rgba(179, 140, 255, 0.08), transparent 42%),
          radial-gradient(circle at top right, rgba(88, 231, 243, 0.06), transparent 36%),
          var(--bg);
        color: var(--text);
      }

      .shell {
        display: block;
        min-height: 100vh;
        padding: 16px;
      }

      .terminal-shell-v2 {
        display: grid;
        grid-template-columns: 280px minmax(0, 1fr);
        grid-template-rows: auto minmax(0, 1fr) auto;
        grid-template-areas:
          "header header"
          "rail main"
          "footer footer";
        gap: 14px;
        min-height: calc(100vh - 32px);
      }

      .terminal-header-shell { grid-area: header; }
      .terminal-rail-shell { grid-area: rail; min-width: 0; }
      .terminal-main-shell { grid-area: main; min-width: 0; min-height: 0; }
      .terminal-footer-shell { grid-area: footer; }

      .terminal-header-shell,
      .terminal-rail-shell,
      .terminal-main-shell,
      .terminal-footer-shell,
      .terminal-dev-drawer {
        border: 1px solid var(--line);
        background: linear-gradient(180deg, rgba(13, 16, 24, 0.96), rgba(9, 11, 18, 0.98));
        border-radius: 18px;
        overflow: hidden;
      }

      .terminal-header-shell {
        display: grid;
        grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.9fr);
      }

      .terminal-header-bar,
      .terminal-header-controls {
        padding: 14px 16px;
      }

      .terminal-header-bar {
        border-right: 1px solid var(--line);
        display: grid;
        gap: 10px;
      }

      .terminal-brand-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      .terminal-brand {
        font-size: 12px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--accent-2);
      }

      .terminal-active-screen {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        border: 1px solid var(--line-strong);
        border-radius: 999px;
        color: var(--accent);
        box-shadow: var(--glow-soft);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        font-size: 11px;
      }

      .terminal-header-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
      }

      .header-chip {
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 10px 12px;
        background: rgba(255, 255, 255, 0.01);
      }

      .header-chip .chip-label {
        display: block;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--accent-2);
        margin-bottom: 6px;
      }

      .header-chip .chip-value {
        color: var(--text);
        line-height: 1.4;
      }

      .terminal-status-line {
        color: var(--muted);
        line-height: 1.6;
      }

      .terminal-header-controls {
        display: grid;
        gap: 12px;
      }

      .terminal-header-controls .panel {
        border: none;
        background: transparent;
        padding: 0;
      }

      .terminal-header-controls .label {
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--accent-2);
      }

      .terminal-header-controls #nav,
      .terminal-header-controls #actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .terminal-header-controls button,
      .terminal-screen-tabs button,
      .control-pad-button {
        border-radius: 999px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.02);
        color: var(--text);
        transition: border-color 120ms ease, color 120ms ease, box-shadow 120ms ease, background 120ms ease;
      }

      .terminal-header-controls button[data-action-state="active"],
      .terminal-screen-tabs button[data-active="true"],
      .terminal-rail-shell .manifest-entry[data-selected="true"],
      .control-pad-button[data-active="true"] {
        border-color: var(--line-strong);
        color: var(--accent);
        box-shadow: var(--glow-soft);
      }

      .terminal-header-controls button:hover,
      .terminal-screen-tabs button:hover,
      .terminal-rail-shell .manifest-entry:hover,
      .control-pad-button:hover:not([disabled]) {
        border-color: rgba(88, 231, 243, 0.4);
      }

      .terminal-rail-shell {
        padding: 14px;
        display: grid;
        gap: 12px;
        align-content: start;
      }

      .terminal-rail-title {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: var(--accent-2);
      }

      .terminal-rail-shell .panel {
        padding: 12px;
        border-radius: 16px;
        border-color: var(--line);
        background: rgba(8, 10, 16, 0.56);
      }

      .terminal-rail-shell .manifest-group-title {
        font-size: 10px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--muted);
      }

      .terminal-rail-shell .manifest-entry {
        width: 100%;
        text-align: left;
        display: block;
        padding: 9px 12px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.015);
      }

      .terminal-rail-shell .manifest-entry .surface-header {
        justify-content: flex-start;
      }

      .terminal-rail-shell .manifest-entry .surface-title {
        font-size: 13px;
        line-height: 1.35;
        color: var(--text);
      }

      .terminal-rail-shell .manifest-entry .surface-chip,
      .terminal-rail-shell .manifest-entry .manifest-entry-meta,
      .terminal-rail-shell .manifest-entry .surface-foot {
        display: none;
      }

      .terminal-main-shell {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
      }

      .terminal-main-topbar {
        display: grid;
        gap: 12px;
        padding: 14px 16px;
        border-bottom: 1px solid var(--line);
      }

      .terminal-main-title {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: var(--accent-2);
      }

      .terminal-screen-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .terminal-screen-tabs button {
        padding: 8px 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 11px;
      }

      .terminal-main-shell .panel {
        border: none;
        border-radius: 0;
        background: transparent;
        padding: 16px;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        min-height: 0;
      }

      .terminal-main-shell .label {
        color: var(--accent-2);
        text-transform: uppercase;
        letter-spacing: 0.14em;
      }

      #runsViewport {
        min-height: 0;
        height: 100%;
        border: 1px solid rgba(179, 140, 255, 0.18);
        border-radius: 18px;
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.01), transparent),
          #0b0f16;
        color: var(--text);
        padding: 18px;
        box-shadow: inset 0 0 0 1px rgba(179, 140, 255, 0.05);
      }

      #runsViewport .surface-title,
      #runsViewport .manifest-group-title {
        color: var(--accent-2);
      }

      #runsViewport .surface-chip {
        border-radius: 999px;
        border-color: rgba(88, 231, 243, 0.26);
        color: var(--accent);
      }

      #runsViewport .surface-detail,
      #runsViewport .surface-foot,
      #runsViewport .surface-list-item,
      #runsViewport pre,
      #runsViewport .screen-copy {
        color: var(--text);
      }

      #runsViewport .muted {
        color: var(--muted);
      }

      #runsViewport .warn {
        color: var(--warn);
      }

      #runsViewport .surface-list-item {
        background: rgba(255, 255, 255, 0.018);
        border-radius: 14px;
        border-color: rgba(179, 140, 255, 0.16);
      }

      .terminal-footer-shell {
        padding: 12px 16px;
        display: grid;
        gap: 12px;
      }

      .terminal-footer-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: var(--accent-2);
      }

      .control-pad-grid {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 10px;
      }

      .control-slot {
        display: grid;
        gap: 6px;
      }

      .control-pad-button {
        padding: 10px 12px;
        font-size: 14px;
        font-weight: 600;
      }

      .control-pad-button[disabled] {
        opacity: 0.45;
        cursor: not-allowed;
        box-shadow: none;
      }

      .control-legend {
        color: var(--muted);
        line-height: 1.4;
        min-height: 2.8em;
      }

      .terminal-dev-drawer {
        margin-top: 14px;
      }

      .terminal-dev-drawer > summary {
        cursor: pointer;
        list-style: none;
        user-select: none;
        padding: 14px 16px;
        color: var(--accent-2);
        text-transform: uppercase;
        letter-spacing: 0.14em;
      }

      .terminal-dev-drawer-content {
        padding: 0 16px 16px;
        display: grid;
        gap: 12px;
      }

      .terminal-hidden-sources,
      .source-panel-hidden {
        display: none !important;
      }

      @media (max-width: 1080px) {
        .terminal-shell-v2 {
          grid-template-columns: 1fr;
          grid-template-areas:
            "header"
            "rail"
            "main"
            "footer";
        }

        .terminal-header-shell {
          grid-template-columns: 1fr;
        }

        .terminal-header-bar {
          border-right: none;
          border-bottom: 1px solid var(--line);
        }

        .terminal-header-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .control-pad-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }
    `;
    document.head.appendChild(style);
  }

  function parseStatusStrip() {
    const text = document.getElementById("statusStrip")?.textContent || "";
    const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
    const state = {};
    lines.forEach((line) => {
      const idx = line.indexOf(":");
      if (idx === -1) return;
      const key = line.slice(0, idx).trim().toLowerCase();
      const value = line.slice(idx + 1).trim();
      state[key] = value;
    });
    return { text, lines, state };
  }

  function getHomeRawState() {
    if (screenSources.homeSurface?.rawState) return screenSources.homeSurface.rawState;
    const home = document.getElementById("homeSummary");
    try {
      return JSON.parse(home?.dataset?.rawSummary || "{}");
    } catch {
      return {};
    }
  }

  function renderHeaderBar() {
    const headerBar = document.getElementById("terminalHeaderBar");
    if (!headerBar) return;
    const activeScreen = getActiveScreen();
    const status = parseStatusStrip();
    const rawHome = getHomeRawState();

    const chips = [
      { label: "mode", value: rawHome.mode || status.state.mode || "home" },
      { label: "mount", value: rawHome.currentMount || status.state.mount || "none" },
      { label: "recent save", value: rawHome.recentSave || "none" },
      { label: "export", value: rawHome.exportSource || "disabled" },
    ];

    headerBar.innerHTML = `
      <div class="terminal-brand-row">
        <div class="terminal-brand">TARS TERMINAL</div>
        <div class="terminal-active-screen">${displayName(activeScreen)}</div>
      </div>
      <div class="terminal-header-grid">
        ${chips.map((chip) => `
          <div class="header-chip">
            <span class="chip-label">${chip.label}</span>
            <span class="chip-value">${chip.value}</span>
          </div>
        `).join("")}
      </div>
      <div class="terminal-status-line">${status.lines.slice(0, 3).join(" · ") || "Status signal unavailable."}</div>
    `;
  }

  function renderScreenTabs() {
    const tabs = document.getElementById("terminalScreenTabs");
    if (!tabs) return;
    const activeScreen = getActiveScreen();
    tabs.innerHTML = "";
    screenOrder.forEach((screen) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.active = String(activeScreen === screen);
      button.textContent = displayName(screen);
      button.addEventListener("click", () => setActiveScreen(screen));
      tabs.appendChild(button);
    });
  }

  function getListButtonsForScreen(screen) {
    const idMap = {
      "cartridge-bay": "cartridgeBayList",
      "collections": "collectionsBrowserList",
      "boards": "boardsBrowserList",
    };
    const container = document.getElementById(idMap[screen] || "");
    return container ? Array.from(container.querySelectorAll("button.manifest-entry")) : [];
  }

  function selectRelative(delta) {
    const activeScreen = getActiveScreen();
    const buttons = getListButtonsForScreen(activeScreen);
    if (!buttons.length) return false;

    let index = buttons.findIndex((button) => button.dataset.selected === "true");
    if (index === -1) index = 0;
    else index = (index + delta + buttons.length) % buttons.length;
    buttons[index]?.click();
    return true;
  }

  function primaryAction() {
    const activeScreen = getActiveScreen();
    switch (activeScreen) {
      case "home":
        setActiveScreen(screenUi.lastBaseScreen || "cartridge-bay");
        return;
      case "cartridge-bay":
        if (screenSources.cartridgeBaySurface?.selectedEntry || document.querySelector('#cartridgeBayList button[data-selected="true"]')) {
          setActiveScreen("collections");
        } else {
          selectRelative(1);
        }
        return;
      case "collections": {
        const button = document.getElementById("collectionsMountConfirm");
        if (button && !button.disabled) button.click();
        else selectRelative(1);
        return;
      }
      case "boards": {
        const button = document.getElementById("boardsMountConfirm");
        if (button && !button.disabled) button.click();
        else selectRelative(1);
        return;
      }
      default:
        return;
    }
  }

  function secondaryAction() {
    const activeScreen = getActiveScreen();
    if (activeScreen === "request-history" || activeScreen === "repo-verified") {
      setActiveScreen(screenUi.lastBaseScreen || "home");
      return;
    }
    if (activeScreen !== "home") {
      setActiveScreen("home");
    }
  }

  function cycleScreen(delta) {
    const activeScreen = getActiveScreen();
    const index = screenOrder.indexOf(activeScreen);
    const nextIndex = (index + delta + screenOrder.length) % screenOrder.length;
    setActiveScreen(screenOrder[nextIndex]);
  }

  function getControlMap() {
    const activeScreen = getActiveScreen();
    const listButtons = getListButtonsForScreen(activeScreen);
    const controlMap = {
      up: {
        enabled: listButtons.length > 0,
        label: listButtons.length > 0 ? "prev item" : "none",
        action: () => selectRelative(-1),
      },
      down: {
        enabled: listButtons.length > 0,
        label: listButtons.length > 0 ? "next item" : "none",
        action: () => selectRelative(1),
      },
      left: {
        enabled: true,
        label: "prev screen",
        action: () => cycleScreen(-1),
      },
      right: {
        enabled: true,
        label: "next screen",
        action: () => cycleScreen(1),
      },
      a: {
        enabled: !["request-history", "repo-verified"].includes(activeScreen),
        label:
          activeScreen === "home"
            ? "open"
            : activeScreen === "cartridge-bay"
              ? "handoff"
              : activeScreen === "collections"
                ? "mount"
                : activeScreen === "boards"
                  ? "mount"
                  : "none",
        action: primaryAction,
      },
      b: {
        enabled: activeScreen !== "home",
        label: activeScreen === "request-history" || activeScreen === "repo-verified" ? "back" : "home",
        action: secondaryAction,
      },
    };

    if (activeScreen === "collections" && document.getElementById("collectionsMountConfirm")?.disabled) {
      controlMap.a.label = listButtons.length ? "select" : "none";
      controlMap.a.enabled = listButtons.length > 0;
    }

    if (activeScreen === "boards" && document.getElementById("boardsMountConfirm")?.disabled) {
      controlMap.a.label = listButtons.length ? "select" : "none";
      controlMap.a.enabled = listButtons.length > 0;
    }

    if (activeScreen === "request-history" || activeScreen === "repo-verified") {
      controlMap.a.enabled = false;
      controlMap.a.label = "none";
      controlMap.up.enabled = false;
      controlMap.up.label = "none";
      controlMap.down.enabled = false;
      controlMap.down.label = "none";
    }

    return controlMap;
  }

  function renderFooter() {
    const footer = document.getElementById("terminalControlPad");
    if (!footer) return;
    const map = getControlMap();
    const order = [
      ["up", "↑"],
      ["down", "↓"],
      ["left", "←"],
      ["right", "→"],
      ["a", "A"],
      ["b", "B"],
    ];

    footer.innerHTML = "";
    order.forEach(([key, symbol]) => {
      const slot = document.createElement("div");
      slot.className = "control-slot";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "control-pad-button";
      button.dataset.active = String(map[key].enabled);
      button.disabled = !map[key].enabled;
      button.textContent = symbol;
      button.addEventListener("click", () => {
        if (!map[key].enabled) return;
        map[key].action();
      });
      const legend = document.createElement("div");
      legend.className = "control-legend";
      legend.textContent = map[key].label;
      slot.appendChild(button);
      slot.appendChild(legend);
      footer.appendChild(slot);
    });
  }

  function renderShellChrome() {
    renderHeaderBar();
    renderScreenTabs();
    renderFooter();
    ensureDevtoolsLaunchers();
  }

  function moveToHiddenStash(stash, node) {
    if (!node) return;
    node.classList.add("source-panel-hidden");
    stash.appendChild(node);
  }

  function buildShell() {
    if (screenUi.shellBuilt) {
      renderShellChrome();
      return;
    }

    injectStyles();

    const shell = document.querySelector(".shell");
    if (!shell) return;

    const statusSection = document.getElementById("statusStrip")?.closest("section");
    const navSection = document.getElementById("nav")?.closest("section");
    const actionsSection = document.getElementById("actions")?.closest("section");
    const homePanel = document.getElementById("homeSummary")?.closest(".panel");
    const runsPanel = document.getElementById("runsViewport")?.closest(".panel");
    const cartridgeListPanel = document.getElementById("cartridgeBayList")?.closest(".panel");
    const cartridgeSummaryPanel = document.getElementById("cartridgeBaySummary")?.closest(".panel");
    const collectionsListPanel = document.getElementById("collectionsBrowserList")?.closest(".panel");
    const collectionsSummaryPanel = document.getElementById("collectionsResolvedSummary")?.closest(".panel");
    const boardsListPanel = document.getElementById("boardsBrowserList")?.closest(".panel");
    const boardsSummaryPanel = document.getElementById("boardsResolvedSummary")?.closest(".panel");

    const shellV2 = document.createElement("div");
    shellV2.className = "terminal-shell-v2";

    const header = document.createElement("section");
    header.className = "terminal-header-shell";
    header.innerHTML = `
      <div class="terminal-header-bar" id="terminalHeaderBar"></div>
      <div class="terminal-header-controls">
        <div class="panel">
          <div class="label">navigation</div>
          <div class="row" id="terminalHeaderNav"></div>
        </div>
        <div class="panel">
          <div class="label">command deck</div>
          <div class="row" id="terminalHeaderActions"></div>
        </div>
      </div>
    `;

    const rail = document.createElement("aside");
    rail.className = "terminal-rail-shell";
    const railTitle = document.createElement("div");
    railTitle.className = "terminal-rail-title";
    railTitle.textContent = "selector rail";
    rail.appendChild(railTitle);

    const main = document.createElement("section");
    main.className = "terminal-main-shell";
    main.innerHTML = `
      <div class="terminal-main-topbar">
        <div class="terminal-main-title">main screen</div>
        <div class="terminal-screen-tabs" id="terminalScreenTabs"></div>
      </div>
    `;

    const footer = document.createElement("section");
    footer.className = "terminal-footer-shell";
    footer.innerHTML = `
      <div class="terminal-footer-label">control legend</div>
      <div class="control-pad-grid" id="terminalControlPad"></div>
    `;

    const hiddenStash = document.createElement("div");
    hiddenStash.className = "terminal-hidden-sources";
    hiddenStash.id = "terminalHiddenSources";

    const devDrawer = document.createElement("details");
    devDrawer.className = "terminal-dev-drawer";
    devDrawer.innerHTML = `<summary>Dev Surfaces</summary><div class="terminal-dev-drawer-content" id="terminalDevDrawerContent"></div>`;

    const mainPanel = runsPanel || document.createElement("div");
    mainPanel.classList.add("panel");
    const runsLabel = mainPanel.querySelector(".label");
    if (runsLabel) runsLabel.textContent = "MAIN SCREEN";
    main.appendChild(mainPanel);

    if (navSection) {
      const navHost = header.querySelector("#terminalHeaderNav");
      const navNode = document.getElementById("nav");
      if (navNode) navHost.appendChild(navNode);
    }

    if (actionsSection) {
      const actionsHost = header.querySelector("#terminalHeaderActions");
      const actionsNode = document.getElementById("actions");
      if (actionsNode) actionsHost.appendChild(actionsNode);

      Array.from(actionsSection.children).forEach((child) => {
        if (child !== actionsNode) hiddenStash.appendChild(child);
      });
    }

    [cartridgeListPanel, collectionsListPanel, boardsListPanel].forEach((panel) => {
      if (panel) rail.appendChild(panel);
    });

    [
      statusSection,
      homePanel,
      cartridgeSummaryPanel,
      collectionsSummaryPanel,
      boardsSummaryPanel,
      navSection,
      actionsSection,
    ].forEach((node) => moveToHiddenStash(hiddenStash, node));

    const preservedNodes = Array.from(shell.children).filter((child) => {
      if ([
        statusSection,
        navSection,
        actionsSection,
        homePanel,
        runsPanel,
        cartridgeListPanel,
        cartridgeSummaryPanel,
        collectionsListPanel,
        collectionsSummaryPanel,
        boardsListPanel,
        boardsSummaryPanel,
      ].includes(child)) {
        return false;
      }
      return child.childElementCount > 0;
    });

    const devContent = devDrawer.querySelector("#terminalDevDrawerContent");
    preservedNodes.forEach((node) => devContent.appendChild(node));

    shell.innerHTML = "";
    shell.appendChild(shellV2);
    shell.appendChild(devDrawer);
    shell.appendChild(hiddenStash);

    shellV2.appendChild(header);
    shellV2.appendChild(rail);
    shellV2.appendChild(main);
    shellV2.appendChild(footer);

    ["cartridgeBayList", "collectionsBrowserList", "boardsBrowserList"].forEach((id) => {
      const container = document.getElementById(id);
      if (!container) return;
      container.addEventListener("click", (event) => {
        if (!event.target.closest("button")) return;
        const screen = id === "cartridgeBayList" ? "cartridge-bay" : id === "collectionsBrowserList" ? "collections" : "boards";
        setActiveScreen(screen, { syncDevtools: true });
      });
    });

    window.addEventListener("tars:screen-request", handleScreenRequest);

    const statusTarget = document.getElementById("statusStrip");
    if (statusTarget) {
      const observer = new MutationObserver(() => renderHeaderBar());
      observer.observe(statusTarget, { childList: true, subtree: true, characterData: true });
    }

    const homeTarget = document.getElementById("homeSummary");
    if (homeTarget) {
      const observer = new MutationObserver(() => {
        renderHeaderBar();
        renderFooter();
      });
      observer.observe(homeTarget, { childList: true, subtree: true, characterData: true });
    }

    screenUi.shellBuilt = true;
    renderShellChrome();
  }

  shared.fetchBridgeInstalled = true;
  const originalFetch = window.fetch.bind(window);
  shared.originalFetch = originalFetch;

  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const path = normalizeInput(args[0]);

    if (path.endsWith("manifests/manifest-index.v1.json")) {
      return wrapJsonResponse(response, (data) => {
        shared.manifestIndex = data;
        return data;
      });
    }

    return response;
  };

  window.addEventListener("DOMContentLoaded", () => {
    ensureDevtoolsLaunchers();
    buildShell();
    renderShellChrome();
    window.setInterval(renderShellChrome, 1500);
  }, { once: true });

  [
    "tars:home-updated",
    "tars:cartridge-bay-updated",
    "tars:collections-updated",
    "tars:boards-updated",
    "tars:request-history-updated",
    "tars:repo-verified-updated",
    "tars:screen-changed",
    "tars:devtools-changed",
  ].forEach((eventName) => window.addEventListener(eventName, renderShellChrome));
})();
