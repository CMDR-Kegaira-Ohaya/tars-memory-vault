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
    mainNav: "home",
    activeDevSurface: "request-history",
    shellBuilt: false,
  });

  const MAIN_NAV = [
    { key: "home", label: "Home", surface: "home" },
    { key: "cartridges", label: "Cartridges", surface: "cartridge-bay" },
    { key: "collections", label: "Collections", surface: "collections" },
    { key: "boards", label: "Boards", surface: "boards" },
    { key: "dev", label: "Dev", surface: "dev" },
  ];

  const DEV_SURFACES = [
    {
      key: "request-history",
      label: "Request History",
      surface: "request-history",
      mode: "runs",
      summary: "Inspect the mounted save/apply chain.",
    },
    {
      key: "repo-verified",
      label: "Repo Verified",
      surface: "repo-verified",
      mode: "runs",
      summary: "Inspect authenticated repo verification.",
    },
    {
      key: "import-bay",
      label: "Import Bay",
      surface: "import-bay",
      mode: "panels",
      summary: "Stage, package, and inspect import-side state.",
      panelLabels: ["NOTE EDITOR", "NOTE LIST", "SAVE WRITE BRIDGE", "DELTA SUMMARY"],
    },
    {
      key: "collections-explorer",
      label: "Collections Explorer",
      surface: "collections-explorer",
      mode: "panels",
      summary: "Operator-facing catalogue and selection controls.",
      panelLabels: ["COLLECTIONS BROWSER", "COLLECTIONS SELECTION PREVIEW"],
    },
    {
      key: "debug-intake",
      label: "Debug Intake",
      surface: "debug-intake",
      mode: "panels",
      summary: "Low-level runtime inspection surfaces.",
      panelPatterns: [/INTAKE/i, /SAVE SLOTS/i, /HOME SUMMARY/i],
    },
  ];

  const DEV_SURFACE_BY_KEY = Object.fromEntries(DEV_SURFACES.map((surface) => [surface.key, surface]));
  const NAV_BY_KEY = Object.fromEntries(MAIN_NAV.map((item) => [item.key, item]));
  const SURFACE_TO_NAV = Object.fromEntries(
    MAIN_NAV.filter((item) => item.key !== "dev").map((item) => [item.surface, item.key]),
  );
  const SURFACE_TO_DEV = Object.fromEntries(DEV_SURFACES.map((item) => [item.surface, item.key]));

  if (SURFACE_TO_DEV[screenUi.activeScreen]) {
    screenUi.mainNav = "dev";
    screenUi.activeDevSurface = SURFACE_TO_DEV[screenUi.activeScreen];
  } else if (SURFACE_TO_NAV[screenUi.activeScreen]) {
    screenUi.mainNav = SURFACE_TO_NAV[screenUi.activeScreen];
  }

  let renderScheduled = false;

  function scheduleRender() {
    if (renderScheduled || !screenUi.shellBuilt) return;
    renderScheduled = true;
    queueMicrotask(() => {
      renderScheduled = false;
      renderShellChrome();
    });
  }

  function emit(name, detail) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  function getMainNavKey() {
    if (screenUi.mainNav === "dev") return "dev";
    return SURFACE_TO_NAV[screenUi.activeScreen] || "home";
  }

  function getActiveSurface() {
    if (getMainNavKey() === "dev") {
      return DEV_SURFACE_BY_KEY[screenUi.activeDevSurface]?.surface || "request-history";
    }
    return screenUi.activeScreen || "home";
  }

  function displayNameForSurface(surface) {
    if (surface === "cartridge-bay") return "Cartridges";
    if (surface === "request-history") return "Request History";
    if (surface === "repo-verified") return "Repo Verified";
    if (surface === "import-bay") return "Import Bay";
    if (surface === "collections-explorer") return "Collections Explorer";
    if (surface === "debug-intake") return "Debug Intake";
    if (surface === "collections") return "Collections";
    if (surface === "boards") return "Boards";
    return "Home";
  }

  function setInternalSurface(surface) {
    const previousSurface = screenUi.activeScreen;
    const previousMounted = devtools.mountedCartridge;

    screenUi.activeScreen = surface;
    devtools.mountedCartridge =
      surface === "request-history" || surface === "repo-verified" ? surface : null;

    if (previousMounted !== devtools.mountedCartridge) {
      emit("tars:devtools-changed", { mountedCartridge: devtools.mountedCartridge });
    }
    if (previousSurface !== screenUi.activeScreen) {
      emit("tars:screen-changed", {
        activeScreen: screenUi.activeScreen,
        mainNav: getMainNavKey(),
      });
    }
  }

  function setMainNav(key) {
    const next = NAV_BY_KEY[key];
    if (!next) return;
    screenUi.mainNav = key;
    if (key === "dev") {
      setDevSurface(screenUi.activeDevSurface || "request-history");
      return;
    }
    setInternalSurface(next.surface);
    renderShellChrome();
  }

  function setDevSurface(key) {
    const next = DEV_SURFACE_BY_KEY[key] || DEV_SURFACE_BY_KEY["request-history"];
    screenUi.mainNav = "dev";
    screenUi.activeDevSurface = next.key;
    setInternalSurface(next.surface);
    renderShellChrome();
  }

  function resolveScreenRequest(requestedSurface) {
    if (SURFACE_TO_DEV[requestedSurface]) {
      setDevSurface(SURFACE_TO_DEV[requestedSurface]);
      return;
    }
    const navKey = SURFACE_TO_NAV[requestedSurface] || "home";
    setMainNav(navKey);
  }

  function normalizeLabel(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
  }

  function currentSelectionLabel() {
    const activeSurface = getActiveSurface();
    const collectionButton =
      document.querySelector("#collectionsBrowserList button[data-selected='true'] .surface-title") ||
      document.querySelector("#cartridgeBayList button[data-selected='true'] .surface-title") ||
      document.querySelector("#boardsBrowserList button[data-selected='true'] .surface-title");
    if (getMainNavKey() === "dev") {
      return DEV_SURFACE_BY_KEY[screenUi.activeDevSurface]?.label || "Dev Surface";
    }
    return normalizeLabel(collectionButton?.textContent) || displayNameForSurface(activeSurface);
  }

  function panelById(id) {
    return document.getElementById(id)?.closest(".panel") || null;
  }

  function allPanels() {
    return Array.from(document.querySelectorAll(".shell .panel"));
  }

  function panelLabel(panel) {
    return normalizeLabel(panel?.querySelector(".label")?.textContent || "");
  }

  function moveNode(stash, node) {
    if (!stash || !node) return;
    if (node.parentElement !== stash) {
      stash.appendChild(node);
    }
    node.classList.add("terminal-stashed-panel");
  }

  function mountNode(host, node) {
    if (!host || !node) return;
    if (node.parentElement !== host) {
      host.appendChild(node);
    }
    node.classList.remove("terminal-stashed-panel");
  }

  function panelsBySpec(spec) {
    const labelSet = new Set(spec.panelLabels || []);
    const patterns = spec.panelPatterns || [];
    return allPanels().filter((panel) => {
      const label = panelLabel(panel);
      if (!label) return false;
      if (labelSet.has(label)) return true;
      return patterns.some((pattern) => pattern.test(label));
    });
  }

  function buildSystemsPills() {
    const actions = Array.from(document.querySelectorAll("#actions button"));
    const topPills = actions.map((button) => {
      const text = normalizeLabel(button.textContent);
      const status = normalizeLabel(button.dataset.actionState || button.dataset.rawActionState || "available");
      return { label: text || "Action", status };
    });

    const healthPills = [
      {
        label: "Request History",
        status: normalizeLabel(devtools.requestHistorySurface?.surface?.status || "available"),
      },
      {
        label: "Repo Verified",
        status: normalizeLabel(devtools.repoVerifiedSurface?.repoVerifiedStatus?.status || "available"),
      },
      { label: "Debug Intake", status: "available" },
      { label: "Import Bay", status: "available" },
      { label: "Collections Explorer", status: "available" },
    ];

    return [...topPills, ...healthPills];
  }

  function renderSystemsStrip() {
    const host = document.getElementById("terminalSystemsStrip");
    if (!host) return;
    const statusLines = normalizeLabel(document.getElementById("statusStrip")?.textContent || "booting");
    const pills = buildSystemsPills();
    host.innerHTML = `
      <div class="terminal-brand-row">
        <div class="terminal-brand">TARS TERMINAL</div>
        <div class="terminal-active-screen">${displayNameForSurface(getActiveSurface())}</div>
      </div>
      <div class="terminal-path-line">Home / ${displayNameForSurface(getActiveSurface())} / ${currentSelectionLabel()}</div>
      <div class="terminal-systems-grid">
        ${pills
          .map(
            (pill) => `
          <div class="terminal-pill" data-state="${pill.status.toLowerCase()}">
            <span class="terminal-pill-label">${pill.label}</span>
            <span class="terminal-pill-value">${pill.status}</span>
          </div>
        `,
          )
          .join("")}
      </div>
      <div class="terminal-status-line">${statusLines || "Status signal unavailable."}</div>
    `;
  }

  function renderMainNav() {
    const host = document.getElementById("terminalMainNav");
    if (!host) return;
    const activeNav = getMainNavKey();
    host.innerHTML = "";
    MAIN_NAV.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "terminal-main-nav-button";
      button.dataset.active = String(activeNav === item.key);
      button.textContent = item.label;
      button.addEventListener("click", () => setMainNav(item.key));
      host.appendChild(button);
    });
  }

  function renderDevSelector(host) {
    const selected = DEV_SURFACE_BY_KEY[screenUi.activeDevSurface] || DEV_SURFACE_BY_KEY["request-history"];
    host.innerHTML = `
      <div class="terminal-dev-selector-list">
        ${DEV_SURFACES.map(
          (surface) => `
            <button
              type="button"
              class="terminal-dev-surface-button"
              data-active="${String(surface.key === selected.key)}"
              data-dev-surface="${surface.key}"
            >
              <span class="surface-title">${surface.label}</span>
              <span class="muted">${surface.summary}</span>
            </button>
          `,
        ).join("")}
      </div>
    `;
    host.querySelectorAll("[data-dev-surface]").forEach((button) => {
      button.addEventListener("click", () => setDevSurface(button.dataset.devSurface));
    });
  }

  function renderRail() {
    const shell = document.querySelector(".terminal-rail-shell");
    const title = document.getElementById("terminalRailTitle");
    const host = document.getElementById("terminalRailHost");
    if (!shell || !title || !host) return;

    const mainNav = getMainNavKey();
    host.innerHTML = "";

    if (mainNav === "dev") {
      title.textContent = "Dev Surfaces";
      renderDevSelector(host);
      shell.hidden = false;
      return;
    }

    const sourcePanel = {
      cartridges: panelById("cartridgeBayList"),
      collections: panelById("collectionsBrowserList"),
      boards: panelById("boardsBrowserList"),
    }[mainNav] || null;

    if (!sourcePanel) {
      shell.hidden = true;
      return;
    }

    title.textContent = `${NAV_BY_KEY[mainNav]?.label || "Selector"} Rail`;
    mountNode(host, sourcePanel);
    shell.hidden = false;
  }

  function curatedDevPanels() {
    const key = screenUi.activeDevSurface;
    const spec = DEV_SURFACE_BY_KEY[key];
    if (!spec || spec.mode !== "panels") return [];
    return panelsBySpec(spec);
  }

  function renderFallbackMessage(host, title, detail) {
    const panel = document.createElement("div");
    panel.className = "panel terminal-inline-panel";
    panel.innerHTML = `
      <div class="surface-stack">
        <div class="surface-header">
          <div class="surface-title">${title}</div>
          <span class="surface-chip">pending</span>
        </div>
        <div class="surface-detail">${detail}</div>
      </div>
    `;
    host.appendChild(panel);
  }

  function renderContent() {
    const host = document.getElementById("terminalContentHost");
    const hiddenStash = document.getElementById("terminalHiddenStash");
    const runsPanel = panelById("runsViewport");
    const mainNav = getMainNavKey();
    if (!host || !hiddenStash || !runsPanel) return;

    const stashedPanels = allPanels().filter((panel) => panel !== runsPanel);
    stashedPanels.forEach((panel) => {
      if (!document.getElementById("terminalRailHost")?.contains(panel) && !host.contains(panel)) {
        moveNode(hiddenStash, panel);
      }
    });

    host.innerHTML = "";

    if (mainNav !== "dev" || ["request-history", "repo-verified"].includes(getActiveSurface())) {
      mountNode(host, runsPanel);
      return;
    }

    if (screenUi.activeDevSurface === "collections-explorer") {
      const panels = [panelById("collectionsBrowserList"), panelById("collectionsResolvedSummary")].filter(Boolean);
      panels.forEach((panel) => mountNode(host, panel));
      if (!panels.length) {
        renderFallbackMessage(host, "Collections Explorer", "Explorer summary is not available yet.");
      }
      return;
    }

    const panels = curatedDevPanels();
    if (panels.length) {
      panels.forEach((panel) => mountNode(host, panel));
      return;
    }

    renderFallbackMessage(
      host,
      DEV_SURFACE_BY_KEY[screenUi.activeDevSurface]?.label || "Dev Surface",
      "This surface is still available in the hidden dev drawer while its panel routing is normalized.",
    );
  }

  function renderDevDrawer() {
    const host = document.getElementById("terminalDevDrawerContent");
    const hiddenStash = document.getElementById("terminalHiddenStash");
    if (!host || !hiddenStash) return;

    host.innerHTML = "";
    const rawPreviewLabels = [
      "NOTES JSON RAW PREVIEW",
      "SAVE WRITE REQUEST RAW PREVIEW",
      "DELTA RAW PREVIEW",
      "MOUNTED SOURCE CONTEXT RAW PREVIEW",
      "EXPORT SOURCE RAW PREVIEW",
      "APPLY SAVE STATUS RAW PREVIEW",
      "MOUNTED SAVE CONTEXT RAW PREVIEW",
      "REQUEST HISTORY RAW PREVIEW",
      "REPO VERIFIED RAW PREVIEW",
    ];

    allPanels()
      .filter((panel) => rawPreviewLabels.includes(panelLabel(panel)))
      .forEach((panel) => mountNode(host, panel));
  }

  function applyChassisTrim() {
    document.querySelectorAll("#terminalContentHost .panel > .label").forEach((label) => {
      label.style.display = "none";
    });
  }

  function renderShellChrome() {
    renderSystemsStrip();
    renderMainNav();
    renderRail();
    renderContent();
    renderDevDrawer();
    applyChassisTrim();
  }

  function injectStyles() {
    if (document.getElementById("terminal-shell-v5-style")) return;
    const style = document.createElement("style");
    style.id = "terminal-shell-v5-style";
    style.textContent = `
      .terminal-shell-v5 {
        display: grid;
        gap: 14px;
      }
      .terminal-systems-shell,
      .terminal-nav-shell,
      .terminal-content-shell,
      .terminal-rail-shell,
      .terminal-dev-drawer {
        border: 1px solid rgba(186, 156, 255, 0.24);
        border-radius: 18px;
        background: linear-gradient(180deg, rgba(18, 22, 34, 0.96), rgba(8, 10, 16, 0.98));
        overflow: hidden;
      }
      .terminal-systems-shell,
      .terminal-nav-shell,
      .terminal-content-shell,
      .terminal-rail-shell,
      .terminal-dev-drawer > summary,
      .terminal-dev-drawer-content {
        padding: 14px 16px;
      }
      .terminal-brand-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
      }
      .terminal-brand {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: #b38cff;
      }
      .terminal-active-screen {
        padding: 6px 10px;
        border: 1px solid rgba(104, 236, 247, 0.28);
        border-radius: 999px;
        color: #58e7f3;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        font-size: 11px;
      }
      .terminal-path-line,
      .terminal-status-line,
      .terminal-dev-surface-button .muted {
        color: #aab4c5;
      }
      .terminal-systems-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 10px;
        margin: 12px 0;
      }
      .terminal-pill {
        border: 1px solid rgba(186, 156, 255, 0.2);
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.02);
        padding: 10px 12px;
      }
      .terminal-pill-label {
        display: block;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: #b38cff;
        margin-bottom: 6px;
      }
      .terminal-pill-value {
        color: #e6ebf2;
      }
      .terminal-nav-shell {
        display: grid;
        gap: 10px;
      }
      .terminal-main-nav {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      #terminalMainNav {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .terminal-main-nav-button,
      .terminal-dev-surface-button {
        border: 1px solid rgba(186, 156, 255, 0.24);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.02);
        color: #e6ebf2;
        padding: 10px 14px;
      }
      .terminal-main-nav-button[data-active="true"],
      .terminal-dev-surface-button[data-active="true"] {
        border-color: rgba(104, 236, 247, 0.32);
        color: #58e7f3;
        box-shadow: 0 0 14px rgba(88, 231, 243, 0.08);
      }
      .terminal-content-shell .panel {
        margin: 0;
        padding: 0;
        border: none;
        background: transparent;
      }
      .terminal-content-shell #runsViewport {
        min-height: 420px;
        max-height: 68vh;
        overflow: auto;
      }
      .terminal-rail-shell[hidden] {
        display: none;
      }
      .terminal-dev-selector-list {
        display: grid;
        gap: 10px;
      }
      .terminal-dev-surface-button {
        text-align: left;
        display: grid;
        gap: 4px;
        border-radius: 16px;
      }
      .terminal-dev-drawer-content {
        display: grid;
        gap: 12px;
      }
      .terminal-hidden-stash,
      .terminal-stashed-panel {
        display: none !important;
      }
      .terminal-inline-panel {
        padding: 16px;
      }
      .terminal-content-shell .label {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function buildShell() {
    if (screenUi.shellBuilt) {
      scheduleRender();
      return;
    }

    injectStyles();

    const shell = document.querySelector(".shell");
    if (!shell) return;

    const statusSection = document.getElementById("statusStrip")?.closest("section");
    const navSection = document.getElementById("nav")?.closest("section");
    const actionsSection = document.getElementById("actions")?.closest("section");
    const runsPanel = panelById("runsViewport");
    const hiddenStash = document.createElement("div");
    hiddenStash.id = "terminalHiddenStash";
    hiddenStash.className = "terminal-hidden-stash";

    const devDrawer = document.createElement("details");
    devDrawer.className = "terminal-dev-drawer";
    devDrawer.innerHTML = `
      <summary>Dev Drawer</summary>
      <div class="terminal-dev-drawer-content" id="terminalDevDrawerContent"></div>
    `;

    const shellV5 = document.createElement("div");
    shellV5.className = "terminal-shell-v5";
    shellV5.innerHTML = `
      <section class="terminal-systems-shell">
        <div id="terminalHeaderBar"></div>
        <div id="terminalSystemsStrip"></div>
      </section>
      <section class="terminal-nav-shell">
        <div class="terminal-main-nav" id="terminalMainNav"></div>
      </section>
      <section class="terminal-content-shell">
        <div id="terminalContentHost"></div>
      </section>
      <section class="terminal-rail-shell">
        <div class="terminal-brand-row">
          <div class="terminal-brand" id="terminalRailTitle">Rail</div>
          <div class="terminal-path-line">${currentSelectionLabel()}</div>
        </div>
        <div id="terminalRailHost"></div>
      </section>
    `;

    const existingChildren = Array.from(shell.children);
    existingChildren.forEach((child) => moveNode(hiddenStash, child));

    shell.innerHTML = "";
    shell.appendChild(shellV5);
    shell.appendChild(devDrawer);
    shell.appendChild(hiddenStash);

    [statusSection, navSection, actionsSection].forEach((node) => moveNode(hiddenStash, node));

    if (runsPanel) {
      moveNode(hiddenStash, runsPanel);
    }

    ["statusStrip", "actions", "homeSummary", "cartridgeBayList", "collectionsBrowserList", "boardsBrowserList"].forEach((id) => {
      const target = document.getElementById(id);
      if (!target) return;
      const observer = new MutationObserver(() => {
        scheduleRender();
      });
      observer.observe(target, { childList: true, subtree: true, characterData: true, attributes: true });
    });

    screenUi.shellBuilt = true;
    renderShellChrome();
  }

  window.addEventListener("tars:screen-request", (event) => {
    const requestedSurface = event?.detail?.screen;
    if (requestedSurface) {
      resolveScreenRequest(requestedSurface);
    }
  });

  [
    "tars:request-history-updated",
    "tars:repo-verified-updated",
    "tars:collections-updated",
    "tars:devtools-changed",
    "tars:screen-changed",
  ].forEach((eventName) => {
    window.addEventListener(eventName, () => {
      if (screenUi.shellBuilt) {
        scheduleRender();
      }
    });
  });

  window.addEventListener("DOMContentLoaded", () => {
    buildShell();
  }, { once: true });
})();
