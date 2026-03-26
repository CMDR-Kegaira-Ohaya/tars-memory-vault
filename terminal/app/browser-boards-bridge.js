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
  const packagerKey = "__TARS_PACKAGER__";
  const packager = window[packagerKey] || (window[packagerKey] = {
    draft: null,
    notice: "",
    returnScreen: "home",
    catalogIndex: null,
    catalogError: null,
    selectedCatalogId: null,
    localPackages: [],
    localHydrated: false,
  });

  const LOCAL_PACKAGES_STORAGE_KEY = "tars-local-packages.v1";
  const CUSTOM_SCREENS = new Set(["debug-intake", "import-bay", "collections-explorer"]);
  const SUPPORTED_TEXT_EXTENSIONS = new Set(["json", "md", "txt"]);
  const FAMILY_OPTIONS = ["cartridges", "books", "entertainment", "various"];
  const KIND_BY_FAMILY = {
    cartridges: "cartridge",
    books: "book",
    entertainment: "media-entry",
    various: "bundle",
  };

  function emit(eventName, detail = {}) {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

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
    emit("tars:debug-intake-updated", {
      payloadKind: debugIntake.payloadKind,
      sourceLabel: debugIntake.sourceLabel,
      updatedAt: debugIntake.updatedAt,
    });
  }

  function emitPackagerUpdate(extra = {}) {
    emit("tars:packager-updated", {
      draft: packager.draft,
      notice: packager.notice,
      selectedCatalogId: packager.selectedCatalogId,
      localCount: packager.localPackages.length,
      catalogError: packager.catalogError,
      ...extra,
    });
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

  function hydrateLocalPackages() {
    if (packager.localHydrated) return;
    packager.localHydrated = true;
    try {
      const raw = window.localStorage.getItem(LOCAL_PACKAGES_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      packager.localPackages = Array.isArray(parsed) ? parsed.filter((item) => item && item.catalogId && item.manifest) : [];
    } catch {
      packager.localPackages = [];
    }
  }

  function persistLocalPackages() {
    try {
      window.localStorage.setItem(LOCAL_PACKAGES_STORAGE_KEY, JSON.stringify(packager.localPackages));
    } catch {
      packager.notice = "local package storage unavailable";
    }
    emitPackagerUpdate();
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "untitled-pack";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
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
      emit("tars:devtools-changed", { mountedCartridge: devtools.mountedCartridge });
    }
    emit("tars:screen-changed", {
      activeScreen: screen,
      lastBaseScreen: screenUi.lastBaseScreen,
    });
  }

  function selectScreen(screen) {
    if (CUSTOM_SCREENS.has(screen)) {
      const current = getActiveScreen();
      if (current !== screen) {
        if (screen === "debug-intake") debugIntake.returnScreen = current || screenUi.lastBaseScreen || "home";
        if (screen === "import-bay") packager.returnScreen = current || screenUi.lastBaseScreen || "home";
        if (screen === "collections-explorer") packager.returnScreen = current || screenUi.lastBaseScreen || "home";
      }
      setScreen(screen);
      return;
    }
    setScreen(screen);
  }

  function closeDebugIntake() {
    setScreen(debugIntake.returnScreen || screenUi.lastBaseScreen || "home");
  }

  function closePackagerScreen() {
    setScreen(packager.returnScreen || screenUi.lastBaseScreen || "home");
  }

  async function copyTextToClipboard(text, successMessage, failureMessage) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return { ok: true, message: successMessage };
      }
      return { ok: false, message: "clipboard API unavailable" };
    } catch {
      return { ok: false, message: failureMessage };
    }
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
    const result = await copyTextToClipboard(text, "payload copied to clipboard", "clipboard copy failed");
    debugIntake.notice = result.message;
    emitDebugUpdate();
    renderDebugIntakeIfActive(true);
  }

  function removeLegacyTab() {
    document.getElementById("terminalScreenTab-debug-intake")?.remove();
  }

  function ensureActionButton(buttonId, label, onClick, isActive) {
    const actions = document.getElementById("actions");
    if (!actions) return null;
    let button = document.getElementById(buttonId);
    if (!button || button.parentElement !== actions) {
      button = document.createElement("button");
      button.id = buttonId;
      button.addEventListener("click", onClick);
      actions.appendChild(button);
    }
    button.disabled = false;
    button.removeAttribute("aria-disabled");
    button.dataset.actionKey = buttonId.replace(/^action-/, "");
    button.dataset.actionState = isActive ? "active" : "available";
    button.dataset.rawActionState = isActive ? "active" : "available";
    button.dataset.rawText = `${label} : ${isActive ? "active" : "available"}`;
    button.textContent = button.dataset.rawText;
    return button;
  }

  function ensureChrome() {
    ensureActionButton("action-debug-intake", "debug-intake", () => {
      if (getActiveScreen() === "debug-intake") closeDebugIntake();
      else selectScreen("debug-intake");
    }, getActiveScreen() === "debug-intake");

    ensureActionButton("action-import-bay", "import-bay", () => {
      if (getActiveScreen() === "import-bay") closePackagerScreen();
      else selectScreen("import-bay");
    }, getActiveScreen() === "import-bay");

    ensureActionButton("action-collections-explorer", "collections-explorer", () => {
      if (getActiveScreen() === "collections-explorer") closePackagerScreen();
      else selectScreen("collections-explorer");
    }, getActiveScreen() === "collections-explorer");

    removeLegacyTab();

    if (CUSTOM_SCREENS.has(getActiveScreen())) {
      const activeChip = document.querySelector(".terminal-active-screen");
      const pathLine = document.querySelector(".terminal-path-line");
      if (activeChip) {
        activeChip.textContent = {
          "debug-intake": "Debug Intake",
          "import-bay": "Import Bay",
          "collections-explorer": "Collections Explorer",
        }[getActiveScreen()] || "Terminal";
      }
      if (pathLine) {
        pathLine.textContent = {
          "debug-intake": "Home / Dev / Debug Intake",
          "import-bay": "Home / Collections / Import Bay",
          "collections-explorer": "Home / Collections / Explorer",
        }[getActiveScreen()] || "Home";
      }
    }
  }

  async function loadJson(path) {
    const response = await fetch(normalizeInput(path));
    if (!response.ok) throw new Error(`failed to load ${path}`);
    return response.json();
  }

  function readTextFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error(`failed to read ${file.name}`));
      reader.onload = () => resolve(String(reader.result || ""));
      reader.readAsText(file, "utf-8");
    });
  }

  function inferFamilyFromName(name) {
    const raw = String(name || "").toLowerCase();
    if (raw.includes("book")) return "books";
    if (raw.includes("cart") || raw.includes("game")) return "cartridges";
    if (raw.includes("movie") || raw.includes("show") || raw.includes("music")) return "entertainment";
    return "various";
  }

  function buildDraftFromFiles(files) {
    const supported = [];
    const skipped = [];
    for (const file of files) {
      const extension = String(file.name.split(".").pop() || "").toLowerCase();
      if (!SUPPORTED_TEXT_EXTENSIONS.has(extension)) {
        skipped.push({ name: file.name, reason: "unsupported-extension" });
      } else {
        supported.push({
          name: file.name,
          extension,
          text: file.text,
          chars: file.text.length,
          lines: file.text ? file.text.split("\n").length : 0,
        });
      }
    }
    if (!supported.length) return null;
    const first = supported[0];
    const firstStem = first.name.replace(/\.[^.]+$/, "");
    const family = inferFamilyFromName(first.name);
    const slug = slugify(firstStem);
    const title = firstStem.replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) || "Imported Pack";
    return {
      sourceLabel: supported.map((file) => file.name).join(", "),
      files: supported,
      skipped,
      config: {
        family,
        kind: KIND_BY_FAMILY[family],
        slug,
        title,
        runtime: family === "cartridges" ? "text-adventure.v1" : null,
        mountable: family === "cartridges",
        saveSlots: family === "cartridges" ? 3 : 0,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  function getDraftFieldValue(field, fallback = "") {
    return packager.draft?.config?.[field] ?? fallback;
  }

  function updateDraftConfig(field, value) {
    if (!packager.draft) return;
    packager.draft.config = { ...(packager.draft.config || {}), [field]: value };
    if (field === "family") {
      packager.draft.config.kind = KIND_BY_FAMILY[value] || packager.draft.config.kind || "bundle";
      if (value !== "cartridges") {
        packager.draft.config.runtime = null;
        packager.draft.config.mountable = false;
        packager.draft.config.saveSlots = 0;
      }
    }
    if (field === "slug") {
      packager.draft.config.slug = slugify(value);
    }
    if (field === "title" && !packager.draft.config.slug) {
      packager.draft.config.slug = slugify(value);
    }
    packager.draft.updatedAt = new Date().toISOString();
    emitPackagerUpdate();
  }

  function buildPackagePreview(draft) {
    if (!draft?.files?.length) return null;
    const family = FAMILY_OPTIONS.includes(draft.config?.family) ? draft.config.family : "various";
    const kind = draft.config?.kind || KIND_BY_FAMILY[family] || "bundle";
    const slug = slugify(draft.config?.slug || draft.config?.title || draft.files[0].name);
    const title = String(draft.config?.title || slug).trim() || slug;
    const runtime = family === "cartridges" ? (draft.config?.runtime || "text-adventure.v1") : null;
    const mountable = family === "cartridges" && Boolean(runtime);
    const saveSlots = mountable ? Math.max(0, Math.min(3, Number(draft.config?.saveSlots ?? 3) || 0)) : 0;
    const entryFile = draft.files[0];
    const entryName = entryFile.extension === "json" ? "index.json" : entryFile.extension === "md" ? "index.md" : "index.txt";
    const targetRoot = `collections/${family}/${slug}/`;
    const manifest = {
      schema: "tars-pack.v1",
      kind,
      family,
      id: slug,
      title,
      slug,
      entry: `content/${entryName}`,
      runtime,
      encoding: "utf-8",
      mountable,
    };
    if (saveSlots > 0) manifest.saveSlots = saveSlots;
    if (draft.config?.summary) manifest.summary = draft.config.summary;

    const files = [
      {
        path: `${targetRoot}manifest.json`,
        contentType: "application/json",
        content: JSON.stringify(manifest, null, 2) + "\n",
      },
      ...draft.files.map((file, index) => ({
        path: `${targetRoot}content/${index === 0 ? entryName : file.name}`,
        contentType: file.extension === "json" ? "application/json" : "text/plain",
        content: file.text,
      })),
    ];
    if (saveSlots > 0) {
      for (let slot = 1; slot <= saveSlots; slot += 1) {
        files.push({
          path: `${targetRoot}saves/slot-${slot}.json`,
          contentType: "application/json",
          content: JSON.stringify({ schema: "tars-save-slot.v1", slot, state: null }, null, 2) + "\n",
        });
      }
    }

    const saveRequest = {
      schema: "tars-collections-save-request.v1",
      generatedAt: new Date().toISOString(),
      source: "terminal-import-bay",
      targetRoot,
      manifest,
      files: files.map((file) => ({ path: file.path, contentType: file.contentType, content: file.content })),
    };

    return { targetRoot, manifest, files, saveRequest, config: { ...draft.config, family, kind, slug, title, runtime, mountable, saveSlots } };
  }

  function catalogEntryFromLocalStage(localStage) {
    return {
      catalogId: localStage.catalogId,
      source: "local-stage",
      family: localStage.manifest.family,
      kind: localStage.manifest.kind,
      title: localStage.manifest.title,
      slug: localStage.manifest.slug,
      summary: localStage.manifest.summary || "staged local package",
      manifestPath: null,
      entryPath: localStage.manifest.entry,
      mountable: localStage.manifest.mountable === true,
      manifest: localStage.manifest,
      previewText: localStage.previewText,
      saveRequest: localStage.saveRequest,
    };
  }

  function combinedCatalogEntries() {
    hydrateLocalPackages();
    const repoEntries = Array.isArray(packager.catalogIndex?.entries) ? packager.catalogIndex.entries.map((entry) => ({ ...entry, source: entry.source || "repo" })) : [];
    const localEntries = packager.localPackages.map(catalogEntryFromLocalStage);
    return [...localEntries, ...repoEntries];
  }

  function groupByFamily(entries) {
    const groups = new Map();
    for (const entry of entries) {
      const family = entry.family || "various";
      if (!groups.has(family)) groups.set(family, []);
      groups.get(family).push(entry);
    }
    return Array.from(groups.entries());
  }

  async function loadCatalogIndex(force = false) {
    if (packager.catalogIndex && !force) return packager.catalogIndex;
    try {
      packager.catalogIndex = await loadJson("../collections/index.v1.json");
      packager.catalogError = null;
    } catch (error) {
      packager.catalogIndex = { schema: "tars-collections-index.v1", entries: [], families: [] };
      packager.catalogError = error.message;
    }
    emitPackagerUpdate({ catalogEntries: packager.catalogIndex.entries?.length || 0, catalogError: packager.catalogError });
    return packager.catalogIndex;
  }

  function getSelectedCatalogEntry() {
    const entries = combinedCatalogEntries();
    return entries.find((entry) => entry.catalogId === packager.selectedCatalogId) || null;
  }

  async function ensureSelectedRepoEntryPreview(entry) {
    if (!entry || entry.source !== "repo") return entry;
    if (entry.previewText) return entry;
    try {
      const response = await fetch(entry.entryPath);
      entry.previewText = response.ok ? await response.text() : `failed to load ${entry.entryPath}`;
    } catch (error) {
      entry.previewText = `failed to load ${entry.entryPath}: ${error.message}`;
    }
    return entry;
  }

  async function stageCurrentDraft() {
    const preview = buildPackagePreview(packager.draft);
    if (!preview) {
      packager.notice = "no draft to stage";
      emitPackagerUpdate({ notice: packager.notice });
      renderImportBayIfActive(true);
      return;
    }
    hydrateLocalPackages();
    const catalogId = `local:${preview.manifest.family}:${preview.manifest.slug}`;
    const stagedEntry = {
      catalogId,
      manifest: preview.manifest,
      previewText: packager.draft.files.map((file) => `# ${file.name}\n\n${file.text}`).join("\n\n---\n\n"),
      saveRequest: preview.saveRequest,
    };
    packager.localPackages = [
      stagedEntry,
      ...packager.localPackages.filter((item) => item.catalogId !== catalogId),
    ];
    packager.selectedCatalogId = catalogId;
    packager.notice = `staged ${preview.manifest.slug} locally`;
    persistLocalPackages();
    renderImportBayIfActive(true);
    renderCollectionsExplorerIfActive(true);
  }

  async function copyCurrentSaveRequest() {
    const preview = buildPackagePreview(packager.draft);
    if (!preview) {
      packager.notice = "no save request to copy";
      emitPackagerUpdate({ notice: packager.notice });
      renderImportBayIfActive(true);
      return;
    }
    const result = await copyTextToClipboard(
      JSON.stringify(preview.saveRequest, null, 2),
      "save request copied to clipboard",
      "save request copy failed"
    );
    packager.notice = result.message;
    emitPackagerUpdate({ notice: packager.notice });
    renderImportBayIfActive(true);
  }

  async function downloadCurrentSaveRequest() {
    const preview = buildPackagePreview(packager.draft);
    if (!preview) {
      packager.notice = "no save request to download";
      emitPackagerUpdate({ notice: packager.notice });
      renderImportBayIfActive(true);
      return;
    }
    const blob = new Blob([JSON.stringify(preview.saveRequest, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `${preview.manifest.slug}-save-request.v1.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(href);
    packager.notice = "save request downloaded";
    emitPackagerUpdate({ notice: packager.notice });
    renderImportBayIfActive(true);
  }

  async function copySelectedSaveRequest() {
    const entry = getSelectedCatalogEntry();
    if (!entry?.saveRequest) {
      packager.notice = "selected entry has no local save request";
      emitPackagerUpdate({ notice: packager.notice });
      renderCollectionsExplorerIfActive(true);
      return;
    }
    const result = await copyTextToClipboard(
      JSON.stringify(entry.saveRequest, null, 2),
      "selected save request copied",
      "selected save request copy failed"
    );
    packager.notice = result.message;
    emitPackagerUpdate({ notice: packager.notice });
    renderCollectionsExplorerIfActive(true);
  }

  function removeSelectedLocalStage() {
    const entry = getSelectedCatalogEntry();
    if (!entry || entry.source !== "local-stage") {
      packager.notice = "selected entry is not a local stage";
      emitPackagerUpdate({ notice: packager.notice });
      renderCollectionsExplorerIfActive(true);
      return;
    }
    packager.localPackages = packager.localPackages.filter((item) => item.catalogId !== entry.catalogId);
    packager.selectedCatalogId = combinedCatalogEntries()[0]?.catalogId || null;
    packager.notice = `removed ${entry.slug} from local stage`;
    persistLocalPackages();
    renderCollectionsExplorerIfActive(true);
  }

  async function ingestFileList(fileList, sourceLabel) {
    const results = [];
    for (const file of Array.from(fileList || [])) {
      const extension = String(file.name.split(".").pop() || "").toLowerCase();
      if (!SUPPORTED_TEXT_EXTENSIONS.has(extension)) {
        results.push({ name: file.name, extension, text: null });
        continue;
      }
      const text = await readTextFromFile(file);
      results.push({ name: file.name, extension, text });
    }
    const draft = buildDraftFromFiles(results);
    packager.draft = draft;
    packager.notice = draft
      ? `loaded ${draft.files.length} supported file${draft.files.length === 1 ? "" : "s"}${draft.skipped.length ? `, skipped ${draft.skipped.length}` : ""}`
      : "no supported utf-8 json/md/txt files were imported";
    emitPackagerUpdate({ notice: packager.notice, draft });
    renderImportBayIfActive(true);
  }

  function familyOptionsHtml(selectedValue) {
    return FAMILY_OPTIONS.map((family) => `<option value="${family}"${family === selectedValue ? " selected" : ""}>${family}</option>`).join("");
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
    if (container.dataset.customScreenState === renderState) return;
    container.dataset.customScreenState = renderState;
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

  function renderImportBayIfActive(force = false) {
    ensureChrome();
    if (getActiveScreen() !== "import-bay") return;
    const container = document.getElementById("runsViewport");
    if (!container) return;
    if (!force && /^importBay/.test(document.activeElement?.id || "")) return;

    const preview = buildPackagePreview(packager.draft);
    const renderState = JSON.stringify({
      screen: "import-bay",
      draftUpdatedAt: packager.draft?.updatedAt || null,
      notice: packager.notice,
      selectedFamily: preview?.manifest?.family || null,
      selectedSlug: preview?.manifest?.slug || null,
      localCount: packager.localPackages.length,
    });
    if (container.dataset.customScreenState === renderState) return;
    container.dataset.customScreenState = renderState;
    container.dataset.rawText = preview ? JSON.stringify(preview.saveRequest, null, 2) : "";
    container.innerHTML = `
      <div class="surface-stack screen-context screen-context-dev">
        <div class="surface-header">
          <div class="surface-title">Import Bay</div>
          <span class="surface-chip">utf-8 json / md / txt</span>
        </div>
        <div class="surface-detail screen-copy">
          Import local files from desktop or phone, shape them into a canonical <code>tars-pack.v1</code> preview, and prepare a repo-ready <code>/collections/</code> save request.
        </div>
        <div class="surface-foot muted">
          Honest boundary: this screen stages locally and prepares a save request. It does not directly write into the repo from the browser.
        </div>
        ${packager.notice ? `<div class="surface-foot">${escapeHtml(packager.notice)}</div>` : ""}
        <div class="row">
          <button type="button" data-import-action="choose">Choose files</button>
          <button type="button" data-import-action="clear"${packager.draft ? "" : " disabled"}>Clear draft</button>
          <button type="button" data-import-action="stage"${preview ? "" : " disabled"}>Stage in local explorer</button>
          <button type="button" data-import-action="copy-request"${preview ? "" : " disabled"}>Copy save request</button>
          <button type="button" data-import-action="download-request"${preview ? "" : " disabled"}>Download request</button>
          <button type="button" data-import-action="open-explorer">Open explorer</button>
        </div>
        <input id="importBayFileInput" type="file" accept=".json,.md,.txt" multiple hidden />
        <div id="importBayDropZone" class="surface-list-item">
          <div>Drop utf-8 <strong>.json</strong>, <strong>.md</strong>, or <strong>.txt</strong> files here.</div>
          <div class="muted">v1 stays strict. Zip packs and binary assets are not browser-imported yet.</div>
        </div>
        <div class="surface-meta-grid">
          <div><span class="muted">source</span> ${escapeHtml(packager.draft?.sourceLabel || "none")}</div>
          <div><span class="muted">supported files</span> ${packager.draft?.files?.length || 0}</div>
          <div><span class="muted">skipped</span> ${packager.draft?.skipped?.length || 0}</div>
          <div><span class="muted">local staged</span> ${packager.localPackages.length}</div>
          <div><span class="muted">target root</span> ${escapeHtml(preview?.targetRoot || "none")}</div>
          <div><span class="muted">mountable</span> ${preview?.manifest?.mountable === true ? "true" : "false"}</div>
        </div>
        <div class="surface-list-item">
          <div class="label">package controls</div>
          <div class="surface-meta-grid">
            <label><span class="muted">family</span><br /><select id="importBayFamily">${familyOptionsHtml(getDraftFieldValue("family", preview?.config?.family || "various"))}</select></label>
            <label><span class="muted">kind</span><br /><input id="importBayKind" value="${escapeHtml(getDraftFieldValue("kind", preview?.config?.kind || ""))}" /></label>
            <label><span class="muted">title</span><br /><input id="importBayTitle" value="${escapeHtml(getDraftFieldValue("title", preview?.config?.title || ""))}" /></label>
            <label><span class="muted">slug</span><br /><input id="importBaySlug" value="${escapeHtml(getDraftFieldValue("slug", preview?.config?.slug || ""))}" /></label>
            <label><span class="muted">runtime</span><br /><input id="importBayRuntime" value="${escapeHtml(getDraftFieldValue("runtime", preview?.config?.runtime || ""))}" /></label>
            <label><span class="muted">save slots</span><br /><input id="importBaySaveSlots" type="number" min="0" max="3" value="${escapeHtml(String(getDraftFieldValue("saveSlots", preview?.config?.saveSlots || 0)))}" /></label>
          </div>
        </div>
        <div class="surface-list-item">
          <div class="label">draft files</div>
          ${packager.draft?.files?.length ? `
            <div class="surface-list">
              ${packager.draft.files.map((file) => `
                <div class="surface-list-item">
                  <div>${escapeHtml(file.name)}</div>
                  <div class="muted">${escapeHtml(file.extension)} • ${file.lines} lines • ${file.chars} chars</div>
                </div>
              `).join("")}
            </div>
          ` : `<div class="muted">No supported files loaded yet.</div>`}
          ${packager.draft?.skipped?.length ? `<div class="surface-foot warn">skipped: ${escapeHtml(packager.draft.skipped.map((file) => `${file.name} (${file.reason})`).join(", "))}</div>` : ""}
        </div>
        ${preview ? `
          <div class="surface-list-item">
            <div class="label">manifest preview</div>
            <pre>${escapeHtml(JSON.stringify(preview.manifest, null, 2))}</pre>
          </div>
          <div class="surface-list-item">
            <div class="label">repo-ready save request</div>
            <pre>${escapeHtml(JSON.stringify(preview.saveRequest, null, 2))}</pre>
          </div>
        ` : ""}
      </div>
    `;
  }

  async function renderCollectionsExplorerIfActive(force = false) {
    ensureChrome();
    if (getActiveScreen() !== "collections-explorer") return;
    const container = document.getElementById("runsViewport");
    if (!container) return;

    await loadCatalogIndex(false);
    const entries = combinedCatalogEntries();
    let selected = getSelectedCatalogEntry();
    if (!selected && entries[0]) {
      packager.selectedCatalogId = entries[0].catalogId;
      selected = entries[0];
    }
    if (selected?.source === "repo") {
      selected = await ensureSelectedRepoEntryPreview(selected);
    }

    const renderState = JSON.stringify({
      screen: "collections-explorer",
      entryCount: entries.length,
      selectedCatalogId: selected?.catalogId || null,
      notice: packager.notice,
      catalogError: packager.catalogError,
    });
    if (!force && container.dataset.customScreenState === renderState) return;
    container.dataset.customScreenState = renderState;
    container.dataset.rawText = selected?.saveRequest ? JSON.stringify(selected.saveRequest, null, 2) : (selected?.previewText || "");

    const groupsHtml = entries.length
      ? groupByFamily(entries).map(([family, familyEntries]) => `
          <div class="manifest-group">
            <div class="manifest-group-title">${escapeHtml(family)}</div>
            ${familyEntries.map((entry) => `
              <button type="button" class="manifest-entry"${entry.catalogId === selected?.catalogId ? ' data-selected="true"' : ""} data-catalog-select="${escapeHtml(entry.catalogId)}">
                <div class="surface-header">
                  <div class="surface-title">${escapeHtml(entry.title || entry.slug || entry.catalogId)}</div>
                  <span class="surface-chip">${escapeHtml(entry.source || "repo")}</span>
                </div>
                <div class="manifest-entry-meta">
                  <span>${escapeHtml(entry.kind || "unknown")}</span>
                  <span>${entry.mountable === true ? "mountable" : "browse-only"}</span>
                  <span>${escapeHtml(entry.slug || "none")}</span>
                </div>
                <div class="surface-foot muted">${escapeHtml(entry.summary || entry.entryPath || entry.targetRoot || "no summary")}</div>
              </button>
            `).join("")}
          </div>
        `).join("")
      : `<div class="surface-foot muted">No repo or local collection entries are available yet.</div>`;

    const selectedManifest = selected?.manifest || null;
    container.innerHTML = `
      <div class="surface-stack screen-context">
        <div class="surface-header">
          <div class="surface-title">Collections Explorer</div>
          <span class="surface-chip">${entries.length} indexed</span>
        </div>
        <div class="surface-detail screen-copy">
          Browse the repo catalogue under <code>/collections/</code> and compare it with locally staged imports before any repo-authenticated save path exists.
        </div>
        ${packager.catalogError ? `<div class="surface-foot warn">catalog index load warning: ${escapeHtml(packager.catalogError)}</div>` : ""}
        ${packager.notice ? `<div class="surface-foot">${escapeHtml(packager.notice)}</div>` : ""}
        <div class="row">
          <button type="button" data-explorer-action="refresh">Refresh catalogue</button>
          <button type="button" data-explorer-action="open-import">Open import bay</button>
          <button type="button" data-explorer-action="copy-selected-request"${selected?.saveRequest ? "" : " disabled"}>Copy selected request</button>
          <button type="button" data-explorer-action="remove-selected"${selected?.source === "local-stage" ? "" : " disabled"}>Remove local stage</button>
        </div>
        <div class="surface-list-item">
          <div class="label">catalogue rail</div>
          <div class="surface-list">${groupsHtml}</div>
        </div>
        <div class="surface-list-item">
          <div class="label">selected preview</div>
          ${selected ? `
            <div class="surface-meta-grid">
              <div><span class="muted">title</span> ${escapeHtml(selected.title || "none")}</div>
              <div><span class="muted">family</span> ${escapeHtml(selected.family || "various")}</div>
              <div><span class="muted">kind</span> ${escapeHtml(selected.kind || "unknown")}</div>
              <div><span class="muted">source</span> ${escapeHtml(selected.source || "repo")}</div>
              <div><span class="muted">slug</span> ${escapeHtml(selected.slug || "none")}</div>
              <div><span class="muted">mountable</span> ${selected.mountable === true ? "true" : "false"}</div>
              <div><span class="muted">entry path</span> ${escapeHtml(selected.entryPath || selectedManifest?.entry || "none")}</div>
              <div><span class="muted">manifest path</span> ${escapeHtml(selected.manifestPath || "local-stage")}</div>
            </div>
            <div class="surface-foot muted">${escapeHtml(selected.summary || "no summary")}</div>
            ${selectedManifest ? `<pre>${escapeHtml(JSON.stringify(selectedManifest, null, 2))}</pre>` : ""}
            <pre>${escapeHtml(selected.previewText || "no preview text loaded")}</pre>
            ${selected.saveRequest ? `<div class="surface-foot muted">selected entry includes a local repo-ready save request envelope</div>` : ""}
          ` : `<div class="muted">No collection entry selected.</div>`}
        </div>
      </div>
    `;
  }

  ensureApplyButtonIdAlias();
  hydrateLocalPackages();

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
    const debugAction = event.target.closest("[data-debug-intake-action]");
    if (debugAction) {
      const action = debugAction.dataset.debugIntakeAction;
      if (action === "capture") {
        updatePayload(JSON.stringify(buildTerminalSnapshot(), null, 2), "live-terminal-snapshot", "captured current terminal state");
        renderDebugIntakeIfActive(true);
      } else if (action === "copy") {
        await copyPayload();
      } else if (action === "clear") {
        updatePayload("", "cleared", "");
        renderDebugIntakeIfActive(true);
      } else if (action === "back") {
        closeDebugIntake();
      }
      return;
    }

    const importAction = event.target.closest("[data-import-action]");
    if (importAction) {
      const action = importAction.dataset.importAction;
      if (action === "choose") {
        document.getElementById("importBayFileInput")?.click();
      } else if (action === "clear") {
        packager.draft = null;
        packager.notice = "draft cleared";
        emitPackagerUpdate({ notice: packager.notice });
        renderImportBayIfActive(true);
      } else if (action === "stage") {
        await stageCurrentDraft();
      } else if (action === "copy-request") {
        await copyCurrentSaveRequest();
      } else if (action === "download-request") {
        await downloadCurrentSaveRequest();
      } else if (action === "open-explorer") {
        selectScreen("collections-explorer");
      }
      return;
    }

    const explorerAction = event.target.closest("[data-explorer-action]");
    if (explorerAction) {
      const action = explorerAction.dataset.explorerAction;
      if (action === "refresh") {
        await loadCatalogIndex(true);
        renderCollectionsExplorerIfActive(true);
      } else if (action === "open-import") {
        selectScreen("import-bay");
      } else if (action === "copy-selected-request") {
        await copySelectedSaveRequest();
      } else if (action === "remove-selected") {
        removeSelectedLocalStage();
      }
      return;
    }

    const catalogSelect = event.target.closest("[data-catalog-select]");
    if (catalogSelect) {
      packager.selectedCatalogId = catalogSelect.dataset.catalogSelect;
      emitPackagerUpdate({ selectedCatalogId: packager.selectedCatalogId });
      renderCollectionsExplorerIfActive(true);
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target.id === "debugIntakeEditor") {
      updatePayload(event.target.value, "manual-edit", "");
      return;
    }
    if (event.target.id === "importBayFamily") {
      updateDraftConfig("family", event.target.value);
      renderImportBayIfActive(true);
      return;
    }
    if (event.target.id === "importBayKind") {
      updateDraftConfig("kind", event.target.value.trim());
      renderImportBayIfActive(true);
      return;
    }
    if (event.target.id === "importBayTitle") {
      updateDraftConfig("title", event.target.value);
      renderImportBayIfActive(true);
      return;
    }
    if (event.target.id === "importBaySlug") {
      updateDraftConfig("slug", event.target.value);
      renderImportBayIfActive(true);
      return;
    }
    if (event.target.id === "importBayRuntime") {
      updateDraftConfig("runtime", event.target.value.trim() || null);
      renderImportBayIfActive(true);
      return;
    }
    if (event.target.id === "importBaySaveSlots") {
      updateDraftConfig("saveSlots", event.target.value);
      renderImportBayIfActive(true);
    }
  });

  document.addEventListener("change", async (event) => {
    if (event.target.id === "importBayFileInput") {
      await ingestFileList(event.target.files, "chooser");
      event.target.value = "";
    }
  });

  document.addEventListener("dragover", (event) => {
    const activeScreen = getActiveScreen();
    if (activeScreen === "debug-intake" && event.target.closest("#debugIntakeDropZone, #runsViewport")) {
      event.preventDefault();
      return;
    }
    if (activeScreen === "import-bay" && event.target.closest("#importBayDropZone, #runsViewport")) {
      event.preventDefault();
    }
  });

  document.addEventListener("drop", async (event) => {
    const activeScreen = getActiveScreen();
    if (activeScreen === "debug-intake" && event.target.closest("#debugIntakeDropZone, #runsViewport")) {
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
      return;
    }

    if (activeScreen === "import-bay" && event.target.closest("#importBayDropZone, #runsViewport")) {
      event.preventDefault();
      const files = Array.from(event.dataTransfer?.files || []);
      if (files.length) {
        await ingestFileList(files, "drop");
      }
    }
  });

  window.addEventListener("DOMContentLoaded", async () => {
    ensureChrome();
    await loadCatalogIndex(false);
    renderDebugIntakeIfActive(true);
    renderImportBayIfActive(true);
    renderCollectionsExplorerIfActive(true);
  }, { once: true });

  [
    "tars:screen-changed",
    "tars:debug-intake-updated",
    "tars:packager-updated",
    "tars:request-history-updated",
    "tars:repo-verified-updated",
    "tars:devtools-changed",
  ].forEach((eventName) => window.addEventListener(eventName, () => {
    ensureChrome();
    renderDebugIntakeIfActive(false);
    renderImportBayIfActive(false);
    renderCollectionsExplorerIfActive(false);
  }));
})();
