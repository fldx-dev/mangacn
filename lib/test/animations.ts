/**
 * jsdom has no Web Animations API. Base UI's scroll-area viewport, once a ResizeObserver exists,
 * calls `getAnimations()` from a timer after it mounts, which throws outside any test. Install a
 * no-op for a test file that mounts a scroll area (`beforeAll(stubGetAnimations)`) and undo it
 * after (`afterAll`). Only per file: overlays wait on animations when the method exists, so a
 * global stub changes their close timing in other tests.
 */
export function stubGetAnimations(): () => void {
  if ("getAnimations" in Element.prototype) return () => {};
  Object.defineProperty(Element.prototype, "getAnimations", {
    configurable: true,
    value: () => [],
  });
  return () => {
    Reflect.deleteProperty(Element.prototype, "getAnimations");
  };
}
