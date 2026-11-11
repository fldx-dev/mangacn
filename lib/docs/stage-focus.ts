/**
 * Holds script-driven focus in an embedded demo stage until the reader goes there.
 *
 * A stage whose popup opens on load (a dialog, a menu, a popover with a field) focuses it, as it
 * should on its own page. In an iframe on a docs page that same call pulls the reader's focus
 * out of the page and into the frame, scrolls the page to it, and a modal then keeps the Tab
 * key: nobody asked to go there. So while the stage is embedded, `focus()` only remembers its
 * element until the reader presses, types or tabs into the frame; from then on the stage is an
 * ordinary page. A reader who tabs in gets the focus the stage last asked for (the open dialog,
 * not the trigger behind it), which is the state the stage has on its own page. The popup still
 * opens and still works with a pointer the whole time. `scrollIntoView` is held the same way,
 * since it scrolls the embedding page as well.
 *
 * Self-contained on purpose: the stage inlines this function's source as a script that runs
 * before the demo's markup arrives, so it must not reach for anything outside its own body.
 */
export function holdStageFocus(win: Window & typeof globalThis): void {
  // On its own page the stage keeps its focus (the baselines and the lone stage are unchanged).
  if (win.top === win) return;

  const prototypes = [win.HTMLElement.prototype, win.SVGElement.prototype];
  const originals = prototypes.map((prototype) => prototype.focus);
  const root = win.document.documentElement;
  // Only the reader can cause these while focus is held: a script's own `focus()` moves
  // nothing, so a `focusin` here means the Tab key or a pointer brought focus into the frame.
  const events = ["pointerdown", "keydown", "focusin"];

  let asked: HTMLElement | SVGElement | null = null;
  // The same goes for `scrollIntoView`: a list that brings its highlighted row into view on load
  // (a command palette does) scrolls every scroller above it, the embedding page among them.
  const elements = win.Element.prototype;
  const scrollIntoView = elements.scrollIntoView;
  elements.scrollIntoView = () => {};

  function release(event: Event) {
    elements.scrollIntoView = scrollIntoView;
    prototypes.forEach((prototype, index) => {
      prototype.focus = originals[index] as typeof prototype.focus;
    });
    for (const type of events) win.removeEventListener(type, release, true);
    delete root.dataset.focusHeld;
    // Tabbed in (a press releases on `pointerdown`, before its own `focusin`): once this event
    // is through, move on to where the stage wanted the focus. A press decides for itself.
    const wanted = asked;
    if (event.type === "focusin" && wanted) {
      win.setTimeout(() => {
        if (wanted.isConnected) wanted.focus();
      }, 0);
    }
  }

  for (const prototype of prototypes) {
    prototype.focus = function hold(this: HTMLElement | SVGElement) {
      asked = this;
    };
  }
  // Capture on the window, so focus is back before any handler of the stage's own runs (a
  // focus guard that hands a tabbed-in focus on to the popup calls `focus()` in its handler).
  for (const event of events) win.addEventListener(event, release, true);
  root.dataset.focusHeld = "true";
}

/** `holdStageFocus` as an inline script for the stage document. */
export const STAGE_FOCUS_SCRIPT = `(${holdStageFocus.toString()})(window)`;
