(() => {
  const runtime = {
    contract: null,
    surface: null,
    lastEvent: {
      status: "idle",
      detail: "no-export-attempt-yet",
      at: null
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
      const actual = key === "pathPrefix" ? input.sourcePath || "" : input[key];
      if (key === "pathPrefix") {
        return String(actual).startsWith(String(expected));
      }
      if (expected === null) {
        return actual == null;
      }
      if (expected === "non-null") {
        return actual != null;
      }
      if (typeof expected === "string" && expected.includes("|")) {
        return expected.split("|").includes(String(actual));
      }
      return String(actual) === String(expected);
    });
  }

  function resolveTemplate(value, input) {
    if (Array.isArray(value)) {
      return value.map((item) => resolveTemplate(item, input));
    }
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, nested]) => [key, resolveTemplate(nested, input)])
      );
    }
    if (typeof value !== "string") {
      return value;
    }
    switch (value) {
      case "mounted-source-path":
        return input.sourcePath || "none";
      case "from-source-filename":
        return deriveFilename(input.sourcePath);
      default:
        return value;
    }
  }

  function deriveFilename(sourcePath) {
    if (!sourcePath) return "none";
    const segments = String(sourcePath).split("/");
    return segments[segments.length - 1] || "export-source";
  }

  function deriveSurface(input) {
    const states = runtime.contract?.states || {};
    for (const stateConfig of Object.values(states)) {
      if (matches(stateConfig.match || {}, input)) {
        return resolveTemplate(stateConfig.derive || {}, input);
      }
    }
    return {
      enabled: false,
      status: "disabled",
      sourcePath: input.sourcePath || "none",
      suggestedFilename: deriveFilename(input.sourcePath),
      detail: "unmatched-export-source-state"
    };
  }

  function buildInput() {
    const viewport = parseViewportText();
    return {
      mountedKind: viewport.mountedKind === "none" ? null : viewport.mountedKind || null,
      sourcePath: viewport.source && viewport.source !== "none" ? viewport.source : null,
      exportSourceState: parseExportSourceState()
    };
  }

  function render(surface) {
    runtime.surface = surface;
    const summary = document.getElementById("exportSourceSummary");
    const preview = document.getElementById("exportSourcePreview");
    if (!summary || !preview) {
      return;
    }

    summary.innerHTML = [
      `<div><span class="muted">status</span> ${surface.status}</div>`,
      `<div><span class="muted">enabled</span> ${surface.enabled}</div>`,
      `<div><span class="muted">source path</span> ${surface.sourcePath}</div>`,
      `<div><span class="muted">filename</span> ${surface.suggestedFilename}</div>`,
      `<div><span class="muted">detail</span> ${surface.detail}</div>`,
      `<div><span class="muted">last event</span> ${runtime.lastEvent.status}</div>`,
      `<div><span class="muted">event detail</span> ${runtime.lastEvent.detail}</div>`
    ].join("");

    preview.textContent = JSON.stringify({
      surface,
      lastEvent: runtime.lastEvent
    }, null, 2);
  }

  async function exportCurrentSource() {
    if (!runtime.surface?.enabled || !runtime.surface?.sourcePath || runtime.surface.sourcePath === "none") {
      runtime.lastEvent = {
        status: "blocked",
        detail: "export-source-not-available-for-current-mount",
        at: new Date().toISOString()
      };
      render(runtime.surface || deriveSurface(buildInput()));
      return;
    }

    try {
      const response = await fetch(normalizePath(runtime.surface.sourcePath));
      if (!response.ok) {
        throw new Error(`failed to fetch ${runtime.surface.sourcePath}`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = runtime.surface.suggestedFilename || "export-source";
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      runtime.lastEvent = {
        status: "download-started",
        detail: runtime.surface.sourcePath,
        at: new Date().toISOString()
      };
    } catch (error) {
      runtime.lastEvent = {
        status: "error",
        detail: error.message,
        at: new Date().toISOString()
      };
    }

    render(runtime.surface || deriveSurface(buildInput()));
  }

  async function refresh() {
    render(deriveSurface(buildInput()));
  }

  async function boot() {
    runtime.contract = await loadJson("app/export-source.v1.json");
    await refresh();

    const observerTargets = [
      document.getElementById("runsViewport"),
      document.getElementById("actions")
    ].filter(Boolean);

    const observer = new MutationObserver(() => {
      refresh().catch(() => {});
    });
    observerTargets.forEach((target) => observer.observe(target, { childList: true, subtree: true, characterData: true }));

    const actions = document.getElementById("actions");
    if (actions) {
      actions.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (!button) return;
        if (!String(button.textContent || "").startsWith("exportSource :")) return;
        event.preventDefault();
        exportCurrentSource().catch(() => {});
      });
    }

    window.setInterval(() => {
      refresh().catch(() => {});
    }, 1500);
  }

  boot().catch((error) => {
    const summary = document.getElementById("exportSourceSummary");
    const preview = document.getElementById("exportSourcePreview");
    if (summary) {
      summary.innerHTML = `<span class="warn">export source bootstrap failed</span>`;
    }
    if (preview) {
      preview.textContent = error.message;
    }
  });
})();
