(() => {
  const runtime = { contract: null };

  const FAMILY_OPTIONS = ["cartridges", "books", "entertainment", "various"];
  const KIND_BY_FAMILY = {
    cartridges: "cartridge",
    books: "book",
    entertainment: "media-entry",
    various: "bundle",
  };

  function normalizePath(path) {
    return String(path || "").replace(/^terminal\//, "");
  }

  async function loadJson(path) {
    const response = await fetch(normalizePath(path));
    if (!response.ok) throw new Error(`failed to load ${path}`);
    return response.json();
  }

  function parseJson(text) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
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
      if (matches(stateConfig.match || {}, input)) return stateConfig.derive || {};
    }
    return {
      title: "Repo verification",
      statusChip: input.status || "unknown",
      detail: "Repo verification presentation fallback.",
      trustLabel: input.trusted ? "trusted" : "review",
    };
  }

  function readPanelState() {
    return parseJson(document.getElementById("repoVerifiedPreview")?.textContent || "") || {};
  }

  function render(surface, panelState, container) {
    const rawState = panelState.repoVerifiedStatus || {};
    const renderState = JSON.stringify({ surface, rawState });
    if (container.dataset.renderState === renderState) return;
    container.dataset.renderState = renderState;
    container.innerHTML = `
      <div class="surface-stack">
        <div class="surface-header">
          <div class="surface-title">${surface.title}</div>
          <span class="surface-chip">${surface.statusChip}</span>
        </div>
        <div class="surface-meta-grid">
          <div><span class="muted">save tag</span> ${rawState.saveTag || "none"}</div>
          <div><span class="muted">trust</span> ${surface.trustLabel}</div>
          <div><span class="muted">verified head</span> ${rawState.verifiedHead || "none"}</div>
          <div><span class="muted">paths verified</span> ${Array.isArray(rawState.pathsVerified) ? rawState.pathsVerified.length : 0}</div>
        </div>
        <div class="surface-detail">${surface.detail}</div>
        <div class="surface-foot muted">Repo-verified state remains distinct from local apply markers.</div>
      </div>
    `;
  }

  function injectFinishStyles() {
    if (document.getElementById("terminal-shell-finish-style")) return;
    const style = document.createElement("style");
    style.id = "terminal-shell-finish-style";
    style.textContent = `
      :root {
        --text: #e6ebf2;
        --text-soft: #d9e0ea;
        --muted: #b0b8c8;
        --line: rgba(186, 156, 255, 0.24);
        --line-strong: rgba(104, 236, 247, 0.32);
      }

      body {
        color: var(--text);
      }

      .terminal-shell-v4 {
        display: flex !important;
        flex-direction: column;
        gap: 14px;
      }

      .terminal-header-shell { order: 0; }
      .terminal-main-shell { order: 1; }
      .terminal-footer-shell { order: 2; }
      .terminal-rail-shell { order: 3; }

      .terminal-header-shell,
      .terminal-main-shell,
      .terminal-footer-shell,
      .terminal-rail-shell,
      .terminal-dev-drawer {
        background:
          linear-gradient(135deg, rgba(255, 255, 255, 0.035), rgba(179, 140, 255, 0.06) 22%, rgba(88, 231, 243, 0.05) 58%, rgba(255, 255, 255, 0.02)),
          linear-gradient(180deg, rgba(22, 26, 38, 0.96), rgba(10, 13, 20, 0.985));
      }

      .terminal-shell-v4 {
        position: relative;
      }

      .terminal-header-shell,
      .terminal-footer-shell,
      .terminal-rail-shell,
      .terminal-dev-drawer {
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.04),
          0 10px 28px rgba(0, 0, 0, 0.18);
      }

      .terminal-main-shell {
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.04),
          0 12px 34px rgba(0, 0, 0, 0.24);
      }

      .terminal-path-line,
      .terminal-status-line,
      .control-legend,
      .terminal-rail-context,
      .terminal-rail-shell .label,
      .terminal-rail-shell .manifest-group-title,
      .terminal-rail-shell .muted,
      #runsViewport .muted {
        color: var(--muted) !important;
      }

      .chip-value,
      .terminal-rail-shell .surface-title,
      .terminal-header-controls button,
      .terminal-screen-tabs button,
      .control-pad-button {
        color: var(--text-soft) !important;
      }

      #runsViewport,
      .terminal-main-shell .panel,
      #runsViewport .surface-detail,
      #runsViewport .surface-foot,
      #runsViewport .surface-list-item,
      #runsViewport pre,
      #runsViewport .screen-copy {
        color: var(--text) !important;
      }

      #runsViewport {
        box-shadow:
          inset 0 0 0 1px rgba(186, 156, 255, 0.06),
          inset 0 0 26px rgba(104, 236, 247, 0.035),
          0 0 0 1px rgba(104, 236, 247, 0.14),
          0 0 18px rgba(104, 236, 247, 0.08) important;
      }

      .terminal-rail-shell {
        margin-top: 0;
      }

      @media (max-width: 1080px) {
        .terminal-shell-v4 {
          gap: 12px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function applyShellFinish() {
    injectFinishStyles();
    const shell = document.querySelector(".terminal-shell-v4");
    if (!shell) return;
    const header = shell.querySelector(".terminal-header-shell");
    const main = shell.querySelector(".terminal-main-shell");
    const footer = shell.querySelector(".terminal-footer-shell");
    const rail = shell.querySelector(".terminal-rail-shell");
    if (header && main && footer && rail) {
      if (shell.lastElementChild !== rail || main.nextElementSibling !== footer) {
        shell.append(header, main, footer, rail);
      }
    }
  }

  function getPackager() {
    return window.__TARS_PACKAGER__ || null;
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/^[^0-9a-z]+/g, "")
      .replace(/[^0-9a-z]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "untitled-pack";
  }

  function emitPackagerUpdate() {
    const packager = getPackager();
    if (!packager) return;
    window.dispatchEvent(new CustomEvent("tars:packager-updated", {
      detail: {
        draft: packager.draft,
        notice: packager.notice,
        selectedCatalogId: packager.selectedCatalogId,
        localCount: Array.isArray(packager.localPackages) ? packager.localPackages.length : 0,
        catalogError: packager.catalogError,
      },
    }));
  }

  function updatePackagerDraftField(field, value) {
    const packager = getPackager();
    if (!packager?.draft) return;
    const draft = packager.draft;
    draft.config = { ...(draft.config || {}), [field]: value };

    if (field === "family") {
      const family = FAMILY_OPTIONS.includes(value) ? value : "various";
      draft.config.family = family;
      draft.config.kind = KIND_BY_FAMILY[family] || draft.config.kind || "bundle";
      if (family !== "cartridges") {
        draft.config.runtime = null;
        draft.config.saveSlots = 0;
        draft.config.mountable = false;
      } else if (!draft.config.runtime) {
        draft.config.runtime = "text-adventure.v1";
        draft.config.saveSlots = draft.config.saveSlots ?? 3;
        draft.config.mountable = true;
      }
    }

    if (field === "slug") {
      draft.config.slug = slugify(value);
    }

    if (field === "title") {
      const currentSlug = String(draft.config.slug || "");
      if (!currentSlug || currentSlug === slugify(currentSlug)) {
        draft.config.slug = draft.config.slug || slugify(value);
      }
    }

    if (field === "runtime" && String(value || "").trim() === "") {
      draft.config.runtime = null;
    }

    if (field === "saveSlots") {
      const numeric = Number(value);
      draft.config.saveSlots = Number.isFinite(numeric) ? Math.max(0, Math.min(3, numeric)) : 0;
    }

    draft.updatedAt = new Date().toISOString();
    emitPackagerUpdate();
  }

  function isImportBayFieldId(id) {
    return /^(importBayFamily|importBayKind|importBayTitle|importBaySlug|importBayRuntime|importBaySaveSlots)$/.test(String(id || ""));
  }

  function fieldForImportBayId(id) {
    return {
      importBayFamily: "family",
      importBayKind: "kind",
      importBayTitle: "title",
      importBaySlug: "slug",
      importBayRuntime: "runtime",
      importBaySaveSlots: "saveSlots",
    }[id] || null;
  }

  function installImportBayCaretPatch() {
    if (window.__TARS_IMPORT_BAY_CARET_PATCHED__) {
      return;
    }
    window.__TARS_IMPORT_BAY_CARET_PATCHED__ = true;

    document.addEventListener("input", (event) => {
      const { target } = event;
      if (!isImportBayFieldId(target?.id)) return;
      const field = fieldForImportBayId(target.id);
      if (!field) return;
      updatePackagerDraftField(field, target.value);
      event.stopImmediatePropagation();
    }, true);

    document.addEventListener("change", (event) => {
      const { target } = event;
      if (!isImportBayFieldId(target?.id)) return;
      const field = fieldForImportBayId(target.id);
      if (!field) return;
      updatePackagerDraftField(field, target.value);
      setTimeout(() => emitPackagerUpdate(), 0);
      event.stopImmediatePropagation();
    }, true);

    document.addEventListener("focusout", (event) => {
      if (!isImportBayFieldId(event.target?.id)) return;
      setTimeout(() => emitPackagerUpdate(), 0);
    }, true);
  }

  function refresh() {
    applyShellFinish();
    installImportBayCaretPatch();
    const container = document.getElementById("repoVerifiedSummary");
    if (!container) return;
    const panelState = readPanelState();
    const rawState = panelState.repoVerifiedStatus || {};
    const surface = deriveSurface({
      status: rawState.status || "none",
      trusted: rawState.trusted === true,
      pathsCount: Array.isArray(rawState.pathsVerified) ? rawState.pathsVerified.length : 0,
    });
    render(surface, panelState, container);
  }

  async function boot() {
    runtime.contract = await loadJson("app/repo-verified-panel.v1.json");
    refresh();

    const preview = document.getElementById("repoVerifiedPreview");
    if (preview) {
      const observer = new MutationObserver(() => refresh());
      observer.observe(preview, { childList: true, subtree: true, characterData: true });
    }

    const shellHost = document.querySelector(".shell");
    if (shellHost) {
      const observer = new MutationObserver(() => applyShellFinish());
      observer.observe(shellHost, { childList: true, subtree: true });
    }

    window.addEventListener("tars:screen-changed", applyShellFinish);
    window.addEventListener("tars:devtools-changed", applyShellFinish);
    window.setInterval(refresh, 1500);
  }

  boot().catch(() => {});
})();
