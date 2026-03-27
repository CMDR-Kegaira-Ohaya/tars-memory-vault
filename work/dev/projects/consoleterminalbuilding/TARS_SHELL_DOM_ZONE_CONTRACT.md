# TARS Shell DOM / Zone Contract v0.2

## 1. Root contract

The shell is one machine, one page, one primary runtime.

```html
<body class="tars-shell">
  <div id="tarsShell" data-shell-mode="home" data-shell-state="idle">
    <div id="tarsChassis">
      <section id="tarsMainCrt" aria-label="Main CRT display"></section>
      <aside id="tarsSideMonitor" aria-label="Machine status monitor"></aside>
      <section id="tarsLoaderBay" aria-label="Loader bay"></section>
      <nav id="tarsControlDeck" aria-label="Control deck"></nav>
    </div>
  </div>
</body>
```

Rules:
- `#tarsMainCrt` is the only primary payload surface
- `#tarsSideMonitor` is secondary machine-state only
- `#tarsLoaderBay` is media ingress/egress only
- `#tarsControlDeck` is the physical control surface

---

## 2. Main CRT structure

```html
<section id="tarsMainCrt">
  <div id="crtBezel">
    <div id="crtGlass">
      <div id="crtViewport">
        <header id="crtHeader"></header>
        <main id="crtPayload"></main>
        <footer id="crtCommandLine"></footer>
      </div>

      <div id="crtOverlayLayer" hidden></div>
      <div id="crtDialogLayer" hidden></div>
      <div id="crtHudLayer" hidden></div>
    </div>

    <div id="crtBadgePlate">TARS</div>
  </div>
</section>
```

Responsibilities:
- `#crtHeader` = current payload title / state chip / minimal contextual info
- `#crtPayload` = Home, book, board, cartridge runtime, repo-load selection, import flow
- `#crtCommandLine` = authoritative live control legend
- `#crtOverlayLayer` = transient overlays
- `#crtDialogLayer` = confirm/eject/load dialogs
- `#crtHudLayer` = layout debug / service HUD

Rule:
Nothing outside `#crtPayload` should behave like the main app.

---

## 3. Side monitor structure

```html
<aside id="tarsSideMonitor">
  <div id="sideMonitorFrame">
    <div id="sideMonitorViewport">
      <header id="sideMonitorHeader">SYSTEM</header>
      <div id="sideMonitorBody"></div>
      <footer id="sideMonitorFooter"></footer>
    </div>
  </div>
</aside>
```

Responsibilities:
- machine condition
- EWS / systems check
- compact service/debug indicators
- current mount/runtime state summary

Must not become:
- a second full navigation surface
- a second reader
- a dumping ground for dev panels

---

## 4. Loader bay structure

```html
<section id="tarsLoaderBay">
  <div id="loaderLabel">LOADER</div>
  <div id="loaderSlot"></div>
  <div id="loaderStatus"></div>
  <div id="loaderActions" hidden></div>
</section>
```

Responsibilities:
- show whether media is present
- handle `Load`
- handle `Repo Load`
- handle `Import Files`
- handle `Eject`

Rule:
The loader selects, inserts, removes. It does not become the reading surface.

---

## 5. Control deck structure

```html
<nav id="tarsControlDeck">
  <button id="btnUp" data-control="up"></button>
  <button id="btnDown" data-control="down"></button>
  <button id="btnLeft" data-control="left"></button>
  <button id="btnRight" data-control="right"></button>

  <button id="btnA" data-control="a">A</button>
  <button id="btnB" data-control="b">B</button>
  <button id="btnSelect" data-control="select">Select</button>
  <button id="btnStart" data-control="start">Start</button>
  <button id="btnAlt" data-control="alt">Alt</button>
  <button id="btnEsc" data-control="esc">Esc</button>
</nav>
```

These buttons are physically stable.
Their meaning is declared by `#crtCommandLine`.

---

## 6. Command-line contract

