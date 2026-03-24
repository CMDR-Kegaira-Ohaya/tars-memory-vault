(() => {
  const runtime = {
    contract: null,
    surface: null,
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

  function parseViewportText() {
    const text = document.getElementById("runsViewport")?.textContent || "";
    const lines = text.split("\n");
    const result = {};
    for (const line of lines) {
      const parts = line.split(": ");
      if (parts.length < 2) continue;
      const key = parts.shift();
      result[key] = parts.join(": ");
    }
    return result;
  }

  function parseExportSourceState() {
    const buttons = Array.from(document.querySelectorAll("#actions button"));
    const target = buttons.find((button) => String(button.textContent || "").startsWith("exportSource :"));
    if (!target) return "disabled";
    return String(target.textContent || "").split(": ")[1] || "disabled";
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

  function deriveFilename(sourcePath) {
    if (!sourcePath) return "none";
    const segments = String(sourcePath).split("/");
    return segments[segments.length - 1] || "export-source";
  }

  function resolveTemplate(value, input) {
    if (Array.isArray(value)) {
      return value.map((item) => resolveTemplate(item, input));
    }
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, resolveTemplate(nested, input)]));
    }
    if (typeof value !== "string") {
      return value;
    }
    switch (value) {
      case "from-current-mounted-kind":
        return input.currentMountedKind;
      case "from-current-source-path":
        return input.currentSourcePath || "none";
      case "from-current-export-source-state":
        return input.exportSourceState || "disabled";
      case "from-source-filename":
        return deriveFilename(input.currentSourcePath);
      default:
        return value;
    }
  }

  function deriveSurface(input) {
    const states = runtime.contract?.states || {};
    for (const stateConfig of Object.values(states)) {
      if (matches(stateConfig.match || {}, input)) {
        return resolveTemplate(stateConfig.derive || {}, input);
      }
    }
    return {
      status: "unknown",
      mountedKind: input.currentMountedKind,
      sourcePath: input.currentSourcePath || "none",
      exportSourceState: input.exportSourceState || "disabled",
      suggestedFilename: deriveFilename(input.currentSourcePath),
      source: "dedicated-runtime-field"
    };
  }

  function buildInput() {
    const viewport = parseViewportText();
    return {
      currentMountedKind: viewport.mountedKind === "none" ? null : viewport.mountedKind || null,
      currentSourcePath: viewport.source && viewport.source !== "none" ? viewport.source : null,
      exportSourceState: parseExportSourceState()
    };
  }

  function render(surface) {
    runtime.surface = surface;
    const summary = document.getElementById("mountedSourceContextSummary");
    const preview = document.getElementById("mountedSourceContextPreview");
    if (summary) {
      summary.innerHTML = [
        `<div><span class="muted">status</span> ${surface.status}</div>`,
        `<div><span class="muted">mounted kind</span> ${surface.mountedKind || "none"}</div>`,
        `<div><span class="muted">source path</span> ${surface.sourcePath}</div>`,
        `<div><span class="muted">export state</span> ${surface.exportSourceState}</div>`,
        `<div><span class="muted">filename</span> ${surface.suggestedFilename}</div>`,
        `<div><span class="muted">source</span> ${surface.source}</div>`
      ].join("");
    }
    if (!preview) return;
    preview.textContent = JSON.stringify(surface, null, 2);
    preview.dataset.sourcePath = surface.sourcePath || "";
  }

  async function refresh() {
    render(deriveSurface(buildInput()));
  }

  async function boot() {
    runtime.contract = await loadJson("app/mounted-source-context.v1.json");
    await refresh();

    const observerTargets = [
      document.getElementById("runsViewport"),
      document.getElementById("actions")
    ].filter(Boolean);

    const observer = new MutationObserver(() => {
      refresh().catch(() => {});
    });
    observerTargets.forEach((target) => observer.observe(target, { childList: true, subtree: true, characterData: true }));

    window.setInterval(() => {
      refresh().catch(() => {});
    }, 1500);
  }

  boot().catch((error) => {
    const summary = document.getElementById("mountedSourceContextSummary");
    const preview = document.getElementById("mountedSourceContextPreview");
    if (summary) {
      summary.innerHTML = `<span class="warn">mounted source context bootstrap failed</span>`;
    }
    if (preview) {
      preview.textContent = JSON.stringify({
        status: "bootstrap-error",
        message: error.message,
        source: "dedicated-runtime-field"
      }, null, 2);
    }
  });
})();
