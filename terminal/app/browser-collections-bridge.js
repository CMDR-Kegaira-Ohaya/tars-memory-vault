(() => {
  const key = "__TARS_COLLECTIONS__";
  const shared = window[key] || (window[key] = {});
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

  function simplifyShell() {
    const shell = document.querySelector(".shell");
    if (!shell || document.getElementById("advancedSystemSection")) {
      return;
    }

    const panels = Array.from(shell.querySelectorAll(".panel")).filter((panel) => {
      const label = panel.querySelector(".label")?.textContent?trim().toUpperCase();
      return label && advancedLabels.has(label);
    });

    if (!panels.length) {
      return;
    }

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

    Array.from(shell.querySelectorAll("section.layout")).forEach((section) => {
      if (!section.querySelector(".panel")) {
        section.remove();
      }
    });
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

  window.addEventListener("DOMContentLoaded", simplifyShell, { once: true });
})();
