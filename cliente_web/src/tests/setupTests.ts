import "@testing-library/jest-dom/vitest";

if (!global.ResizeObserver) {
  class ResizeObserver {
    observe() {
      return;
    }
    unobserve() {
      return;
    }
    disconnect() {
      return;
    }
  }
  // @ts-expect-error - attaching polyfill for tests
  global.ResizeObserver = ResizeObserver;
}

if (!window.matchMedia) {
  // @ts-expect-error - jsdom polyfill
  window.matchMedia = () => ({
    matches: false,
    media: "",
    onchange: null,
    addListener: () => void 0,
    removeListener: () => void 0,
    addEventListener: () => void 0,
    removeEventListener: () => void 0,
    dispatchEvent: () => false,
  });
}

if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}

if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
