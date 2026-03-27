(() => {
  const runtime = {
    contract: null,
    contentCache: new Map(),
  };
  const rawKeys = [
    "surface",
    "displayMode",
    "source",
    "mountedKind",
    "renderer",
    "engine",
    "readOnly",
    "sessionPersistence",
    "viewState",
  ];
  const devtoolsKey = "__TARS_DEVTOOLS__";
  const devtools = window[devtoolsKey] || (window[devtoolsKey] = {
    mountedCartridge: null,
    requestHistorySurface: null,
    repoVerifiedSurface: null,
  });
  const screenUiKey = "__TARS_SCREEN_UI__";
  const screenUi = window[screenUiKey] || (window[screenUiKey] = { activeScreen: "home" });
  const runtimeStateKey = "__TARS_RUNTIME_STATE__";
  const runtimeState = window[runtimeStateKey] || (window[runtimeStateKey] = {
    active: false,
    title: "none",
    source: "none",
    state: "idle",
    mode: "home",
    currentMount: "none",
  });

  function normalizePath(path) {
    return String(path || "").replace(/^terminal\//, "");
  }

  async function loadJson(path) {
    const response = await fetch(normalizePath(path));
    if (!response.ok) throw new Error(`failed to load ${path}`);
    return response.json();
  }

  async function loadText(path) {
    const response = await fetch(normalizePath(path));
    if (!response.ok) throw new Error(`failed to load ${path}`);
    return response.text();
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

  function deriveSurface(input) {
    const states = runtime.contract?.states || {};
    for (const stateConfig of Object.values(states)) {
      if (matches(stateConfig.match || {}, input)) {
        return stateConfig.derive || {};
      }
    }
    return {
      title: "Runs surface",
      statusChip: input.viewState || "idle",
      runtimeLabel: input.displayMode || "unknown",
      persistenceLabel: input.sessionPersistence || "none",
      mutabilityLabel: input.readOnly === "true" ? "read only" : "interactive",
      detail: "Runs surface presentation fallback.",
    };
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function injectReaderStyles() {
    if (document.getElementById("terminal-reader-style")) return;
    const style = document.createElement("style");
    style.id = "terminal-reader-style";
    style.textContent = `
      #runsViewport .terminal-reader-shell {
        display: grid;
        gap: 14px;
      }
      #runsViewport .terminal-reader-meta {
        display: grid;
        gap: 10px;
        padding: 14px;
        border-radius: 18px;
        border: 1px solid rgba(179, 140, 255, 0.16);
        background: rgba(255, 255, 255, 0.015);
      }
      #runsViewport .terminal-reader-article {
        padding: 18px;
        border-radius: 18px;
        border: 1px solid rgba(88, 231, 243, 0.14);
        background: rgba(255, 255, 255, 0.018);
        line-height: 1.7;
      }
      #runsViewport .terminal-reader-article h1,
      #runsViewport .terminal-reader-article h2,
      #runsViewport .terminal-reader-article h3,
      #runsViewport .terminal-reader-article h4 {
        color: var(--accent-2, #b38cff);
        margin: 0 0 12px;
      }
      #runsViewport .terminal-reader-article p,
      #runsViewport .terminal-reader-article ul,
      #runsViewport .terminal-reader-article blockquote,
      #runsViewport .terminal-reader-article pre {
        margin: 0 0 14px;
      }
      #runsViewport .terminal-reader-article ul {
        padding-left: 20px;
      }
      #runsViewport .terminal-reader-article blockquote {
        padding-left: 12px;
        border-left: 2px solid rgba(88, 231, 243, 0.28);
        color: var(--text-soft, #a8afbc);
      }
      #runsViewport .terminal-reader-article code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.95em;
        color: var(--accent, #58e7f3);
      }
      #runsViewport .terminal-reader-loading,
      #runsViewport .terminal-reader-error {
        padding: 16px;
        border-radius: 16px;
        border: 1px solid rgba(179, 140, 255, 0.16);
        background: rgba(255, 255, 255, 0.018);
      }
      #runsViewport .terminal-reader-error {
        border-color: rgba(255, 190, 134, 0.3);
      }
    `;
    document.head.appendChild(style);
  }

  function setRawText(container, text) {
    container.dataset.rawText = text;
  }

  function renderHtml(container, type, payload, html, rawText = "") {
    const renderState = JSON.stringify({ type, payload });
    if (container.dataset.renderState === renderState) {
      if (rawText) setRawText(container, rawText);
      return;
    }
    container.dataset.renderState = renderState;
    if (rawText) setRawText(container, rawText);
    container.innerHTML = html;
  }

  function parseHomeRawState() {
    const home = document.getElementById("homeSummary");
    try {
      return JSON.parse(home?.dataset?.rawSummary || "{}");
    } catch {
      return {};
    }
  }

  function parseRawText(container) {
    const text = container.textContent || "";
    const looksRaw = rawKeys.some((key) => text.includes(`${key}:`));
    if (looksRaw) {
      container.dataset.rawText = text;
    }
    const rawText = container.dataset.rawText || text;
    const result = {};
    rawText.split("\n").forEach((line) => {
      const parts = line.split(": ");
      if (parts.length < 2) return;
      const key = parts.shift();
      result[key] = parts.join(": ");
    });
    return result;
  }

  function mirrorScreenSource(container, type, sourceId, rawText, footerText = "") {
    const source = document.getElementById(sourceId);
    const sourceHtml =
      source?.innerHTML?.trim() ||
      `<div class="surface-stack"><div class="surface-detail">Source panel unavailable.</div></div>`;
    renderHtml(
      container,
      type,
      { sourceId, sourceHtml, footerText, rawText },
      `${sourceHtml}${footerText ? `<div class="surface-foot muted">${escapeHtml(footerText)}</div>` : ""}`,
      rawText,
    );
  }

  function inlineFormat(text) {
    let formatted = escapeHtml(text);
    formatted = formatted.replace(/`([^`]+)`/g, "<code>$1</code>");
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    formatted = formatted.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    return formatted;
  }

  function markdownToHtml(text) {
    const lines = String(text || "").replace(/\r/g, "").split("\n");
    const html = [];
    let paragraph = [];
    let list = [];
    let quote = [];

    function flushParagraph() {
      if (!paragraph.length) return;
      html.push(`<p>${inlineFormat(paragraph.join(" "))}</p>`);
      paragraph = [];
    }

    function flushList() {
      if (!list.length) return;
      html.push(`<ul>${list.map((item) => `<li>${inlineFormat(item)}</li>`).join("")}</ul>`);
      list = [];
    }

    function flushQuote() {
      if (!quote.length) return;
      html.push(`<blockquote>${quote.map((item) => `<p>${inlineFormat(item)}</p>`).join("")}</blockquote>`);
      quote = [];
    }

    function flushAll() {
      flushParagraph();
      flushList();
      flushQuote();
    }

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        flushAll();
        continue;
      }
      if (/^#{1,6}\s/.test(trimmed)) {
        flushAll();
        const level = trimmed.match(/^#+/)[0].length;
        html.push(`<h${level}>${inlineFormat(trimmed.replace(/^#{1,6}\s*/, ""))}</h${level}>`);
        continue;
      }
      if (/^[-*]\s+/.test(trimmed)) {
        flushParagraph();
        flushQuote();
        list.push(trimmed.replace(/^[-*]\s+/, ""));
        continue;
      }
      if (/^>\s?/.test(trimmed)) {
        flushParagraph();
        flushList();
        quote.push(trimmed.replace(/^>\s?/, ""));
        continue;
      }
      paragraph.push(trimmed);
    }

    flushAll();
    return html.join("");
  }

  function basename(path) {
    const clean = normalizePath(path);
    if (!clean) return "loaded item";
    const last = clean.split("/").filter(Boolean).pop() || clean;
    return last.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
  }

  function getActiveTitle(rawState) {
    const stateTitle = String(runtimeState.title || "").trim();
    if (stateTitle && !["none", "mounted cartridge", "mounted-cartridge", "live board", "live-board"].includes(stateTitle.toLowerCase())) {
      return stateTitle;
    }
    return basename(rawState.source);
  }

  function ensureContent(path) {
    const key = normalizePath(path);
    const cached = runtime.contentCache.get(key);
    if (cached) return cached;

    const record = { status: "loading", text: "", error: "" };
    runtime.contentCache.set(key, record);
    loadText(key)
      .then((text) => {
        record.status = "ready";
        record.text = text;
        window.dispatchEvent(new CustomEvent("tars:runs-content-updated", { detail: { path: key } }));
      })
      .catch((error) => {
        record.status = "error";
        record.error = error?.message || `failed to load ${key}`;
        window.dispatchEvent(new CustomEvent("tars:runs-content-updated", { detail: { path: key } }));
      });
    return record;
  }

  function renderActiveHome(container, rawState) {
    injectReaderStyles();
    const sourcePath = normalizePath(rawState.source);
    const content = ensureContent(sourcePath);
    const title = getActiveTitle(rawState);
    const renderer = String(rawState.renderer || "none");
    const sourceLabel = runtimeState.source || (rawState.mountedKind === "board" ? "board" : "repo file");

    let bodyHtml = `<div class="terminal-reader-loading">Loading content from <code>${escapeHtml(sourcePath)}</code>…</div>`;
    if (content.status === "ready") {
      const renderedBody = renderer.includes("markdown") || /\.md$/i.test(sourcePath)
        ? markdownToHtml(content.text)
        : `<pre>${escapeHtml(content.text)}</pre>`;
      bodyHtml = `<article class="terminal-reader-article">${renderedBody}</article>`;
    } else if (content.status === "error") {
      bodyHtml = `
        <div class="terminal-reader-error">
          <div class="surface-title">Content unavailable</div>
          <div class="surface-detail">The item is loaded into session state, but the source file could not be read from <code>${escapeHtml(sourcePath)}</code>.</div>
          <div class="surface-foot muted">${escapeHtml(content.error)}</div>
        </div>
      `;
    }

    renderHtml(
      container,
      "home-active",
      {
        sourcePath,
        status: content.status,
        title,
        renderer,
        state: rawState.viewState || "loaded",
      },
      `
        <div class="terminal-reader-shell">
          <div class="terminal-reader-meta">
            <div class="surface-header">
              <div class="surface-title">${escapeHtml(title)}</div>
              <span class="surface-chip">${escapeHtml(rawState.viewState || "loaded")}</span>
            </div>
            <div class="surface-meta-grid">
              <div><span class="muted">source</span> ${escapeHtml(sourceLabel)}</div>
              <div><span class="muted">path</span> ${escapeHtml(sourcePath)}</div>
              <div><span class="muted">renderer</span> ${escapeHtml(renderer)}</div>
              <div><span class="muted">mode</span> ${escapeHtml(rawState.displayMode || "reader")}</div>
            </div>
            <div class="surface-detail">Home is now showing the active item itself, not just the mounted-state summary.</div>
          </div>
          ${bodyHtml}
        </div>
      `,
      container.dataset.rawText || "",
    );
  }

  function renderHomeScreen(container) {
    const rawViewport = parseRawText(container);
    const activeHome =
      normalizePath(rawViewport.source) &&
      normalizePath(rawViewport.source) !== "none" &&
      rawViewport.displayMode !== "empty-shell-placeholder" &&
      rawViewport.viewState !== "idle";

    if (activeHome) {
      renderActiveHome(container, rawViewport);
      return;
    }

    const raw = parseHomeRawState();
    const rawText = [
      `source: ${raw.currentMount || "none"}`,
      `mode: ${raw.mode || "home"}`,
      `save: ${raw.save || "disabled"}`,
      `export: ${raw.exportSource || "disabled"}`,
    ].join("\n");
    mirrorScreenSource(container, "home", "homeSummary", rawText);
  }

  function renderCartridgeBayScreen(container) {
    const raw = parseHomeRawState();
    const rawText = [
      `source: ${raw.currentMount || "none"}`,
      "mode: cartridge-bay",
    ].join("\n");
    mirrorScreenSource(
      container,
      "cartridge-bay",
      "cartridgeBaySummary",
      rawText,
      "A hands the selected cartridge into cartridge resolve.",
    );
  }

  function renderCollectionsScreen(container) {
    const raw = parseHomeRawState();
    const mountButton = document.getElementById("collectionsMountConfirm");
    const rawText = [
      `source: ${raw.currentMount || "none"}`,
      `mode: ${raw.mode || "collections"}`,
    ].join("\n");
    mirrorScreenSource(
      container,
      "collections",
      "collectionsResolvedSummary",
      rawText,
      mountButton && !mountButton.disabled ? "A loads the currently selected file." : "Select a file in the rail to enable A.",
    );
  }

  function renderRepoLoadScreen(container) {
    const selected = document.querySelector('#collectionsBrowserList button[data-selected="true"] .surface-title')?.textContent?.trim() || "none";
    const selectedCategory = document.querySelector('#collectionsBrowserList button[data-selected="true"] .surface-chip')?.textContent?.trim() || "repo file";
    const count = document.querySelectorAll('#collectionsBrowserList button.manifest-entry').length;
    const mountButton = document.getElementById("collectionsMountConfirm");
    renderHtml(
      container,
      "repo-load",
      { selected, count, mountEnabled: Boolean(mountButton && !mountButton.disabled) },
      `
        <div class="surface-stack screen-context">
          <div class="surface-header">
            <div class="surface-title">Repo Load</div>
            <span class="surface-chip">collections files</span>
          </div>
          <div class="surface-meta-grid">
            <div><span class="muted">selected</span> ${escapeHtml(selected)}</div>
            <div><span class="muted">type</span> ${escapeHtml(selectedCategory || "repo file")}</div>
            <div><span class="muted">available files</span> ${count}</div>
            <div><span class="muted">cartridges</span> excluded</div>
          </div>
          <div class="surface-detail screen-copy">
            Browse repo-backed files from Collections here. This path is for repo files, not cartridges.
          </div>
          <div class="surface-foot muted">${mountButton && !mountButton.disabled ? "A loads the selected repo file." : "Select a repo file in the rail to enable A."}</div>
        </div>
      `,
      `source: ${selected}\nmode: repo-load`
    );
  }

  function renderBoardsScreen(container) {
    const raw = parseHomeRawState();
    const mountButton = document.getElementById("boardsMountConfirm");
    const rawText = [
      `source: ${raw.currentMount || "none"}`,
      `mode: ${raw.mode || "boards"}`,
    ].join("\n");
    mirrorScreenSource(
      container,
      "boards",
      "boardsResolvedSummary",
      rawText,
      mountButton && !mountButton.disabled ? "A mounts the current board." : "Select a board in the rail to enable A.",
    );
  }

  function openScreen(screen) {
    const shellApi = window.__TARS_COLLECTIONS__?.runtimeApi || null;
    if (shellApi?.setActiveScreen) {
      shellApi.setActiveScreen(screen);
      return;
    }
    window.dispatchEvent(new CustomEvent("tars:screen-request", { detail: { screen } }));
  }

  function renderLoadScreen(container) {
    const payload = {
      mode: "load",
      options: ["repo-load", "import-files"],
    };
    renderHtml(
      container,
      "load",
      payload,
      `
        <div class="surface-stack screen-context">
          <div class="surface-header">
            <div class="surface-title">Load</div>
            <span class="surface-chip">entry menu</span>
          </div>
          <div class="surface-detail screen-copy">
            Choose how you want to bring material into the terminal.
          </div>
          <div class="load-option-grid">
            <button type="button" class="load-option-button" data-load-target="repo-load">
              <div class="load-option-title">Repo Load</div>
              <div class="load-option-copy">Browse repo-backed files from Collections. Cartridges are not part of this path.</div>
            </button>
            <button type="button" class="load-option-button" data-load-target="import-bay">
              <div class="load-option-title">Import Files</div>
              <div class="load-option-copy">Choose an external or local file and bring it into the terminal through the import path.</div>
            </button>
          </div>
        </div>
      `,
      "source: load\nmode: load"
    );

    container.querySelectorAll("[data-load-target]").forEach((button) => {
      if (button.dataset.loadBound === "true") return;
      button.dataset.loadBound = "true";
      button.addEventListener("click", () => openScreen(button.dataset.loadTarget));
    });
  }

  function renderRequestHistoryCartridge(container) {
    const data = devtools.requestHistorySurface || {
      surface: {
        status: "idle",
        saveTag: null,
        historyPath: "none",
        entryCount: 0,
        detail: "request-history-unavailable",
      },
      entries: [],
    };

    const entries = data.entries || [];
    const entriesHtml = entries.length
      ? entries.map((entry) => `
          <div class="surface-list-item">
            <div><span class="muted">${entry.order || "-"}. </span>${escapeHtml(entry.kind || "unknown")} — ${escapeHtml(entry.status || "unknown")}</div>
            <div class="muted">${escapeHtml(entry.path || "none")}</div>
          </div>
        `).join("")
      : `<div class="muted">${data.surface?.saveTag ? "history index unavailable" : "no mounted save slot"}</div>`;

    renderHtml(
      container,
      "request-history",
      data,
      `
        <div class="surface-stack screen-context screen-context-dev">
          <div class="surface-header">
            <div class="surface-title">Request History</div>
            <span class="surface-chip">${escapeHtml(data.surface?.status || "unknown")}</span>
          </div>
          <div class="surface-meta-grid">
            <div><span class="muted">save tag</span> ${escapeHtml(data.surface?.saveTag || "none")}</div>
            <div><span class="muted">entry count</span> ${data.surface?.entryCount ?? 0}</div>
            <div><span class="muted">discovery path</span> ${escapeHtml(data.surface?.historyPath || "none")}</div>
            <div><span class="muted">detail</span> ${escapeHtml(data.surface?.detail || "none")}</div>
          </div>
          <div class="surface-list">${entriesHtml}</div>
        </div>
      `,
      `source: ${data.surface?.historyPath || "none"}\nmode: request-history`
    );
  }

  function renderRepoVerifiedCartridge(container) {
    const data = devtools.repoVerifiedSurface || {
      repoVerifiedStatus: {
        consumed: false,
        status: "idle",
        detail: "repo-verified-unavailable",
        saveTag: null,
        verifiedHead: "none",
        pathsVerified: [],
        trusted: false,
      },
    };
    const status = data.repoVerifiedStatus || {};
    const paths = Array.isArray(status.pathsVerified) ? status.pathsVerified : [];
    const pathsHtml = paths.length
      ? paths.map((path) => `<div class="surface-list-item"><div>${escapeHtml(path)}</div></div>`).join("")
      : `<div class="muted">no verified paths recorded</div>`;

    renderHtml(
      container,
      "repo-verified",
      data,
      `
        <div class="surface-stack screen-context screen-context-dev">
          <div class="surface-header">
            <div class="surface-title">Repo Verified</div>
            <span class="surface-chip">${escapeHtml(status.status || "unknown")}</span>
          </div>
          <div class="surface-meta-grid">
            <div><span class="muted">consumed</span> ${escapeHtml(String(status.consumed))}</div>
            <div><span class="muted">save tag</span> ${escapeHtml(status.saveTag || "none")}</div>
            <div><span class="muted">verified head</span> ${escapeHtml(status.verifiedHead || "none")}</div>
            <div><span class="muted">trusted</span> ${escapeHtml(String(status.trusted))}</div>
            <div><span class="muted">paths verified</span> ${paths.length}</div>
            <div><span class="muted">detail</span> ${escapeHtml(status.detail || "none")}</div>
          </div>
          <div class="surface-list">${pathsHtml}</div>
        </div>
      `,
      `source: ${status.verifiedHead || "none"}\nmode: repo-verified`
    );
  }

  function renderDefaultSurface(container) {
    const rawState = parseRawText(container);
    const surface = deriveSurface(rawState);
    renderHtml(
      container,
      "default",
      { surface, rawState },
      `
        <div class="surface-stack">
          <div class="surface-header">
            <div class="surface-title">${escapeHtml(surface.title || "Runs surface")}</div>
            <span class="surface-chip">${escapeHtml(surface.statusChip || "idle")}</span>
          </div>
          <div class="surface-meta-grid">
            <div><span class="muted">source</span> ${escapeHtml(rawState.source || "none")}</div>
            <div><span class="muted">runtime</span> ${escapeHtml(surface.runtimeLabel || "unknown")}</div>
            <div><span class="muted">renderer</span> ${escapeHtml(rawState.renderer || "none")}</div>
            <div><span class="muted">engine</span> ${escapeHtml(rawState.engine || "none")}</div>
            <div><span class="muted">persistence</span> ${escapeHtml(surface.persistenceLabel || "none")}</div>
            <div><span class="muted">mutability</span> ${escapeHtml(surface.mutabilityLabel || "interactive")}</div>
          </div>
          <div class="surface-detail screen-copy">${escapeHtml(surface.detail || "Runs surface presentation fallback.")}</div>
        </div>
      `
    );
  }

  function getActiveScreen() {
    if (devtools.mountedCartridge === "request-history") return "request-history";
    if (devtools.mountedCartridge === "repo-verified") return "repo-verified";
    return screenUi.activeScreen || "home";
  }

  function refresh() {
    const container = document.getElementById("runsViewport");
    if (!container) return;

    const activeScreen = getActiveScreen();
    if (["debug-intake", "import-bay", "collections-explorer"].includes(activeScreen)) {
      return;
    }

    switch (activeScreen) {
      case "home":
        renderHomeScreen(container);
        return;
      case "cartridge-bay":
        renderCartridgeBayScreen(container);
        return;
      case "collections":
        renderCollectionsScreen(container);
        return;
      case "repo-load":
        renderRepoLoadScreen(container);
        return;
      case "boards":
        renderBoardsScreen(container);
        return;
      case "load":
        renderLoadScreen(container);
        return;
      case "request-history":
        renderRequestHistoryCartridge(container);
        return;
      case "repo-verified":
        renderRepoVerifiedCartridge(container);
        return;
      default:
        renderDefaultSurface(container);
    }
  }

  async function boot() {
    runtime.contract = await loadJson("app/runs-surface.v1.json").catch(() => null);
    refresh();

    const container = document.getElementById("runsViewport");
    if (container) {
      const observer = new MutationObserver(() => {
        if (["debug-intake", "import-bay", "collections-explorer"].includes(getActiveScreen())) return;
        refresh();
      });
      observer.observe(container, { childList: true, subtree: true, characterData: true });
    }

    [
      "tars:screen-changed",
      "tars:devtools-changed",
      "tars:request-history-updated",
      "tars:repo-verified-updated",
      "tars:home-updated",
      "tars:cartridge-bay-updated",
      "tars:collections-updated",
      "tars:boards-updated",
      "tars:runs-content-updated",
    ].forEach((eventName) => window.addEventListener(eventName, refresh));

    window.setInterval(() => {
      if (["debug-intake", "import-bay", "collections-explorer"].includes(getActiveScreen())) return;
      refresh();
    }, 1500);
  }

  boot().catch(() => {});
})();