```html
<footer id="crtCommandLine" aria-live="polite">
  <span data-slot="up">↑ Move</span>
  <span data-slot="down">↓ Move</span>
  <span data-slot="a">A Open</span>
  <span data-slot="b">B Back</span>
  <span data-slot="select">Select System</span>
  <span data-slot="start">Start Mount</span>
  <span data-slot="alt">Alt More</span>
  <span data-slot="esc">Esc Close</span>
</footer>
```

Rules:
- fixed slot order
- short verb labels
- current truth only
- no hidden override lore
- if interactive meaning changes, this updates first

---

## 7. Shell state contract

Single shared shell state object:

```js
window.__TARS_SHELL_STATE__ = {
  shellMode: "home",        // home | load | runtime | overlay | service
  payloadKind: "home",      // home | book | cartridge | board | repo-load | import | debug
  payloadTitle: "Home",
  mountedItem: null,        // { kind, title, source, path }
  loaderState: "empty",     // empty | ready | loaded | ejecting | importing
  sideMonitorMode: "system",// system | ews | debug | verify
  overlayMode: null,        // null | dialog | hud | inspect | confirm
  commandMap: {
    up: "Move",
    down: "Move",
    left: "Prev",
    right: "Next",
    a: "Open",
    b: "Back",
    select: "System",
    start: "Mount",
    alt: "More",
    esc: "Close"
  }
};
```

Only this shared state drives:
- CRT header
- CRT payload binding
- command line
- side monitor
- loader state

---

## 8. Mapping from current terminal ids

Bridge old runtime into new shell instead of rewriting logic first.

Current to new mapping:
- `runsViewport` -> `#crtPayload`
- `homeSummary` -> Home data source for `#crtPayload`
- `statusStrip` -> `#sideMonitorBody`
- `actions` -> feeds `commandMap`, not raw on-screen button rows
- `nav` -> feeds shell mode / context, not visible legacy nav chrome
- Import / Collections / Boards flows -> launched through loader + CRT payload
- Request History / Repo Verified / Debug Intake -> overlay, service mode, or side-monitor-linked tools

Immediate rule:
keep old data producers if useful; replace old visible chrome with shell renderers.

---

## 9. Zone rendering rules

`#crtPayload`
- may scroll internally
- never resize the chassis
- owns focusable content

`#crtOverlayLayer`
- for non-blocking overlays
- does not unmount payload

`#crtDialogLayer`
- for blocking confirmation dialogs
- used for eject, import confirmation, destructive actions

`#crtHudLayer`
- service/debug only
- default hidden

`#sideMonitorBody`
- compact cards, chips, bars, tiny tables
- no long-scroll application behavior

`#loaderActions`
- can appear as a local menu or bay popup
- must stay loader-scoped

---

## 10. CSS geometry contract

The photo is chassis authority.
HTML overlays align to it.

Required positioning model:
- one chassis wrapper with fixed aspect ratio
- each live zone absolutely positioned against shell geometry
- no layout-driven reflow between zones

Example contract:

```css
#tarsChassis {
  position: relative;
  aspect-ratio: <photo-ratio>;
  width: min(100vw, 1600px);
}

#tarsMainCrt,
#tarsSideMonitor,
#tarsLoaderBay,
#tarsControlDeck {
  position: absolute;
}
```

Rule:
The art defines geometry.
The DOM fills the mapped windows.

---

## 11. Input ownership contract

The shell has two keyboard states:
- **play mode** = controller bindings may fire
- **text-entry mode** = controller bindings are suspended

Keyboard control is only live when:
- the **CRT viewport owns focus**
- the shell is in **play mode**
- the active element is **not editable**

Editable means:
- `input`
- `textarea`
- `select`
- `contenteditable`

---

## 12. Keyboard mirror contract

Pointer and touch can always use the on-screen controls.

Keyboard controller bindings are scoped:
- arrows may act as D-pad
- Enter may act as primary confirm
- Space may act as secondary confirm/back
- optional letter bindings are allowed only when tightly scoped to play mode
- modified shortcuts must not be hijacked (`Ctrl`, `Alt`, `Meta`)

The important rule is the gate, not the exact bindings.

---

## 13. Focus rule

`#crtViewport` is the keyboard owner only when explicitly focused.

Example:
- click CRT viewport -> enter play mode
- click into text field inside CRT -> enter text-entry mode
- leave text field / close editor -> return to play mode and restore CRT focus

