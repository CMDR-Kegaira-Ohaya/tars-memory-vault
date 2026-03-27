## TARS SHELL INPUT / CONTROL CONTRACT

## Purpose

This file locks how input, focus, control meaning, and accessibility should behave in the TARS photo-shell.

It exists so we do not re-discuss these rules from scratch each session.

---

## 1. Core control doctrine

The shell has fixed physical controls.

Hardware set:
- D-pad
- A
- B
- Select
- Start
- Alt
- Esc

These controls do not change position or identity.
Their current meaning does change by context.

---

## 2. Control truth rule

**Buttons are fixed; meanings are live; the footer command line declares current truth.**

This means:
- the shell does not rely on hidden button lore
- the operator does not need to memorize static meanings outside the system
- the current screen context tells the truth
- if a button's meaning changes, the footer command line must reflect it

Example style:
`A Open   B Back   Start Mount   Select System   Alt More   Esc Close`

---

## 3. Input modes

There are two keyboard-relevant modes:

### Play mode
Controller/keyboard bindings may fire.
The CRT viewport behaves like the active operating surface.

### Text-entry mode
Controller/keyboard bindings are suspended.
Text entry and form behavior take priority.

---

## 4. Play mode rule

Keyboard controls are not always-on.

They are only live when all of these are true:
- the CRT viewport owns focus
- the shell is in play mode
- the active element is not editable
- no modal dialog or blocking overlay has precedence

---

## 5. Text-entry mode rule

Text entry always wins over controller bindings.

This means that no face-button or controller letter binding should fire when focus is in any editable target.

### Editable targets
- input
- textarea
- select
- contenteditable

If focus is in any of the entities above, the shell must be in text-entry mode for keyboard behavior.

---

## 6. Focus ownership rule

### CRT viewport
`#crtViewport` is the keyboard owner only when it has explicit focus.

### Example flow
- click CRT viewport => enter play mode
- click into a text field inside CRT => enter text-entry mode
- leave text field => potentially return to play mode
- close editor or confirm dialog => restore CRT viewport focus only if that makes sense for the current state

Focus ownership decides who receives keys.

---

## 7. Keyboard mirror rule

Pointer and touch can always use on-screen controls.

Keyboard control is scoped when play mode is active.

Acceptable baseline mappings are:
- arrows = D-pad
- Enter = primary confirm
- Space = secondary confirm or back
- optional letter bindings = allowed only when tightly scoped to play mode

But the gate matters more than the exact bindings.

---

## 8. Modified-shortcut rule

Do not hijack modified keys.

This includes:
- Ctrl
- Alt
- Meta

If a keypress uses modifiers, regular business should prioritize browser/os/assistive-service expectations unless we have a very specific, explicit and safe reason to own it.

---

## 9. Dispatch order

All control inputs should flow through one dispatch layer.

Recommended order:
1. active dialog
2. active overlay or HUD
3. active CRT payload
4. shell fallback

This keeps input from scattering across multiple uncoordinated listeners.

---

## 10. Accessibility guardrail

Do **not** use `role="application"` for the CRT by default.

Use it only if we intentionally own the full keyboard model, escape behavior, and assistive-tech expectations for that region.

By default:
- use normal landmarks
- use focus control carefully
- do not assume the shell owns the entire page keyboard experience

---

## 11. Command-line connection

The footer command line and input model must stay in sync.

This means:
- if a payload changes meaning, the command line updates
- if text-entry mode suspends controller bindings, the command line should not mislead the operator
- the command line is the operator-truth surface

---

## 12. Locked interpretation

- keyboard controls are not always-on
- text entry always wins over controller bindings
- focus ownership decides who receives keys
- the footer command line declares current control truth
- modified shortcuts stay soft-system-owned by default
- accessibility guardrails take precedence over aggressive device-metaphor ownership

---

## 13. Short implementation skeleton
```js
const crtViewport = document.getElementById("crtViewport");

let playMode = false;
let textEntryMode = false;

function isEditable(el) {
  return !!el && (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT" ||
    el.isContentEditable
  );
}

crtViewport.addEventListener("click", () => {
  crtViewport.focus();
  playMode = true;
});

document.addEventListener("keydown", (e) => {
  const active = document.activeElement;

  if (textEntryMode || isEditable(active)) return;
  if (!playMode) return;
  if (active !== crtViewport) return;
  if (e.ctrlKey || e.altKey || e.metaKey) return;

  dispatchShellControlFromKey(e);
});
```

---

## 14. Working rule for future sessions
When designing or implementing TARS input behavior, start from this file.
Do not reinvent an always-on keyboard controller model unless the project explicitly revises this contract.
