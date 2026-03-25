(() => {
  const collectionsKey = "__TARS_COLLECTIONS__";
  const shared = window[collectionsKey] || (window[collectionsKey] = {});
  const devtoolsKey = "__TARS_DEVTOOLS__";
  const devtools = window[devtoolsKey] || (window[devtoolsKey] = {
    mountedCartridge: null,
    requestHistorySurface: null,
    repoVerifiedSurface: null,
  });
  if (shared.fetchBridgeInstalled) {
    return;
  }

  const legacyMarkAppliedButton = document.getElementById("markApplyAsAapplied");
  if (legacyMarkAppliedButton && !document.getElementById("markApplyAsApplied")) {
    legacyMarkAppliedButton.id = "markApplyAsApplied";
  }

  const advancedLabels = new Set([
    "BOARDS MODE GUARDRAILS",
    "DISABLED SAVE EXPLANATION",
    "EXPORT SOURCE",
    "EXPORT CONTROLS",
    "NOTE EDITOR",
    "NOTES JSON RAW PREVIEW",
    "SAVE WRITE BRIDGE",
    "SAVE WRITE REQUEST RAW PREVIEW",
    "DELTA SUMMARY",
    "DELTA RAW PREVIEW",
    "MOUNTED SOURCE CONTEXT",
    "MOUNTED SOURCE CONTEXT RAW PREVIEW",
    "EXPORT SOURCE RAW PREVIEW",
    "APPLY SAVE REQUEST STATUS",
    "APPLY SAVE STATUS RAW PREVIEW",
    "MOUNTED SAVE CONTEXT",
    "MOUNTED SAVE CONTEXT RAW PREVIEW",
    "REQUEST HISTORY INDEX",
    "REQUEST HISTORY RAW PREVIEW",
    "REPO VERIFIED SAVE STATUS",
    "REPO VERIFIED RAW PREVIEW"
  ]);
  const cartridgeLabels = new Set([
    "REQUEST HISTORY INDEX",
    "REQUEST HISTORY RAW PREVIEW",
    "REPO VERIFIED SAVE STATUS",
    "REPO VERIFIED RAW PREVIEW"
  ]);

  function getPanelLabel(panel) {
    return panel.querySelector(".label")?.textContent?.trim().toUpperCase() || "";
  }

  function emitDevtoolsChanged() {
    window.dispatchEvent(new CustomEvent("tars:devtools-changed", {
      detail: {
        mountedCartridge: devtools.mountedCartridge
      }
    }));
  }

  function toggleCartridge(key) {
    devtools.mountedCartridge = devtools.mountedCartridge === key ? null : key;
    ensureDevtoolsLaunchers();
    emitDevtoolsChanged();
  }

  function upsertLauncher(actions, id, key, label) {
    let button = document.getElementById(id);
    if (!button || button.parentElement !== actions) {
      button = document.createElement("button");
      button.id = id;
      button.addEventListener("click", () => toggleCartridge(key));
      actions.appendChild(button);
    }

    const state = devtools.mountedCartridge === key ? "active" : "available";
    button.disabled = false;
    button.removeAttribute("aria-disabled");
    button.dataset.actionKey = key;
    button.dataset.actionState = state;
    button.dataset.rawActionState = state;
    button.dataset.rawText = `${label} : ${state}`;
    button.textContent = button.dataset.rawText;
  }

  function ensureDevtoolsLaunchers() {
    const actions = document.getElementById("actions");
    if (!actions) {
      return;
    }

    upsertLauncher(actions, "action-request-history", "request-history", "request-history");
    upsertLauncher(actions, "action-repo-verified", "repo-verified", "repo-verified");
  }

  function simplifyShell() {
    const shell = document.querySelector(".shell");
    if (!shell || document.getElementById("advancedSystemSection")) {
      return;
    }

    Array.from(shell.querySelectorAll(".panel")).forEach((panel) => {
      const label = getPanelLabel(panel);
      if (cartridgeLabels.has(label)) {
        panel.remove();
      }
    });

    const panels = Array.from(shell.querySelectorAll(".panel")).filter((panel) => {
      const label = getPanelLabel(panel);
      return label && advancedLabels.has(label);
    });

    if (panels.length) {
      const details = document.createElement("details");
      details.id = "advancedSystemSection";
      details.className = "panel";

      const summary = document.createElement("summary");
      summary.className = "label";
      summary.textContent = "SYSTEM / ADVANCED";
      summary.style.cursor = "pointer";

      const hint = document.createElement("div");
      hint.className = "muted";
      hint.style.margin = "8px 0 12px 0";
      hint.textContent = "Advanced and diagnostic surfaces are collapsed here by default.";

      const grid = document.createElement("div");
      grid.className = "layout";

      panels.forEach((panel) => grid.appendChild(panel));

      details.appendChild(summary);
      details.appendChild(hint);
      details.appendChild(grid);
      shell.appendChild(details);
    }

    Array.from(shell.querySelectorAll("section.layout")).forEach((section) => {
      if (!section.querySelector(".panel")) {
        section.remove();
      }
    });

    ensureDevtoolsLaunchers();
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
      }
    });
  }

  const originalFetch = window.fetch.bind(window);
  shared.fetchBridgeInstalled = true;
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
    simplifyShell();
    ensureDevtoolsLaunchers();
    window.setInterval(ensureDevtoolsLaunchers, 1500);
  }, { once: true });
})();
