/*
 * Web-owned single-file adaptation of the lht-cmn error-alert control.
 * Licensed under the Apache License, Version 2.0.
 */

class LhtErrorAlert extends HTMLElement {
  static get observedAttributes() {
    return ["text", "active", "variant"];
  }

  connectedCallback() {
    if (this.dataset.initialized === "true") return;
    this.dataset.initialized = "true";
    this.setAttribute("aria-atomic", "true");

    const initialText = (this.getAttribute("text") || this.textContent || "").trim();
    this.replaceChildren();
    this.body = document.createElement("p");
    this.body.className = "lht-error-alert__body";
    this.body.textContent = initialText;
    this.appendChild(this.body);

    this.syncVariant();
    this.setActive(this.hasAttribute("active"));
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === "text") {
      if (this.body) this.body.textContent = (newValue || "").trim();
      return;
    }
    if (name === "variant") {
      this.syncVariant();
      return;
    }
    if (name === "active") this.syncVisibility(newValue !== null);
  }

  isVisible() {
    return this.getAttribute("data-visible") === "true";
  }

  show(message) {
    const text = String(message || this.getAttribute("text") || "").trim();
    if (this.body) this.body.textContent = text;
    this.setActive(text.length > 0);
  }

  clear() {
    if (this.body) this.body.textContent = "";
    this.hide();
  }

  hide() {
    this.setActive(false);
  }

  setActive(active) {
    const visible = Boolean(active);
    this.toggleAttribute("active", visible);
    this.syncVisibility(visible);
  }

  normalizeVariant(value) {
    const variant = String(value || "error").trim().toLowerCase();
    return ["error", "warning", "info"].includes(variant) ? variant : "error";
  }

  syncVariant() {
    const variant = this.normalizeVariant(this.getAttribute("variant"));
    if (this.getAttribute("variant") !== variant) {
      this.setAttribute("variant", variant);
      return;
    }
    this.setAttribute("data-variant", variant);
    if (variant === "error") {
      this.setAttribute("role", "alert");
      this.setAttribute("aria-live", "assertive");
      return;
    }
    this.setAttribute("role", "status");
    this.setAttribute("aria-live", "polite");
  }

  syncVisibility(visible) {
    this.setAttribute("data-visible", visible ? "true" : "false");
    this.setAttribute("aria-hidden", visible ? "false" : "true");
  }
}

if (!customElements.get("lht-error-alert")) {
  customElements.define("lht-error-alert", LhtErrorAlert);
}
