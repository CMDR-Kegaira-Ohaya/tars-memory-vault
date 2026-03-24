(() => {
  const key = "__TARS_BOARDS__";
  const shared = window[key] || (window[key] = {});
  if (shared.fetchBridgeInstalled) {
    return;
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

    if (path.endsWith("app/board-enumeration.v1.json")) {
      return wrapJsonResponse(response, (data) => {
        shared.boardEnumeration = data;
        return data;
      });
    }

    return response;
  };
})();
