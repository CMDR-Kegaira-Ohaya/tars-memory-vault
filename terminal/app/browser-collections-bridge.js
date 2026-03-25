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
})();
