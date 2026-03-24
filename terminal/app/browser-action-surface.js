(() => {
  const runtime = {
    contract: null,
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

  function resolveTemplate(value) {
    if (Array.isArray(value)) {
      return value.map((item) => resolveTemplate(item));
    }
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, resolveTemplate(nested)]));
    }
    return value;
  }

  function deriveSurface(input) {
    const states = runtime.contract?.states || {};
    for (const stateConfig of Object.values(states)) {
      if (matches(stateConfig.match || {}, input)) {
        return resolveTemplate(stateConfig.derive || {});
      }
    }
    return {
      label: input.actionKey || "Action",
      statusLabel: input.buttonDisabled ? "off" : String(input.actionState || "ready"),
      hint: "Action presentation fallback.",
      emphasis: input.buttonDisabled ? "muted" : "active"
    };
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderButton(button) {
    const surface = deriveSurface({
      actionKey: button.dataset.actionKey || null,
      actionState: button.dataset.actionState || null,
      buttonDisabled: button.disabled
    });

    button.classList.add("action-button-surface");
    button.dataset.actionEmphasis = surface.emphasis || "muted";
    button.dataset.actionLabel = surface.label || "Action";
    button.title = surface.hint || "";
    button.setAttribute("aria-label", `${surface.label} — ${surface.statusLabel}. ${surface.hint}`);
    button.innerHTML = `
      <span class="action-button-label">${escapeHtml(surface.label)}</span>
      <span class="action-button-status">${escapeHtml(surface.statusLabel)}</span>
    `;
  }

  function applyActionSurface() {
    const buttons = Array.from(document.querySelectorAll("#actions button[data-action-key]"));
    buttons.forEach(renderButton);
  }

  async function boot() {
    runtime.contract = await loadJson("app/action-surface.v1.json");
    applyActionSurface();

    const actions = document.getElementById("actions");
    if (actions) {
      const observer = new MutationObserver(() => {
        applyActionSurface();
      });
      observer.observe(actions, { childList: true, subtree: true, characterData: true });
    }

    window.setInterval(() => {
      applyActionSurface();
    }, 1500);
  }

  boot().catch(() => {});
})();
