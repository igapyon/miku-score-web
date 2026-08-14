/*
 * Web-owned single-file adaptation of the lht-cmn loading-overlay control.
 * Licensed under the Apache License, Version 2.0.
 */

class LhtLoadingOverlay extends HTMLElement {
  static get observedAttributes() {
    return ["active", "text"];
  }

  connectedCallback() {
    if (this.dataset.initialized === "true") return;
    this.dataset.initialized = "true";

    this.setAttribute("role", "status");
    this.setAttribute("aria-live", "polite");

    const dialog = document.createElement("div");
    dialog.className = "lht-loading-overlay__dialog";

    const spinner = document.createElement("div");
    spinner.className = "lht-loading-overlay__spinner";
    spinner.setAttribute("aria-hidden", "true");

    const message = document.createElement("p");
    message.className = "lht-loading-overlay__text";
    message.textContent = this.#normalizedText(this.getAttribute("text"));

    dialog.append(spinner, message);
    this.replaceChildren(dialog);
    this.#messageNode = message;
    this.setActive(this.hasAttribute("active"));
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === "text" && this.#messageNode) {
      this.#messageNode.textContent = this.#normalizedText(newValue);
      return;
    }
    if (name === "active") this.setActive(newValue !== null);
  }

  isActive() {
    return this.hasAttribute("active");
  }

  setActive(inProgress) {
    const next = Boolean(inProgress);
    this.toggleAttribute("active", next);
    this.setAttribute("aria-hidden", next ? "false" : "true");

    const busyTargetId = (this.getAttribute("busy-target-id") || "").trim();
    if (busyTargetId) {
      document.getElementById(busyTargetId)?.setAttribute("aria-busy", next ? "true" : "false");
    }

    const disableTargetIds = (this.getAttribute("disable-target-ids") || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    for (const id of disableTargetIds) {
      const target = document.getElementById(id);
      if (target && "disabled" in target) target.disabled = next;
    }
  }

  waitForNextPaint() {
    return new Promise((resolve) => {
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(resolve);
        return;
      }
      setTimeout(resolve, 0);
    });
  }

  #normalizedText(value) {
    return (value || "Loading...").trim() || "Loading...";
  }

  #messageNode;
}

if (!customElements.get("lht-loading-overlay")) {
  customElements.define("lht-loading-overlay", LhtLoadingOverlay);
}
