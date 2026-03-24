(() => {
  const ACTION_KEYS = ["save", "exportSource", "exportOutput", "notes", "bookmarks"];

  function deriveActionState(button) {
    const text = String(button.textContent || "");
    const parts = text.split(" : ");
    if (parts.length > 1) {
      return parts.slice(1).join(" : ") || "disabled";
    }
    return button.disabled ? "disabled" : "enabled";
  }

  function applyActionIdentity() {
    const buttons = Array.from(document.querySelectorAll("#actions button"));
    buttons.forEach((button, index) => {
      const actionKey = ACTION_KEYS[index] || `unknown-${index}`;
      button.dataset.actionKey = actionKey;
      button.dataset.actionState = deriveActionState(button);
      button.id = `action-${actionKey}`;
    });
  }

  function boot() {
    applyActionIdentity();

    const actions = document.getElementById("actions");
    if (actions) {
      const observer = new MutationObserver(() => {
        applyActionIdentity();
      });
      observer.observe(actions, { childList: true, subtree: true, characterData: true });
    }

    window.setInterval(() => {
      applyActionIdentity();
    }, 1500);
  }

  boot();
})();
