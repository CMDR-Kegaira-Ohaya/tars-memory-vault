(() => {
  const collectionsKey = "__TARS_COLLECTIONS__";
  const shared = window[collectionsKey] || (window[collectionsKey] = {});
  const devtoolsKey = "__TARS_DEVTOOLS__";
  const devtools = window[devtoolsKey] || (window[devtoolsKey] = {
    mountedCartridge: null,
    requestHistorySurface: null,
    repoVerifiedSurface: null,
  });
  const screenUiKey = "__TARS_SCREEN_UI__";
  const screenUi = window[screenUiKey] || (window[screenUiKey] = {
    activeScreen: "home",
    lastBaseScreen: "cartridge-bay",
    shellBuilt: false,
  });

  if (shared.fetchBridgeInstalled) return;

  const baseScreenOrder = ["home", "cartridge-bay", "collections", "boards"];
  const devScreens = new Set(["request-history", "repo-verified"]);

  function displayName(screen) {
    switch (screen) {
      case "home": return "Home";
      case "cartridge-bay": return "Cartridges";
      case "collections": return "Collections";
      case "boards": return "Boards";
      case "request-history": return "Request History";
      case "repo-verified": return "Repo Verified";
      default: return "Screen";
    }
  }

  function isBaseScreen(screen) {
    return baseScreenOrder.includes(screen);
  }

  function emit(name, detail) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  function getActiveScreen() {
    if (devScreens.has(devtools.mountedCartridge)) return devtools.mountedCartridge;
    return screenUi.activeScreen || "home";
  }

  function railSourceScreen() {
    const active = getActiveScreen();
    if (isBaseScreen(active) && active !== "home") return active;
    if (isBaseScreen(screenUi.lastBaseScreen) && screenUi.lastBaseScreen !== "home") return screenUi.lastBaseScreen;
    return "cartridge-bay";
  }

  function setActiveScreen(screen, { syncDevtools = true } = {}) {
    const nextScreen = screen || "home";
    const previousMounted = devtools.mountedCartridge;
    const previousActive = getActiveScreen();

    if (syncDevtools) {
      devtools.mountedCartridge = devScreens.has(nextScreen) ? nextScreen : null;
    }

    screenUi.activeScreen = nextScreen;
    if (isBaseScreen(nextScreen) && nextScreen !== "home") {
      screenUi.lastBaseScreen = nextScreen;
    }

    if (previousMounted !== devtools.mountedCartridge) {
      emit("tars:devtools-changed", { mountedCartridge: devtools.mountedCartridge });
    }
    if (previousActive !== getActiveScreen()) {
      emit("tars:screen-changed", {
        activeScreen: screenUi.activeScreen,
        lastBaseScreen: screenUi.lastBaseScreen,
      });
    }

    renderShellChrome();
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

  function parseStatusStrip() {
    const text = document.getElementById("statusStrip")?.textContent || "";
    const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
    const state = {};
    for (const line of lines) {
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      state[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim();
    }
    return { text, lines, state };
  }

  function parseHomeRawState() {
    const home = document.getElementById("homeSummary");
    try {
      return JSON.parse(home?.dataset?.rawSummary || "{}");
    } catch {
      return {};
    }
  }

  function screenToListId(screen) {
    switch (screen) {
      case "cartridge-bay": return "cartridgeBayList";
      case "collections": return "collectionsBrowserList";
      case "boards": return "boardsBrowserList";
      default: return "";
    }
  }

  function selectedLabelFor(screen) {
    const listId = screenToListId(screen);
    if (!listId) return "none";
    const selected = document.querySelector(`#${listId} button[data-selected="true"] .surface-title`);
    return selected?.textContent?.trim() || "none";
  }

  function currentSelectionLabel() {
    const active = getActiveScreen();
    if (devScreens.has(active)) return displayName(active);
    if (isBaseScreen(active) && active !== "home") return selectedLabelFor(active);
    return selectedLabelFor(railSourceScreen());
  }

  function getListButtonsForScreen(screen) {
    const container = document.getElementById(screenToListId(screen));
    return container ? Array.from(container.querySelectorAll("button.manifest-entry")) : [];
  }

  function selectRelative(delta) {
    const buttons = getListButtonsForScreen(railSourceScreen());
    if (!buttons.length) return false;
    let index = buttons.findIndex((button) => button.dataset.selected === "true");
    index = index === -1 ? 0 : (index + delta + buttons.length) % buttons.length;
    buttons[index]?.click();
    return true;
  }

  function cycleBaseScreen(delta) {
    const active = getActiveScreen();
    const current = isBaseScreen(active) ? active : (screenUi.lastBaseScreen || "cartridge-bay");
    const index = baseScreenOrder.indexOf(current);
    const nextIndex = (index + delta + baseScreenOrder.length) % baseScreenOrder.length;
    setActiveScreen(baseScreenOrder[nextIndex]);
  }

  function getCartridgeBayApi() {
    return window.__TARS_CARTRIDGE_BAY__?.runtimeApi || null;
  }

  function primaryAction() {
    const active = getActiveScreen();

    if (active === "home") {
      setActiveScreen(screenUi.lastBaseScreen || "cartridge-bay");
      return;
    }

    if (active === "cartridge-bay") {
      const cartridgeApi = getCartridgeBayApi();
      const selectedEntry = cartridgeApi?.getSelectedEntry?.();
      if (selectedEntry && cartridgeApi?.isDevEntry?.(selectedEntry)) {
        cartridgeApi.openSelectedDevCartridge?.();
        return;
      }
      if (document.querySelector('#cartridgeBayList button[data-selected="true"]')) {
        setActiveScreen("collections");
      } else {
        selectRelative(1);
      }
      return;
    }

    if (active === "collections") {
      const button = document.getElementById("collectionsMountConfirm");
      if (button && !button.disabled) button.click();
      else selectRelative(1);
      return;
    }

    if (active === "boards") {
      const button = document.getElementById("boardsMountConfirm");
      if (button && !button.disabled) button.click();
      else selectRelative(1);
    }
  }

  function secondaryAction() {
    const active = getActiveScreen();
    if (devScreens.has(active)) {
      setActiveScreen(screenUi.lastBaseScreen || "home");
      return;
    }
    if (active !== "home") setActiveScreen("home");
  }

  function getControlMap() {
    const active = getActiveScreen();
    const railScreen = railSourceScreen();
    const railButtons = getListButtonsForScreen(railScreen);
    const mountCollectionsDisabled = document.getElementById("collectionsMountConfirm")?.disabled ?? true;
    const mountBoardsDisabled = document.getElementById("boardsMountConfirm")?.disabled ?? true;
    const cartridgeApi = getCartridgeBayApi();
    const selectedEntry = cartridgeApi?.getSelectedEntry?.();
    const devSelection = active === "cartridge-bay" && selectedEntry && cartridgeApi?.isDevEntry?.(selectedEntry);

    const map = {
      up: {
        enabled: railButtons.length > 0,
        label: railButtons.length > 0 ? `prev ${displayName(railScreen).toLowerCase().slice(0, -1) || "item"}` : "none",
        action: () => selectRelative(-1),
      },
      down: {
        enabled: railButtons.length > 0,
        label: railButtons.length > 0 ? `next ${displayName(railScreen).toLowerCase().slice(0, -1) || "item"}` : "none",
        action: () => selectRelative(1),
      },
      left: {
        enabled: true,
        label: "prev tab",
        action: () => cycleBaseScreen(-1),
      },
      right: {
        enabled: true,
        label: "next tab",
        action: () => cycleBaseScreen(1),
      },
      a: {
        enabled: !devScreens.has(active),
        label:
          active === "home" ? "open" :
          active === "cartridge-bay" ? (devSelection ? "open" : "handoff") :
          active === "collections" ? (mountCollectionsDisabled ? "select" : "mount") :
          active === "boards" ? (mountBoardsDisabled ? "select" : "mount") :
          "none",
        action: primaryAction,
      },
      b: {
        enabled: active !== "home",
        label: devScreens.has(active) ? "back" : "home",
        action: secondaryAction,
      },
    };

    if (devScreens.has(active)) {
      map.up.enabled = false;
      map.up.label = "none";
      map.down.enabled = false;
      map.down.label = "none";
      map.a.enabled = false;
      map.a.label = "none";
    }

    return map;
  }

  function injectStyles() {
    if (document.getElementById("terminal-shell-v4-style")) return;
    const style = document.createElement("style");
    style.id = "terminal-shell-v4-style";
    style.textContent = `
      :root {
        --bg: #090b12;
        --panel: #10131c;
        --screen: #0b0f16;
        --line: rgba(179, 140, 255, 0.22);
        --line-strong: rgba(88, 231, 243, 0.28);
        --text: #c8ced7;
        --text-soft: #a8afbc;
        --muted: #8f96ab;
        --accent: #58e7f3;
        --accent-2: #b38cff;
        --warn: #ffbe86;
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

      .terminal-shell-v4 {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: auto auto auto auto;
        gap: 14px;
        min-height: calc(100vh - 32px);
      }

      .terminal-header-shell,
      .terminal-main-shell,
      .terminal-rail-shell,
      .terminal-footer-shell {
        border: 1px solid var(--line);
        border-radius: 18px;
        background: linear-gradient(180deg, rgba(13, 16, 24, 0.96), rgba(9, 11, 18, 0.98));
        overflow: hidden;
      }

      .terminal-header-shell {
        display: grid;
        grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.95fr);
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

      .terminal-path-line {
        color: var(--muted);
        letter-spacing: 0.04em;
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

      .chip-label {
        display: block;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--accent-2);
        margin-bottom: 6px;
      }

      .chip-value {
        color: var(--text-soft);
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

      .terminal-header-controls .label,
      .terminal-main-title,
      .terminal-rail-title,
      .terminal-footer-label {
        color: var(--accent-2);
        text-transform: uppercase;
        letter-spacing: 0.16em;
        font-size: 11px;
      }

      .terminal-header-controls #nav,
      .terminal-header-controls #actions,
      .terminal-screen-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .terminal-header-controls button,
      .terminal-screen-tabs button,
      .control-pad-button,
      .terminal-rail-shell .manifest-entry {
        border-radius: 999px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.02);
        color: var(--text);
        transition: border-color 120ms ease, color 120ms ease, box-shadow 120ms ease, background 120ms ease;
      }

      .terminal-header-controls button[data-action-state="active"],
      .terminal-screen-tabs button[data-active="true"],
      .control-pad-button[data-active="true"] {
        border-color: var(--line-strong);
        color: var(--accent);
        box-shadow: var(--glow-soft);
      }

      .terminal-main-shell {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        min-height: clamp(560px, 68vh, 860px);
        max-height: clamp(560px, 68vh, 860px);
      }

      .terminal-main-topbar {
        display: grid;
        gap: 12px;
        padding: 14px 16px;
        border-bottom: 1px solid var(--line);
      }

      .terminal-main-shell .panel {
        border: none;
        background: transparent;
        padding: 16px;
        min-height: 0;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
      }

      .terminal-main-shell .label {
        color: var(--accent-2);
        text-transform: uppercase;
        letter-spacing: 0.14em;
      }

      #runsViewport {
        height: 100%;
        min-height: 0;
        overflow: auto;
        border: 1px solid rgba(179, 140, 255, 0.18);
        border-radius: 18px;
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.01), transparent),
          var(--screen);
        color: var(--text);
        padding: 18px;
        box-shadow: inset 0 0 0 1px rgba(179, 140, 255, 0.05);
      }

      #runsViewport .surface-title,
      #runsViewport .manifest-group-title { color: var(--accent-2); }
      #runsViewport .surface-chip {
        border-radius: 999px;
        border-color: rgba(88, 231, 243, 0.26);
        color: var(--accent);
      }
      #runsViewport .surface-detail,
      #runsViewport .surface-foot,
      #runsViewport .surface-list-item,
      #runsViewport pre,
      #runsViewport .screen-copy { color: var(--text); }
      #runsViewport .muted { color: var(--muted); }
      #runsViewport .warn { color: var(--warn); }
      #runsViewport .surface-list-item {
        background: rgba(255, 255, 255, 0.018);
        border-radius: 14px;
        border-color: rgba(179, 140, 255, 0.16);
      }

      .terminal-rail-shell {
        padding: 14px 16px 16px;
        display: grid;
        gap: 12px;
      }

      .terminal-rail-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .terminal-rail-context { color: var(--muted); }
      .terminal-rail-host { min-height: 0; }

      .terminal-rail-shell .panel {
        margin: 0;
        padding: 12px;
        border-radius: 16px;
        border-color: var(--line);
        background: rgba(8, 10, 16, 0.56);
      }

      .terminal-rail-shell .label {
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }

      .terminal-rail-shell .surface-list,
      .terminal-rail-shell .manifest-group {
        display: grid;
        gap: 10px;
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
        padding: 10px 14px;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.02);
        display: block;
      }

      .terminal-rail-shell .manifest-entry[data-selected="true"] {
        border-color: var(--line-strong);
        color: var(--accent);
        box-shadow: var(--glow-soft);
      }

      .terminal-rail-shell .manifest-entry .surface-header {
        justify-content: flex-start;
        gap: 0;
      }

      .terminal-rail-shell .manifest-entry .surface-title {
        font-size: 13px;
        line-height: 1.35;
        color: var(--text-soft);
      }

      .terminal-rail-shell .manifest-entry[data-selected="true"] .surface-title { color: var(--accent); }
      .terminal-rail-shell .manifest-entry .surface-chip,
      .terminal-rail-shell .manifest-entry .manifest-entry-meta,
      .terminal-rail-shell .manifest-entry .surface-foot { display: none; }

      .terminal-footer-shell {
        padding: 12px 16px;
        display: grid;
        gap: 12px;
      }

      .control-pad-grid {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 10px;
      }

      .control-slot { display: grid; gap: 6px; }
      .control-pad-button { padding: 10px 12px; font-size: 14px; font-weight: 600; }
      .control-pad-button[disabled] { opacity: 0.45; cursor: not-allowed; box-shadow: none; }
      .control-legend { color: var(--muted); line-height: 1.4; min-height: 2.8em; }

      .terminal-hidden-sources,
      .source-panel-hidden {
        display: none !important;
      }

      @media (max-width: 1080px) {
        .terminal-header-shell { grid-template-columns: 1fr; }
        .terminal-header-bar { border-right: none; border-bottom: 1px solid var(--line); }
        .terminal-header-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .control-pad-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .terminal-main-shell {
          min-height: clamp(480px, 62vh, 720px);
          max-height: clamp(480px, 62vh, 720px);
        }
      }
    `;
    document.head.appendChild(style);
  }

  function renderHeaderBar() {
    const headerBar = document.getElementById("terminalHeaderBar");
    if (!headerBar) return;

    const activeScreen = getActiveScreen();
    const status = parseStatusStrip();
    const home = parseHomeRawState();
    const chips = [
      { label: "mode", value: home.mode || status.state.mode || "home" },
      { label: "mount", value: home.currentMount || status.state.mount || "none" },
      { label: "selection", value: currentSelectionLabel() },
      { label: "export", value: home.exportSource || "disabled" },
    ];

    const renderState = JSON.stringify({
      activeScreen,
      chips,
      path: `Home / ${displayName(railSourceScreen())} / ${currentSelectionLabel()}`,
      statusLine: status.lines.slice(0, 3),
    });
    if (headerBar.dataset.renderState === renderState) return;
    headerBar.dataset.renderState = renderState;

    headerBar.innerHTML = `
      <div class="terminal-brand-row">
        <div class="terminal-brand">TARS TERMINAL</div>
        <div class="terminal-active-screen">${displayName(activeScreen)}</div>
      </div>
      <div class="terminal-path-line">Home / ${displayName(railSourceScreen())} / ${currentSelectionLabel()}</div>
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
    const renderState = JSON.stringify({ activeScreen, order: baseScreenOrder });
    if (tabs.dataset.renderState === renderState) return;
    tabs.dataset.renderState = renderState;
    tabs.innerHTML = "";

    for (const screen of baseScreenOrder) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.active = String(activeScreen === screen);
      button.textContent = displayName(screen);
      button.addEventListener("click", () => setActiveScreen(screen));
      tabs.appendChild(button);
    }
  }

  function renderRail() {
    const host = document.getElementById("terminalRailHost");
    const title = document.getElementById("terminalRailTitle");
    const context = document.getElementById("terminalRailContext");
    if (!host || !title || !context) return;

    const sourceScreen = railSourceScreen();
    const sourcePanel = {
      "cartridge-bay": document.getElementById("cartridgeBayList")?.closest(".panel"),
      "collections": document.getElementById("collectionsBrowserList")?.closest(".panel"),
      "boards": document.getElementById("boardsBrowserList")?.closest(".panel"),
    }[sourceScreen] || null;

    title.textContent = `${displayName(sourceScreen)} Rail`;
    context.textContent = `${displayName(sourceScreen)} selectors`;

    if (host.dataset.sourceScreen === sourceScreen && sourcePanel?.parentElement === host) return;

    host.innerHTML = "";
    if (sourcePanel) {
      sourcePanel.classList.remove("source-panel-hidden");
      host.appendChild(sourcePanel);
    }
    host.dataset.sourceScreen = sourceScreen;
  }

  function renderFooter() {
    const footer = document.getElementById("terminalControlPad");
    if (!footer) return;
    const map = getControlMap();
    const order = [["up", "↑"], ["down", "↓"], ["left", "←"], ["right", "→"], ["a", "A"], ["b", "B"]];
    const renderState = JSON.stringify(order.map(([key]) => ({ key, enabled: map[key].enabled, label: map[key].label })));
    if (footer.dataset.renderState === renderState) return;
    footer.dataset.renderState = renderState;

    footer.innerHTML = "";
    for (const [key, symbol] of order) {
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
    }
  }

  function renderShellChrome() {
    renderHeaderBar();
    renderScreenTabs();
    renderRail();
    renderFooter();
  }

  function moveToStash(stash, node) {
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

    const shellV4 = document.createElement("div");
    shellV4.className = "terminal-shell-v4";

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

    const main = document.createElement("section");
    main.className = "terminal-main-shell";
    main.innerHTML = `
      <div class="terminal-main-topbar">
        <div class="terminal-main-title">main screen</div>
        <div class="terminal-screen-tabs" id="terminalScreenTabs"></div>
      </div>
    `;

    const rail = document.createElement("section");
    rail.className = "terminal-rail-shell";
    rail.innerHTML = `
      <div class="terminal-rail-head">
        <div class="terminal-rail-title" id="terminalRailTitle">selector rail</div>
        <div class="terminal-rail-context" id="terminalRailContext"></div>
      </div>
      <div class="terminal-rail-host" id="terminalRailHost"></div>
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

    const mainPanel = runsPanel || document.createElement("div");
    mainPanel.classList.add("panel");
    const runsLabel = mainPanel.querySelector(".label");
    if (runsLabel) runsLabel.textContent = "MAIN SCREEN";
    main.appendChild(mainPanel);

    const navHost = header.querySelector("#terminalHeaderNav");
    const navNode = document.getElementById("nav");
    if (navHost && navNode) navHost.appendChild(navNode);

    const actionsHost = header.querySelector("#terminalHeaderActions");
    const actionsNode = document.getElementById("actions");
    if (actionsHost && actionsNode) actionsHost.appendChild(actionsNode);

    [cartridgeListPanel, collectionsListPanel, boardsListPanel].forEach((panel) => {
      if (panel) hiddenStash.appendChild(panel);
    });

    [
      statusSection,
      homePanel,
      cartridgeSummaryPanel,
      collectionsSummaryPanel,
      boardsSummaryPanel,
      navSection,
      actionsSection,
    ].forEach((node) => moveToStash(hiddenStash, node));

    shell.innerHTML = "";
    shell.appendChild(shellV4);
    shell.appendChild(hiddenStash);

    shellV4.appendChild(header);
    shellV4.appendChild(main);
    shellV4.appendChild(rail);
    shellV4.appendChild(footer);

    ["cartridgeBayList", "collectionsBrowserList", "boardsBrowserList"].forEach((id) => {
      const container = document.getElementById(id);
      if (!container) return;
      container.addEventListener("click", (event) => {
        if (!event.target.closest("button")) return;
        const screen = id === "cartridgeBayList" ? "cartridge-bay" : id === "collectionsBrowserList" ? "collections" : "boards";
        setActiveScreen(screen);
      });
    });

    screenUi.shellBuilt = true;
    shared.runtimeApi = {
      getActiveScreen,
      setActiveScreen,
      renderShellChrome,
    };

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
    buildShell();
    renderShellChrome();
  }, { once: true });

  window.addEventListener("tars:screen-request", (event) => {
    const requested = event?.detail?.screen;
    if (requested) setActiveScreen(requested);
  });

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