---

## 14. Accessibility guardrail

Do **not** use `role="application"` for the CRT by default.

Only use it if we intentionally own the full keyboard model and escape behavior for that region.

---

## 15. Implementation skeleton

```html
<div id="crtViewport" tabindex="0" aria-label="TARS main viewport"></div>
```

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

function enterTextEntryMode() {
  textEntryMode = true;
  playMode = false;
}

function exitTextEntryMode() {
  textEntryMode = false;
  playMode = true;
  crtViewport.focus();
}

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

## 16. Locked interpretation

- keyboard controls are **not always-on**
- text entry always wins over controller bindings
- focus ownership decides who receives keys
- footer command line still declares current meaning, but keyboard delivery is gated by mode and focus

---

## 17. Exact `terminal/index.html` shell skeleton target

```html
<body class="tars-shell">
  <div id="tarsShell" data-shell-mode="home" data-shell-state="idle">
    <div id="tarsChassis">
      <img
        id="tarsShellArt"
        src="assets/tars-shell-photo.png"
        alt=""
        aria-hidden="true"
      />

      <!-- MAIN CRT -->
      <section id="tarsMainCrt" aria-label="Main CRT display">
        <div id="crtBezel">
          <div id="crtGlass">
            <div id="crtViewport" tabindex="0" aria-label="TARS main viewport">
              <header id="crtHeader"></header>
              <main id="crtPayload"></main>
              <footer id="crtCommandLine" aria-live="polite"></footer>
            </div>

            <div id="crtOverlayLayer" hidden></div>
            <div id="crtDialogLayer" hidden></div>
            <div id="crtHudLayer" hidden></div>
          </div>

          <div id="crtBadgePlate">TARS</div>
        </div>
      </section>

      <!-- RIGHT MONITOR -->
      <aside id="tarsSideMonitor" aria-label="Machine status monitor">
        <div id="sideMonitorFrame">
          <div id="sideMonitorViewport">
            <header id="sideMonitorHeader">SYSTEM</header>
            <div id="sideMonitorBody"></div>
            <footer id="sideMonitorFooter"></footer>
          </div>
        </div>
      </aside>

      <!-- LOADER BAY -->
      <section id="tarsLoaderBay" aria-label="Loader bay">
        <div id="loaderLabel">LOADER</div>
        <div id="loaderSlot"></div>
        <div id="loaderStatus"></div>
        <div id="loaderActions" hidden></div>
      </section>

      <!-- CONTROL DECK -->
      <nav id="tarsControlDeck" aria-label="Control deck">
        <div id="dpadCluster">
          <button id="btnUp" data-control="up" aria-label="Up"></button>
          <button id="btnDown" data-control="down" aria-label="Down"></button>
          <button id="btnLeft" data-control="left" aria-label="Left"></button>
          <button id="btnRight" data-control="right" aria-label="Right"></button>
        </div>

        <div id="faceButtons">
          <button id="btnA" data-control="a">A</button>
          <button id="btnB" data-control="b">B</button>
        </div>

        <div id="systemButtons">
          <button id="btnSelect" data-control="select">Select</button>
          <button id="btnStart" data-control="start">Start</button>
          <button id="btnAlt" data-control="alt">Alt</button>
          <button id="btnEsc" data-control="esc">Esc</button>
        </div>
      </nav>

      <!-- LEGACY DATA SOURCES: KEEP TEMPORARILY, HIDE VISUALLY -->
      <div id="legacyBridge" hidden aria-hidden="true">
        <div id="statusStrip"></div>
        <div id="nav"></div>
        <div id="actions"></div>
        <div id="homeSummary"></div>
        <div id="runsViewport"></div>
      </div>
    </div>
  </div>
</body>
```

Immediate migration rules:
- `runsViewport` feeds `#crtPayload`
- `homeSummary` feeds Home state inside `#crtPayload`
- `statusStrip` feeds `#sideMonitorBody`
- `actions` feeds `#crtCommandLine`
- `nav` feeds shell mode/state, not visible legacy nav
- keep legacy nodes hidden as bridge inputs until renderers replace them
