/*
 * Web-owned single-file adaptation of the lht-cmn toast control.
 * Licensed under the Apache License, Version 2.0.
 */

class LhtToast extends HTMLElement {
  static get observedAttributes() {
    return ["active", "text"];
  }

  connectedCallback() {
    if (this.dataset.initialized === "true") return;
    this.dataset.initialized = "true";
    this.#view = this.ownerDocument.defaultView;

    this.setAttribute("role", "status");
    this.setAttribute("aria-live", "polite");
    this.setAttribute("aria-atomic", "true");

    const body = this.ownerDocument.createElement("div");
    body.className = "lht-toast__body";
    body.textContent = this.#normalizedText(this.getAttribute("text") || this.textContent);
    this.replaceChildren(body);
    this.#body = body;
    this.setActive(this.hasAttribute("active"));

    if (this.#view && typeof this.#view.showToast !== "function") {
      this.#view.showToast = (message, durationMs) => this.show(message, durationMs);
    }
  }

  disconnectedCallback() {
    this.#clearHideTimer();
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === "text" && this.#body) {
      this.#body.textContent = this.#normalizedText(newValue);
      return;
    }
    if (name === "active") this.setActive(newValue !== null);
  }

  isVisible() {
    return this.getAttribute("data-visible") === "true";
  }

  show(message, durationMs) {
    this.#clearHideTimer();
    if (this.#body) {
      this.#body.textContent = this.#normalizedText(message || this.getAttribute("text") || this.#body.textContent);
    }
    this.setActive(true);

    const configuredDuration = Number(this.getAttribute("duration-ms"));
    const defaultDuration = Number.isFinite(configuredDuration) && configuredDuration > 0 ? configuredDuration : 1600;
    const requestedDuration = Number(durationMs);
    const hideAfterMs = Number.isFinite(requestedDuration) && requestedDuration > 0 ? requestedDuration : defaultDuration;
    this.#hideTimer = this.#view?.setTimeout(() => this.hide(), hideAfterMs) ?? null;
  }

  hide() {
    this.#clearHideTimer();
    this.setActive(false);
  }

  setActive(active) {
    const visible = Boolean(active);
    this.toggleAttribute("active", visible);
    this.setAttribute("data-visible", visible ? "true" : "false");
    this.setAttribute("aria-hidden", visible ? "false" : "true");
  }

  #normalizedText(value) {
    return String(value || "Done.").trim() || "Done.";
  }

  #clearHideTimer() {
    if (this.#hideTimer !== null) {
      this.#view?.clearTimeout(this.#hideTimer);
      this.#hideTimer = null;
    }
  }

  #body;
  #hideTimer = null;
  #view = null;
}

if (!customElements.get("lht-toast")) {
  customElements.define("lht-toast", LhtToast);
}
