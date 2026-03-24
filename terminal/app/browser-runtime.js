(() => {
  const MODE_LABELS = ["home", "collections", "boards", "cartridges", "runs", "saves", "system"];
  const ACTION_KEYS = ["save", "exportSource", "exportOutput", "notes", "bookmarks"];

  const state = {
    initialState: null,
    session: null,
    manifestIndex: null,
    boardEnumeration: null,
    saveSlotIndex: null,
    contracts: {},
    notesDoc: { items: [] },
    repoVerifiedResponse: null,
    sessionDraft: {
      bookmarks: []
    },
    noteEditor: {
      enabled: false,
      targetPath: null,
      draftText: "",
      selectedNoteId: null,
      status: "disabled",
      payloadPreview: "{}"
    },
    saveWriteBridge: {
      enabled: false,
      status: "disabled",
      targetRoot: null,
      requestPreview: "{}"
    },
    applyRequestMarker: {
      consentGranted: false,
      markerStatus: "staged-only",
      targetSaveTag: null
    },
    applySaveStatus: {
      consentRequired: true,
      consentGranted: false,
      status: "disabled",
      statusDetail: "no-staged-request",
      handoffTarget: "none",
      repoHandlerTarget: "none",
      verificationRequired: false
    },
    repoVerifiedStatus: {
      consumed: false,
      status: "none",
      detail: "no-repo-verified-handler-response-loaded",
      saveTag: null,
      verifiedHead: "none",
      pathsVerified: [],
      trusted: false
    }
  };

  function normalizePath(path) {
    return String(path || "").replace(/^terminal\//, "");
  }

  async function loadJson(path) {
    const response = await fetch(normalizePath(path));
    if (!response.ok) {
      throw new Error(`failed to load ${path}`);
    }
    return response.json();
  }

  async function loadOptionalJson(path) {
    const response = await fetch(normalizePath(path));
    if (!response.ok) {
      return null;
    }
    return response.json();
  }

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function getFieldValue(source, key) {
    if (key === "pathPrefix" || key === "pathSuffix") {
      return source.sourcePath || "";
    }
    return source[key];
  }

  function matchExpected(expected, actual) {
    if (expected === null) return actual == null;
    if (Array.isArray(expected)) return expected.includes(actual);
    if (typeof expected === "string") {
      if (expected === "non-null") return actual != null;
      if (expected === "from-marker-consent") return state.applyRequestMarker.consentGranted;
      if (expected.includes("|")) return expected.split("|").includes(String(actual));
      return String(actual) === expected;
    }
    return actual === expected;
  }

  function matches(match, source) {
    return Object.entries(match || {}).every(([key, expected]) => {
      const actual = getFieldValue(source, key);
      if (key === "pathPrefix") return String(actual).startsWith(String(expected));
      if (key === "pathSuffix") return String(actual).endsWith(String(expected));
      return matchExpected(expected, actual);
    });
  }

  function resolveRule(rules, source) {
    for (const rule of rules || []) {
      if (matches(rule.match || {}, source)) return rule.resolve || null;
    }
    return null;
  }

  function resolveToken(token, session, path) {
    const key = path[path.length - 1];
    switch (token) {
      case "from-current-mode":
        return String(session.currentMode || "home").toUpperCase();
      case "live-source-path":
        return session.sourcePath || "live-source-path";
      case "mounted-source-path":
        return session.sourcePath || "mounted-source-path";
      case "from-session-state":
        return session.state || "mounted";
      case "derived-renderer":
        return session.renderer || (session.sourceClass === "repo-board" ? "markdown-reader" : "unresolved");
      case "resolved-renderer":
        return session.renderer || "unresolved";
      case "resolved-renderer-or-none":
        return session.renderer || "none";
      case "derived-engine-or-none":
      case "resolved-engine":
        return session.engine || "none";
      case "from-action-state":
        if (key === "notesState") return session.actionState?.notes || "disabled";
        return session.actionState?.[key] || "disabled";
      case "from-mounted-viewport":
        return session.mountedViewport?.displayMode || "idle-placeholder";
      case "from-save-slot-index-if-present":
        return state.saveSlotIndex?.entries?.length ? state.saveSlotIndex.entries[0].saveTag : "none";
      case "matching-save-tag-or-latest-related-save":
        return session.saveTag || state.saveSlotIndex?.entries?.[0]?.saveTag || "none";
      case "apply-save-request-contract":
        return state.contracts.applySaveRequest?.id || "terminal-apply-save-request-v1";
      case "repo-save-write-handler-contract":
        return state.contracts.repoSaveWriteHandler?.id || "terminal-repo-save-write-handler-v1";
      case "from-current-save-tag":
        return state.session?.saveTag || null;
      case "from-verified-response-head":
        return state.repoVerifiedResponse?.verification?.head || "none";
      case "from-verified-response-paths":
        return state.repoVerifiedResponse?.verification?.pathsVerified || [];
      case "none":
        return "none";
      default:
        return token;
    }
  }

  function resolveTemplate(value, session, path = []) {
    if (Array.isArray(value)) return value.map((item, index) => resolveTemplate(item, session, path.concat(index)));
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, nested]) => [key, resolveTemplate(nested, session, path.concat(key))])
      );
    }
    if (typeof value === "string") return resolveToken(value, session, path);
    return value;
  }

  function deriveFromContract(contract, session) {
    const states = contract?.states || {};
    for (const stateConfig of Object.values(states)) {
      if (matches(stateConfig.match || {}, session)) {
        return resolveTemplate(stateConfig.derive || {}, session);
      }
    }
    return {};
  }

  function findSaveSlotByTag(tag) {
    return (state.saveSlotIndex?.entries || []).find((entry) => entry.saveTag === tag) || null;
  }

  function syncSaveSlotMetadata() {
    const tag = state.session?.saveTag;
    if (!tag) return;
    const slot = findSaveSlotByTag(tag);
    if (!slot) return;
    slot.notesCount = state.notesDoc.items.length;
    slot.updatedAt = new Date().toISOString();
  }

  async function loadVerifiedResponseForSaveTag(saveTag) {
    if (!saveTag) {
      state.repoVerifiedResponse = null;
      return;
    }
    state.repoVerifiedResponse = await loadOptionalJson(`saves/${saveTag}/repo-write-response.v1.json`);
  }

  function refreshNoteEditorState() {
    const eligible = Boolean(
      state.session?.mountedKind === "cartridge" &&
      state.session?.saveTag &&
      state.session?.sourceClass !== "repo-board"
    );

    state.noteEditor.enabled = eligible;
    state.noteEditor.targetPath = eligible ? `terminal/saves/${state.session.saveTag}/notes.json` : null;
    state.noteEditor.status = eligible ? "staged-client-side" : "disabled";
    state.noteEditor.payloadPreview = JSON.stringify(state.notesDoc, null, 2);

    if (!eligible) {
      state.noteEditor.draftText = "";
      state.noteEditor.selectedNoteId = null;
      return;
    }

    const selected = state.notesDoc.items.find((item) => item.id === state.noteEditor.selectedNoteId) || state.notesDoc.items[0] || null;
    if (selected) {
      state.noteEditor.selectedNoteId = selected.id;
      state.noteEditor.draftText = selected.text;
    }
  }

  function buildSaveWriteRequest() {
    const eligible = Boolean(
      state.session?.mountedKind === "cartridge" &&
      state.session?.saveTag &&
      state.session?.sourceClass !== "repo-board"
    );

    if (!eligible) {
      return {
        enabled: false,
        status: "disabled",
        targetRoot: null,
        requestPreview: JSON.stringify({}, null, 2)
      };
    }

    const bridge = state.contracts.browserSaveWriteBridge || {};
    const applyRequest = state.contracts.applySaveRequest || {};
    const handler = state.contracts.repoSaveWriteHandler || {};
    const saveTag = state.session.saveTag;
    const root = `terminal/saves/${saveTag}/`;
    const timestamp = new Date().toISOString();
    const request = {
      bridgeId: bridge.id || "terminal-browser-save-write-bridge-v1",
      applyRequestId: applyRequest.id || "terminal-apply-save-request-v1",
      handlerId: handler.id || "terminal-repo-save-write-handler-v1",
      mode: bridge.stagingMode || "client-staged-write-request-only",
      consentRequired: bridge.handoff?.requiresExplicitRepoWriteConsent !== false,
      handoffTarget: bridge.handoff?.target || "terminal/app/apply-save-request.v1.json",
      repoHandlerTarget: applyRequest.handoff?.target || handler.id || "terminal/app/repo-save-write-handler.v1.json",
      saveTag,
      writeRoot: root,
      sourceClass: state.session.sourceClass,
      mountedId: state.session.mountedId,
      manifestId: state.session.manifestId || null,
      coverage: {
        bookmarks: "tracked-from-runtime-or-partial"
      },
      writes: [
        {
          kind: "state",
          path: `${root}state.json`,
          payload: {
            mountedId: state.session.mountedId,
            sourcePath: state.session.sourcePath,
            sourceClass: state.session.sourceClass,
            renderer: state.session.renderer,
            updatedAt: timestamp
          }
        },
        {
          kind: "session",
          path: `${root}session.json`,
          payload: {
            page: state.session.interaction?.page ?? null,
            scroll: state.session.interaction?.scroll ?? null,
            bookmarks: state.sessionDraft.bookmarks || [],
            runtimeSession: state.session.interaction?.runtimeSession ?? null
          }
        },
        {
          kind: "notes",
          path: `${root}notes.json`,
          payload: state.notesDoc
        }
      ]
    };

    return {
      enabled: true,
      status: "staged-awaiting-explicit-consent",
      targetRoot: root,
      requestPreview: JSON.stringify(request, null, 2)
    };
  }

  function refreshSaveWriteBridgeState() {
    state.saveWriteBridge = buildSaveWriteRequest();
    const nextTarget = state.saveWriteBridge.enabled ? state.session?.saveTag || null : null;
    if (!state.saveWriteBridge.enabled) {
      state.applyRequestMarker = {
        consentGranted: false,
        markerStatus: "staged-only",
        targetSaveTag: null
      };
      return;
    }
    if (state.applyRequestMarker.targetSaveTag !== nextTarget) {
      state.applyRequestMarker = {
        consentGranted: false,
        markerStatus: "staged-only",
        targetSaveTag: nextTarget
      };
    }
  }

  function refreshApplySaveStatus() {
    state.applySaveStatus = deriveFromContract(state.contracts.applySaveStatus, {
      requestEnabled: state.saveWriteBridge.enabled,
      consentGranted: state.applyRequestMarker.consentGranted,
      markerStatus: state.saveWriteBridge.enabled ? state.applyRequestMarker.markerStatus : "disabled",
      saveTag: state.session?.saveTag || null,
      writeRoot: state.saveWriteBridge.targetRoot
    });
  }

  function refreshRepoVerifiedStatus() {
    state.repoVerifiedStatus = deriveFromContract(state.contracts.repoVerifiedSaveStatus, {
      responseLoaded: Boolean(state.repoVerifiedResponse),
      responseStatus: state.repoVerifiedResponse?.status || null,
      verificationHead: state.repoVerifiedResponse?.verification?.head || null,
      verifiedPaths: (state.repoVerifiedResponse?.verification?.pathsVerified || []).length ? "present" : "empty",
      currentSaveTag: state.session?.saveTag || null
    });
  }

  function refreshDerivedState() {
    state.session.actionState = deriveFromContract(state.contracts.actionState, state.session);
    state.session.statusStrip = deriveFromContract(state.contracts.statusStrip, state.session);
    state.session.mountedViewport = deriveFromContract(state.contracts.mountedViewport, state.session);
    state.session.homeSummary = deriveFromContract(state.contracts.homeSummary, state.session);
    refreshNoteEditorState();
    refreshSaveWriteBridgeState();
    refreshApplySaveStatus();
    refreshRepoVerifiedStatus();
  }

  function render() {
    document.getElementById("statusStrip").textContent = formatStatus(state.session.statusStrip);
    renderNav();
    renderActions();
    renderSaveSlots();
    renderHomeSummary();
    renderViewport();
    renderNotes();
    renderSaveWriteBridge();
    renderApplySaveStatus();
    renderRepoVerifiedStatus();
  }

  function setSessionPatch(patch) {
    Object.assign(state.session, patch);
    refreshDerivedState();
    render();
  }

  async function loadNotesForSaveTag(saveTag) {
    if (!saveTag) {
      state.notesDoc = { items: [] };
      return;
    }
    const notesJson = await loadOptionalJson(`saves/${saveTag}/notes.json`);
    state.notesDoc = notesJson || { items: [] };
  }

  async function mountExampleCartridge() {
    const entry = state.manifestIndex?.entries?.[0];
    if (!entry) return;

    const manifest = await loadJson(entry.manifestPath);
    const modeResolved = resolveRule(state.contracts.modeResolver?.rules, {
      requestedMode: "collections",
      sourceOrigin: "repo",
      sourcePath: manifest.entry,
    }) || {};
    const rendererResolved = resolveRule(state.contracts.rendererSelection?.rules, {
      mountedKind: "cartridge",
      sourceClass: "repo-cartridge",
      sourcePath: manifest.entry,
      declaredType: manifest.type,
      rendererHint: manifest.renderer,
    }) || {};

    const renderer = rendererResolved.renderer === "hint-if-allowed"
      ? manifest.renderer
      : rendererResolved.renderer || manifest.renderer || null;

    const saveTag = manifest.save?.tag || manifest.id;
    await loadNotesForSaveTag(saveTag);
    await loadVerifiedResponseForSaveTag(saveTag);
    state.sessionDraft.bookmarks = [];

    setSessionPatch({
      currentMode: "collections",
      mountedId: manifest.id,
      mountedKind: "cartridge",
      sourcePath: manifest.entry,
      sourceClass: "repo-cartridge",
      renderer,
      engine: null,
      saveTag,
      save: modeResolved.save || (manifest.save?.enabled ? "conditional" : "disabled"),
      exportSource: modeResolved.exportSource || "conditional",
      exportOutput: modeResolved.exportOutput || "placeholder",
      state: "mounted",
      interaction: {
        page: null,
        scroll: null,
        notes: state.notesDoc.items.length > 0,
        runtimeSession: null,
      },
    });
  }

  async function mountLiveBoard() {
    const entry = state.boardEnumeration?.entries?.[0];
    if (!entry) return;

    const rendererResolved = resolveRule(state.contracts.rendererSelection?.rules, {
      mountedKind: "board",
      sourceClass: "repo-board",
      sourcePath: entry.sourcePath,
      declaredType: "markdown",
      rendererHint: null,
    }) || {};

    const boardsMode = state.contracts.boardsMode || {};
    state.notesDoc = { items: [] };
    state.repoVerifiedResponse = null;
    state.sessionDraft.bookmarks = [];

    setSessionPatch({
      currentMode: "boards",
      mountedId: entry.boardId,
      mountedKind: "board",
      sourcePath: entry.sourcePath,
      sourceClass: "repo-board",
      renderer: rendererResolved.renderer || "markdown-reader",
      engine: null,
      saveTag: null,
      save: boardsMode.actions?.save?.status || "disabled",
      exportSource: boardsMode.actions?.exportSource?.status || "enabled",
      exportOutput: boardsMode.actions?.exportOutput?.status || "placeholder-disabled",
      state: boardsMode.runtimeState?.stateLabel || "read-only-live-board",
      interaction: {
        page: null,
        scroll: null,
        notes: false,
        runtimeSession: null,
      },
    });
  }

  async function resumeFromSaveSlot(slot) {
    const requirements = state.contracts.resumeState?.fileExpectations || {};
    const stateJson = await loadJson(`saves/${slot.saveTag}/state.json`);
    const sessionJson = await loadJson(`saves/${slot.saveTag}/session.json`);
    const notesJson = await loadOptionalJson(`saves/${slot.saveTag}/notes.json`);

    if (requirements.state === "required" && !stateJson) {
      throw new Error(`missing required state.json for ${slot.saveTag}`);
    }
    if (requirements.session === "required" && !sessionJson) {
      throw new Error(`missing required session.json for ${slot.saveTag}`);
    }

    state.notesDoc = notesJson || { items: [] };
    await loadVerifiedResponseForSaveTag(slot.saveTag);
    state.sessionDraft.bookmarks = sessionJson.bookmarks || [];

    setSessionPatch({
      currentMode: "runs",
      mountedId: stateJson.mountedId || slot.mountedId,
      mountedKind: "cartridge",
      manifestId: slot.manifestId || null,
      sourcePath: stateJson.sourcePath || slot.sourcePath,
      sourceClass: stateJson.sourceClass || slot.sourceClass,
      renderer: stateJson.renderer || slot.renderer || "unresolved",
      engine: null,
      saveTag: slot.saveTag,
      save: "conditional",
      exportSource: "conditional",
      exportOutput: "placeholder",
      state: sessionJson.runtimeSession ? "running" : "mounted",
      interaction: {
        page: sessionJson.page ?? null,
        scroll: sessionJson.scroll ?? null,
        notes: state.notesDoc.items.length > 0,
        runtimeSession: sessionJson.runtimeSession ?? null,
      },
    });
  }

  function clearMount() {
    state.session = clone(state.initialState);
    state.notesDoc = { items: [] };
    state.repoVerifiedResponse = null;
    state.sessionDraft.bookmarks = [];
    refreshDerivedState();
    render();
  }

  function switchMode(mode) {
    state.session.currentMode = mode;
    refreshDerivedState();
    render();
  }

  function onDraftInput(event) {
    state.noteEditor.draftText = event.target.value;
  }

  function saveDraftNote() {
    if (!state.noteEditor.enabled || !state.session.saveTag) return;
    const text = state.noteEditor.draftText.trim();
    if (!text) return;

    const existing = state.notesDoc.items.find((item) => item.id === state.noteEditor.selectedNoteId) || null;
    const now = new Date().toISOString();
    const payload = existing || {
      id: `note-${String(state.notesDoc.items.length + 1).padStart(3, "0")}`,
      at: {
        page: state.session.interaction?.page ?? null,
        scroll: state.session.interaction?.scroll ?? null,
      },
      text: "",
      createdAt: now,
      updatedAt: now,
    };

    payload.text = text;
    payload.updatedAt = now;

    if (!existing) {
      state.notesDoc.items.push(payload);
    }

    state.noteEditor.selectedNoteId = payload.id;
    state.session.interaction.notes = state.notesDoc.items.length > 0;
    syncSaveSlotMetadata();
    refreshDerivedState();
    render();
  }

  function selectNote(noteId) {
    const note = state.notesDoc.items.find((item) => item.id === noteId);
    if (!note) return;
    state.noteEditor.selectedNoteId = note.id;
    state.noteEditor.draftText = note.text;
    renderNotes();
  }

  function onConsentToggle(event) {
    state.applyRequestMarker.consentGranted = event.target.checked;
    if (!event.target.checked && ["awaiting-consent", "handed-off"].includes(state.applyRequestMarker.markerStatus)) {
      state.applyRequestMarker.markerStatus = "staged-only";
    }
    refreshDerivedState();
    render();
  }

  function requestApply() {
    if (!state.saveWriteBridge.enabled) return;
    state.applyRequestMarker.markerStatus = state.applyRequestMarker.consentGranted ? "handed-off" : "awaiting-consent";
    refreshDerivedState();
    render();
  }

  function markApplied() {
    if (!state.saveWriteBridge.enabled || !state.applyRequestMarker.consentGranted) return;
    state.applyRequestMarker.markerStatus = "applied";
    refreshDerivedState();
    render();
  }

  function markRejected() {
    if (!state.saveWriteBridge.enabled) return;
    state.applyRequestMarker.markerStatus = "rejected";
    refreshDerivedState();
    render();
  }

  function resetApplyStatus() {
    state.applyRequestMarker.markerStatus = "staged-only";
    refreshDerivedState();
    render();
  }

  function formatStatus(strip) {
    return [
      `MODE: ${strip.mode || "HOME"}`,
      `SOURCE: ${strip.source || "none"}`,
      `MOUNT: ${strip.mountedKind || "none"}`,
      `STATE: ${strip.state || "idle"}`,
      `RENDERER: ${strip.renderer || "none"}`,
      `ENGINE: ${strip.engine || "none"}`,
      `SAVE: ${strip.save || "disabled"}`,
      `EXPORT SOURCE: ${strip.exportSource || "disabled"}`,
      `EXPORT OUTPUT: ${strip.exportOutput || "placeholder-disabled"}`,
    ].join("\n");
  }

  function renderNav() {
    const nav = document.getElementById("nav");
    nav.innerHTML = "";
    for (const mode of MODE_LABELS) {
      const button = document.createElement("button");
      button.textContent = mode.toUpperCase();
      if (state.session.currentMode === mode) button.style.borderColor = "#7dd3fc";
      button.addEventListener("click", () => switchMode(mode));
      nav.appendChild(button);
    }
  }

  function renderActions() {
    const container = document.getElementById("actions");
    container.innerHTML = "";
    for (const key of ACTION_KEYS) {
      const value = state.session.actionState?.[key] || "disabled";
      const button = document.createElement("button");
      button.textContent = `${key} : ${value}`;
      button.disabled = value.includes("disabled") || value.includes("placeholder");
      container.appendChild(button);
    }
  }

  function renderSaveSlots() {
    const container = document.getElementById("saveSlots");
    container.innerHTML = "";
    const entries = state.saveSlotIndex?.entries || [];
    if (!entries.length) {
      const span = document.createElement("span");
      span.className = "muted";
      span.textContent = "no save slots";
      container.appendChild(span);
      return;
    }
    for (const slot of entries) {
      const button = document.createElement("button");
      const notes = slot.notesCount ?? 0;
      const bookmarks = slot.bookmarksCount ?? 0;
      button.textContent = `resume ${slot.saveTag} (${notes}n/${bookmarks}b)`;
      button.addEventListener("click", () => {
        resumeFromSaveSlot(slot).catch(showBootError);
      });
      container.appendChild(button);
    }
  }

  function renderHomeSummary() {
    const home = state.session.homeSummary;
    document.getElementById("homeSummary").innerHTML = [
      `<div><span class="muted">mode</span> ${home.mode}</div>`,
      `<div><span class="muted">current mount</span> ${home.currentMount}</div>`,
      `<div><span class="muted">recent save</span> ${home.recentSave}</div>`,
      `<div><span class="muted">save</span> ${home.currentAvailability.save}</div>`,
      `<div><span class="muted">export source</span> ${home.currentAvailability.exportSource}</div>`,
      `<div><span class="muted">export output</span> ${home.currentAvailability.exportOutput}</div>`,
      `<div><span class="muted">runs surface</span> ${home.runsSurface}</div>`,
      `<div><span class="muted">notes</span> ${home.notesState}</div>`,
      `<div><span class="muted">quick actions</span> ${home.quickActions.join(", ")}</div>`
    ].join("");
  }

  function renderViewport() {
    const viewport = state.session.mountedViewport;
    const lines = [
      `surface: ${viewport.surface}`,
      `displayMode: ${viewport.displayMode}`,
      `source: ${viewport.source}`,
      `mountedKind: ${viewport.mountedKind}`,
      `renderer: ${viewport.renderer}`,
      `engine: ${viewport.engine}`,
      `readOnly: ${viewport.readOnly}`,
      `sessionPersistence: ${viewport.sessionPersistence}`,
      `viewState: ${viewport.viewState}`,
      "",
      `resolver: ${state.contracts.browserResolver?.id || "unavailable"}`,
      `resume flow: ${state.contracts.browserSaveResume?.id || "unavailable"}`,
      `note editor: ${state.contracts.browserNoteEditor?.id || "unavailable"}`,
      `save bridge: ${state.contracts.browserSaveWriteBridge?.id || "unavailable"}`,
      `apply request: ${state.contracts.applySaveRequest?.id || "unavailable"}`,
      `apply status: ${state.contracts.applySaveStatus?.id || "unavailable"}`,
      `repo verified: ${state.contracts.repoVerifiedSaveStatus?.id || "unavailable"}`,
      `repo handler: ${state.contracts.repoSaveWriteHandler?.id || "unavailable"}`,
    ];
    document.getElementById("runsViewport").textContent = lines.join("\n");
  }

  function renderNotes() {
    const textarea = document.getElementById("noteDraft");
    const saveButton = document.getElementById("saveNoteDraft");
    const target = document.getElementById("noteTarget");
    const list = document.getElementById("noteList");
    const preview = document.getElementById("notePayloadPreview");

    textarea.value = state.noteEditor.draftText;
    textarea.disabled = !state.noteEditor.enabled;
    saveButton.disabled = !state.noteEditor.enabled;
    target.textContent = state.noteEditor.enabled
      ? `${state.noteEditor.status} -> ${state.noteEditor.targetPath}`
      : "disabled for current mount";
    preview.textContent = state.noteEditor.payloadPreview;

    list.innerHTML = "";
    if (!state.notesDoc.items.length) {
      const span = document.createElement("span");
      span.className = "muted";
      span.textContent = state.noteEditor.enabled ? "no notes yet" : "notes unavailable";
      list.appendChild(span);
      return;
    }

    for (const note of state.notesDoc.items) {
      const button = document.createElement("button");
      button.textContent = `${note.id} @p${note.at?.page ?? "-"}`;
      if (note.id === state.noteEditor.selectedNoteId) {
        button.style.borderColor = "#7dd3fc";
      }
      button.addEventListener("click", () => selectNote(note.id));
      list.appendChild(button);
    }
  }

  function renderSaveWriteBridge() {
    document.getElementById("saveBridgeTarget").textContent = state.saveWriteBridge.enabled
      ? `${state.saveWriteBridge.status} -> ${state.saveWriteBridge.targetRoot}`
      : "disabled for current mount";
    document.getElementById("saveBridgePreview").textContent = state.saveWriteBridge.requestPreview;
  }

  function renderApplySaveStatus() {
    const consentCheckbox = document.getElementById("applyConsentMarker");
    const requestApplyButton = document.getElementById("requestApplySave");
    const markAppliedButton = document.getElementById("markApplyAsApplied");
    const markRejectedButton = document.getElementById("markApplyAsRejected");
    const resetButton = document.getElementById("resetApplyStatus");
    const summary = document.getElementById("applyStatusSummary");
    const preview = document.getElementById("applyStatusPreview");

    consentCheckbox.disabled = !state.saveWriteBridge.enabled;
    consentCheckbox.checked = state.applyRequestMarker.consentGranted;
    requestApplyButton.disabled = !state.saveWriteBridge.enabled;
    markAppliedButton.disabled = !(state.saveWriteBridge.enabled && state.applyRequestMarker.consentGranted);
    markRejectedButton.disabled = !state.saveWriteBridge.enabled;
    resetButton.disabled = !state.saveWriteBridge.enabled;

    summary.innerHTML = [
      `<div><span class="muted">status</span> ${state.applySaveStatus.status}</div>`,
      `<div><span class="muted">detail</span> ${state.applySaveStatus.statusDetail}</div>`,
      `<div><span class="muted">consent required</span> ${state.applySaveStatus.consentRequired}</div>`,
      `<div><span class="muted">consent granted</span> ${state.applySaveStatus.consentGranted}</div>`,
      `<div><span class="muted">handoff target</span> ${state.applySaveStatus.handoffTarget}</div>`,
      `<div><span class="muted">repo handler</span> ${state.applySaveStatus.repoHandlerTarget}</div>`,
      `<div><span class="muted">verification required</span> ${state.applySaveStatus.verificationRequired}</div>`,
      `<div class="muted" style="margin-top:8px;">client-side status markers only; no browser repo write is claimed here</div>`
    ].join("");

    preview.textContent = JSON.stringify(state.applySaveStatus, null, 2);
  }

  function renderRepoVerifiedStatus() {
    const summary = document.getElementById("repoVerifiedSummary");
    const preview = document.getElementById("repoVerifiedPreview");
    summary.innerHTML = [
      `<div><span class="muted">consumed</span> ${state.repoVerifiedStatus.consumed}</div>`,
      `<div><span class="muted">status</span> ${state.repoVerifiedStatus.status}</div>`,
      `<div><span class="muted">detail</span> ${state.repoVerifiedStatus.detail}</div>`,
      `<div><span class="muted">save tag</span> ${state.repoVerifiedStatus.saveTag || "none"}</div>`,
      `<div><span class="muted">verified head</span> ${state.repoVerifiedStatus.verifiedHead}</div>`,
      `<div><span class="muted">trusted</span> ${state.repoVerifiedStatus.trusted}</div>`,
      `<div><span class="muted">paths verified</span> ${Array.isArray(state.repoVerifiedStatus.pathsVerified) ? state.repoVerifiedStatus.pathsVerified.length : 0}</div>`,
      `<div class="muted" style="margin-top:8px;">repo-verified state is distinct from local apply markers</div>`
    ].join("");
    preview.textContent = JSON.stringify({
      repoVerifiedStatus: state.repoVerifiedStatus,
      repoVerifiedResponse: state.repoVerifiedResponse
    }, null, 2);
  }

  async function boot() {
    const [
      shellSession,
      manifestIndex,
      boardEnumeration,
      saveSlotIndex,
      browserResolver,
      browserSaveResume,
      browserNoteEditor,
      browserSaveWriteBridge,
      applySaveRequest,
      applySaveStatus,
      repoVerifiedSaveStatus,
      repoSaveWriteHandler,
      modeResolver,
      rendererSelection,
      resumeState,
      actionState,
      statusStrip,
      mountedViewport,
      homeSummary,
      boardsMode
    ] = await Promise.all([
      loadJson("app/shell-session.v1.json"),
      loadJson("manifests/manifest-index.v1.json"),
      loadJson("app/board-enumeration.v1.json"),
      loadJson("saves/save-slot-index.v1.json"),
      loadJson("app/browser-resolver.v1.json"),
      loadJson("app/browser-save-resume.v1.json"),
      loadJson("app/browser-note-editor.v1.json"),
      loadJson("app/browser-save-write-bridge.v1.json"),
      loadJson("app/apply-save-request.v1.json"),
      loadJson("app/apply-save-status.v1.json"),
      loadJson("app/repo-verified-save-status.v1.json"),
      loadJson("app/repo-save-write-handler.v1.json"),
      loadJson("loaders/mode-resolver.v1.json"),
      loadJson("renderers/renderer-selection.v1.json"),
      loadJson("app/resume-state.v1.json"),
      loadJson("app/action-state.v1.json"),
      loadJson("app/status-strip.v1.json"),
      loadJson("app/mounted-viewport.v1.json"),
      loadJson("app/home-summary.v1.json"),
      loadJson("app/boards-mode.v1.json")
    ]);

    state.initialState = clone(shellSession.initialState);
    state.session = clone(shellSession.initialState);
    state.manifestIndex = manifestIndex;
    state.boardEnumeration = boardEnumeration;
    state.saveSlotIndex = saveSlotIndex;
    state.contracts = {
      browserResolver,
      browserSaveResume,
      browserNoteEditor,
      browserSaveWriteBridge,
      applySaveRequest,
      applySaveStatus,
      repoVerifiedSaveStatus,
      repoSaveWriteHandler,
      modeResolver,
      rendererSelection,
      resumeState,
      actionState,
      statusStrip,
      mountedViewport,
      homeSummary,
      boardsMode,
    };

    refreshDerivedState();
    render();

    document.getElementById("mountCartridge").addEventListener("click", () => {
      mountExampleCartridge().catch(showBootError);
    });
    document.getElementById("mountBoard").addEventListener("click", () => {
      mountLiveBoard().catch(showBootError);
    });
    document.getElementById("clearMount").addEventListener("click", clearMount);
    document.getElementById("noteDraft").addEventListener("input", onDraftInput);
    document.getElementById("saveNoteDraft").addEventListener("click", saveDraftNote);
    document.getElementById("applyConsentMarker").addEventListener("change", onConsentToggle);
    document.getElementById("requestApplySave").addEventListener("click", requestApply);
    document.getElementById("markApplyAsApplied").addEventListener("click", markApplied);
    document.getElementById("markApplyAsRejected").addEventListener("click", markRejected);
    document.getElementById("resetApplyStatus").addEventListener("click", resetApplyStatus);
  }

  function showBootError(error) {
    document.getElementById("statusStrip").textContent = `BOOT ERROR\n${error.message}`;
    document.getElementById("homeSummary").innerHTML = `<span class="warn">runtime bootstrap failed</span>`;
    document.getElementById("runsViewport").textContent = "failed to load runtime contracts";
  }

  boot().catch(showBootError);
})();
