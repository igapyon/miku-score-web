const DEFAULT_VEROVIO_INIT_TIMEOUT_MS = 8000;

const isRuntimeReady = (moduleObject) =>
  Boolean(moduleObject?.calledRun && typeof moduleObject.cwrap === "function");

const waitForRuntime = async (moduleObject, options) => {
  if (isRuntimeReady(moduleObject)) return;

  await new Promise((resolve, reject) => {
    let settled = false;
    const previous = moduleObject.onRuntimeInitialized;
    const timeoutId = options.setTimeoutFn(() => {
      if (settled) return;
      settled = true;
      reject(new Error("Timed out while waiting for Verovio initialization."));
    }, options.timeoutMs);

    const complete = () => {
      if (settled) return;
      settled = true;
      options.clearTimeoutFn(timeoutId);
      resolve();
    };

    moduleObject.onRuntimeInitialized = () => {
      if (typeof previous === "function") previous();
      complete();
    };

    if (isRuntimeReady(moduleObject)) complete();
  });
};

export class BrowserVerovioToolkit {
  constructor() {
    this.toolkit = null;
  }

  setToolkit(toolkit) {
    this.toolkit = toolkit;
  }

  setOptions(options) {
    this.requireToolkit().setOptions(options);
  }

  loadData(xml) {
    return this.requireToolkit().loadData(xml);
  }

  getPageCount() {
    return this.requireToolkit().getPageCount();
  }

  renderToSVG(page, options) {
    return this.requireToolkit().renderToSVG(page, options);
  }

  requireToolkit() {
    if (!this.toolkit) throw new Error("Verovio toolkit is not initialized.");
    return this.toolkit;
  }
}

export const createBrowserVerovioAdapter = (options = {}) => {
  const verovioRuntime = Object.prototype.hasOwnProperty.call(options, "verovioRuntime")
    ? options.verovioRuntime
    : globalThis.verovio ?? null;
  const serializeDocument = options.serializeDocument ??
    ((documentValue) => new XMLSerializer().serializeToString(documentValue));
  const timeoutMs = options.timeoutMs ?? DEFAULT_VEROVIO_INIT_TIMEOUT_MS;
  const setTimeoutFn = options.setTimeoutFn ?? globalThis.setTimeout.bind(globalThis);
  const clearTimeoutFn = options.clearTimeoutFn ?? globalThis.clearTimeout.bind(globalThis);

  if (!verovioRuntime || typeof verovioRuntime.toolkit !== "function" || !verovioRuntime.module) {
    return Object.freeze({
      available: false,
      capability: null,
      initialize: async () => {
        throw new Error("Verovio browser runtime is unavailable.");
      },
    });
  }

  const toolkit = new BrowserVerovioToolkit();
  let initialized = false;
  let initializePromise = null;

  if (isRuntimeReady(verovioRuntime.module)) {
    toolkit.setToolkit(new verovioRuntime.toolkit());
    initialized = true;
  }

  const initialize = async () => {
    if (initialized) return;
    if (initializePromise) return initializePromise;

    initializePromise = (async () => {
      await waitForRuntime(verovioRuntime.module, {
        timeoutMs,
        setTimeoutFn,
        clearTimeoutFn,
      });
      toolkit.setToolkit(new verovioRuntime.toolkit());
      initialized = true;
    })().catch((error) => {
      initializePromise = null;
      throw error;
    });

    return initializePromise;
  };

  return Object.freeze({
    available: true,
    capability: Object.freeze({ toolkit, serializeDocument }),
    initialize,
  });
};
