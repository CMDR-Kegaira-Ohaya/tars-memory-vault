(() => {
  const ACTION_KEYS = ["save", "exportSource", "exportOutput", "notes", "bookmarks"];
  const RAW_PATTERN = /^\s*([^:]+?)\s:\s(.+)\s*$/;

  function parseRawActionText(text) {
    const match = String(text || "").match(RAW_PATTERN);
    if (!match) return null;
    return {
      actionKey: String(match[1] || "").trim(),
      actionState: String(match[2] || "").trim()
    };
  }

  function deriveActionKey(button, index) {
    if (button.dataset.actionKey) return button.dataset.actionKey;
    const parsed = parseRawActionText(button.dataset.rawText || button.textContent || "");
    return parsed?.actionKey || ACTION_KEYS[index] || `unknown-${index}`;
  }

  function deriveActionState(button) {
    if (button.dataset.rawActionState) return button.dataset.rawActionState;
    const parsed = parseRawActionText(button.dataset.rawText || button.textContent || "");
    if (parsed?.actionState) return parsed.actionState;
    if (button.dataset.actionState) return button.dataset.actionState;
    return button.disabled ? "disabled" : "enabled";
  }

  function applyActionIdentity() {
    const buttons = Array.from(document.querySelectorAll("#actions button"));
    buttons.forEach((button, index) => {
      const currentText = String(button.textContent || "");
      if (!button.dataset.rawText && RAW_PATTERN.test(currentText)) {
        button.dataset.rawText = currentText;
      }

      const actionKey = deriveActionKey(button, index);
      const actionState = deriveActionState(button);

      button.dataset.actionKey = actionKey;
      button.dataset.actionState = actionState;
      button.dataset.rawActionState = actionState;
      button.dataset.actionOrder = String(index);
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
