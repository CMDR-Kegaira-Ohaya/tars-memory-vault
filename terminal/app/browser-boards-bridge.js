(() => {
  const key = "__TARS_BOARDS__";
  const shared = window[key] || (window[key] = {});
  if (shared.fetchBridgeInstalled) {
    return;
  }

  const screenUiKey = "__TARS_SCREEN_UI__";
  const screenUi = window[screenUiKey] || (window[screenUiKey] = { activeScreen: "home" });
  const devtoolsKey = "__TARS_DEVTOOLS__";
  const devtools = window[devtoolsKey] || (window[devtoolsKey] = {
    mountedCartridge: null,
    requestHistorySurface: null,
    repoVerifiedSurface: null,
  });
  const debugIntakeKey = "__TARS_DEBUG_INTAKE__";
  const debugIntake = window[debugIntakeKey] || (window[debugIntakeKey] = {
    payloadText: "",
    payloadKind: "empty",
    sourceLabel: "empty",
    updatedAt: null,
    notice: "",
    returnScreen: "home",
  });

  function ensureApplyButtonIdAlias() {
    const canonicalId = "markApplyAsApplied";
    const legacyId = "markApplyAsAapplied";
    const canonicalButton = document.getElementById(canonicalId);
    const legacyButton = document.getElementById(legacyId);
    if (!canonicalButton && legacyButton) {
      legacyButton.id = canonicalId;
    }
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

  function safeJsonParse(text) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  function summarizePayload(text) {
    const trimmed = String(text || "");
    if (!trimmed) return { kind: "empty", lines: 0, chars: 0, topKeys: [] };
    const parsed = safeJsonParse(trimmed);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return {
        kind: "json",
        lines: trimmed.split("\n").length,
        chars: trimmed.length,
        topKeys: Object.keys(parsed).slice(0, 8),
      };
    }
    return {
      kind: "text",
      lines: trimmed.split("\n").length,
      chars: trimmed.length,
      topKeys: [],
    };
  }

  function emitDebugUpdate() {
    window.dispatchEvent(
      new CustomEvent("tars:debug-intake-updated", {
        detail: {
          payloadKind: debugIntake.payloadKind,
          sourceLabel: debugIntake.sourceLabel,
          updatedAt: debugIntake.updatedAt,
        },
      })
    );
  }

  function updatePayload(text, sourceLabel, notice = "") {
    const summary = summarizePayload(text);
    debugIntake.payloadText = String(text || "");
    debugIntake.payloadKind = summary.kind;
    debugIntake.sourceLabel = sourceLabel || "manual";
    debugIntake.updatedAt = new Date().toISOString();
    debugIntake.notice = notice;
    emitDebugUpdate();
  }

  function getActiveScreen() {
    if (devtools.mountedCartridge === "request-history") return "request-history";
    if (devtools.mountedCartridge === "repo-verified") return "repo-verified";
    return screenUi.activeScreen || "home";
  }

  function setScreen(screen) {
    const previousMounted = devtools.mountedCartridge;
    if (screen === "request-history" || screen === "repo-verified") {
      devtools.mountedCartridge = screen;
    } else {
      devtools.mountedCartridge = null;
    }
    screenUi.activeScreen = screen;
    if (previousMounted !== devtools.mountedCartridge) {
      window.dispatchEvent(
        new CustomEvent("tars:devtools-changed", {
          detail: { mountedCartridge: devtools.mountedCartridge },
        })
      );
    }
    window.dispatchEvent(
      new CustomEvent("tars:screen-changed", {
        detail: {
          activeScreen: screen,
          lastBaseScreen: screenUi.lastBaseScreen,
        },
      })
    );
  }

  function openDebugIntake() {
    const current = getActiveScreen();
    if (current !== "debug-intake") {
      debugIntake.returnScreen = current || screenUi.lastBaseScreen || "home";
    }
    setScreen("debug-intake");
  }

  function closeDebugIntake() {
    setScreen(debugIntake.returnScreen || screenUi.lastBaseScreen || "home");
  }

  function selectedEntryLabel(listId) {
    return document.querySelector(`#${listId} button[data-selected="true"] .surface-title`)?.textContent?.trim() || null;
  }

  function parsePreviewById(id) {
    const node = document.getElementById(id);
    if (!node) return null;
    const text = node.textContent || "";
    return safeJsonParse(text) || text || null;
  }

  function parseHomeRawState() {
    const home = document.getElementById("homeSummary");
    try {
      return JSON.parse(home?.dataset?.rawSummary || "{}");
    } catch {
      return {};
    }
  }

  function buildTerminalSnapshot() {
    const viewport = document.getElementById("runsViewport");
    return {
      schema: "tars-debug-intake.v1",
      generatedAt: new Date().toISOString(),
      activeScreen: getActiveScreen(),
      returnScreen: debugIntake.returnScreen || "home",
      headerPath: document.querySelector(".terminal-path-line")?.textContent?.trim() || null,
      railTitle: document.getElementById("terminalRailTitle")?.textContent?.trim() || null,
      railContext: document.getElementById("terminalRailContext")?.textContent?.trim() || null,
      selections: {
        cartridge: selectedEntryLabel("cartridgeBayList"),
        collection: selectedEntryLabel("collectionsBrowserList"),
        board: selectedEntryLabel("boardsBrowserList"),
      },
      homeSummary: parseHomeRawState(),
      statusStrip: document.getElementById("statusStrip")?.textContent || "",
      runsViewportRaw: viewport?.dataset?.rawText || viewport?.textContent || "",
      previews: {
        applyStatus: parsePreviewById("applyStatusPreview"),
        repoVerified: parsePreviewById("repoVerifiedPreview"),
        requestHistory: parsePreviewById("requestHistoryPreview"),
        mountedSourceContext: parsePreviewById("mountedSourceContextPreview"),
        mountedSaveContext: parsePreviewById("mountedSaveContextPreview"),
        notesPayload: parsePreviewById("notePayloadPreview"),
        saveBridge: parsePreviewById("saveBridgePreview"),
        exportSource: parsePreviewById("exportSourcePreview"),
        delta: parsePreviewById("deltaPreview"),
      },
    };
  }

  async function copyPayload() {
    const text = debugIntake.payloadText || "";
    if (!text) {
      debugIntake.notice = "nothing to copy";
      emitDebugUpdate();
      renderDebugIntakeIfActive(true);
      return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        debugIntake.notice = "payload copied to clipboard";
      } else {
        debugIntake.notice = "clipboard API unavailable";
      }
    } catch {
      debugIntake.notice = "clipboard copy failed";
    }
    emitDebugUpdate();
    renderDebugIntakeIfActive(true);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function ensureLauncher() {
    const actions = document.getElementById("actions");
    if (!actions) return;
    let button = document.getElementById("action-debug-intake");
    if (!button || button.parentElement !== actions) {
      button = document.createElement("button");
      button.id = "action-debug-intake";
      button.addEventListener("click", () => {
        if (getActiveScreen() === "debug-intake") closeDebugIntake();
        else openDebugIntake();
      });
      actions.appendChild(button);
    }
    const active = getActiveScreen() === "debug-intake";
    button.disabled = false;
    button.removeAttribute("aria-disabled");
    button.dataset.actionKey = "debug-intake";
    button.dataset.actionState = active ? "active" : "available";
    button.dataset.rawActionState = active ? "active" : "available";
    button.dataset.rawText = `debug-intake : ${active ? "active" : "available"}`;
    button.textContent = button.dataset.rawText;
  }

  function removeLegacyTab() {
    document.getElementById("terminalScreenTab-debug-intake")?.remove();
  }

  function ensureChrome() {
    ensureLauncher();
    removeLegacyTab();
    if (getActiveScreen() === "debug-intake") {
      const activeChip = document.querySelector(".terminal-active-screen");
      if (activeChip) activeChip.textContent = "Debug Intake";
      const pathLine = document.querySelector(".terminal-path-line");
      if (pathLine) pathLine.textContent = "Home / Dev / Debug Intake";
    }
  }

  function renderDebugIntakeIfActive(force = false) {
    ensureChrome();
    if (getActiveScreen() !== "debug-intake") return;
    const container = document.getElementById("runsViewport");
    if (!container) return;
    if (!force && document.activeElement?.id === "debugIntakeEditor") return;

    const summary = summarizePayload(debugIntake.payloadText);
    const renderState = JSON.stringify({
      payloadText: debugIntake.payloadText,
      sourceLabel: debugIntake.sourceLabel,
      updatedAt: debugIntake.updatedAt,
      notice: debugIntake.notice,
      active: getActiveScreen(),
    });
    if (container.dataset.debugIntakeState === renderState) return;
    container.dataset.debugIntakeState = renderState;
    container.dataset.rawText = debugIntake.payloadText || "";
    container.innerHTML = `
      <div class="surface-stack screen-context screen-context-dev">
        <div class="surface-header">
          <div class="surface-title">Debug Intake</div>
          <span class="surface-chip">local only</span>
        </div>
        <div class="surface-detail screen-copy">
          Capture the current terminal state into one copyable payload, or paste/drop your own text or JSON here for side-by-side diagnosis.
        </div>
        <div class="surface-meta-grid">
          <div><span class="muted">payload type</span> ${escapeHtml(summary.kind)}</div>
          <div><span class="muted">source</span> ${escapeHtml(debugIntake.sourceLabel || "manual")}</div>
          <div><span class="muted">lines</span> ${summary.lines}</div>
          <div><span class="muted">chars</span> ${summary.chars}</div>
          <div><span class="muted">updated</span> ${escapeHtml(debugIntake.updatedAt || "never")}</div>
          <div><span class="muted">return screen</span> ${escapeHtml(debugIntake.returnScreen || "home")}</div>
        </div>
        ${summary.topKeys.length ? `<div class="surface-foot muted">top keys: ${escapeHtml(summary.topKeys.join(", "))}</div>` : ""}
        ${debugIntake.notice ? `<div class="surface-foot">${escapeHtml(debugIntake.notice)}</div>` : ""}
        <div class="row">
          <button type="button" data-debug-intake-action="capture">Capture current terminal state</button>
          <button type="button" data-debug-intake-action="copy"${debugIntake.payloadText ? "" : " disabled"}>Copy payload</button>
          <button type="button" data-debug-intake-action="clear"${debugIntake.payloadText ? "" : " disabled"}>Clear</button>
          <button type="button" data-debug-intake-action="back">Back</button>
        </div>
        <div id="debugIntakeDropZone" class="surface-list-item">
          <div>Drop a text / json / md file here, or paste directly into the intake field.</div>
          <div class="muted">Nothing leaves the page. This is for operator relay and structured debugging only.</div>
        </div>
        <div class="surface-stack">
          <div class="muted">intake payload</div>
          <textarea id="debugIntakeEditor" spellcheck="false" placeholder="Paste structured state, error text, or drop a file here...">${escapeHtml(debugIntake.payloadText || "")}</textarea>
        </div>
      </div>
    `;
  }

  ensureApplyButtonIdAlias();

  const originalFetch = window.fetch.bind(window);
  shared.fetchBridgeInstalled = true;
  shared.originalFetch = originalFetch;

  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const path = normalizeInput(args[0]);
    if (path.endsWith("app/board-enumeration.v1.json")) {
      return wrapJsonResponse(response, (data) => {
        shared.boardEnumeration = data;
        return data;
      });
    }
    return response;
  };

  document.addEventListener("click", async (event) => {
    const actionNode = event.target.closest("[data-debug-intake-action]");
    if (!actionNode) return;
    const action = actionNode.dataset.debugIntakeAction;
    if (action === "capture") {
      updatePayload(JSON.stringify(buildTerminalSnapshot(), null, 2), "live-terminal-snapshot", "captured current terminal state");
      renderDebugIntakeIfActive(true);
      return;
    }
    if (action === "copy") {
      await copyPayload();
      return;
    }
    if (action === "clear") {
      updatePayload("", "cleared", "");
      renderDebugIntakeIfActive(true);
      return;
    }
    if (action === "back") {
      closeDebugIntake();
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target.id !== "debugIntakeEditor") return;
    updatePayload(event.target.value, "manual-edit", "");
  });

  document.addEventListener("dragover", (event) => {
    if (getActiveScreen() !== "debug-intake") return;
    if (!event.target.closest("#debugIntakeDropZone, #runsViewport")) return;
    event.preventDefault();
  });

  document.addEventListener("drop", async (event) => {
    if (getActiveScreen() !== "debug-intake") return;
    if (!event.target.closest("#debugIntakeDropZone, #runsViewport")) return;
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file && typeof file.text === "function") {
      const text = await file.text();
      updatePayload(text, `drop:${file.name}`, `loaded ${file.name}`);
      renderDebugIntakeIfActive(true);
      return;
    }
    const text = event.dataTransfer?.getData("text/plain");
    if (text) {
      updatePayload(text, "drop:text", "loaded dropped text");
      renderDebugIntakeIfActive(true);
    }
  });

  window.addEventListener("DOMContentLoaded", () => {
    ensureChrome();
    renderDebugIntakeIfActive(true);
  }, { once: true });

  [
    "tars:screen-changed",
    "tars:debug-intake-updated",
    "tars:request-history-updated",
    "tars:repo-verified-updated",
    "tars:devtools-changed",
  ].forEach((eventName) => window.addEventListener(eventName, () => {
    ensureChrome();
    renderDebugIntakeIfActive(false);
  }));
})();
