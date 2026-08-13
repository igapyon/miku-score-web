/*
 * Web-owned single-file adaptation of the lht-cmn file-select control.
 * Licensed under the Apache License, Version 2.0.
 */

class LhtFileSelect extends HTMLElement {
  connectedCallback() {
    if (this.dataset.initialized === "true") return;
    this.dataset.initialized = "true";

    const inputId = (this.getAttribute("input-id") || "scoreFile").trim();
    const buttonId = (this.getAttribute("button-id") || "selectScoreFile").trim();
    const fileNameId = (this.getAttribute("file-name-id") || "selectedScoreFileName").trim();
    const accept = (this.getAttribute("accept") || "").trim();
    const buttonLabel = (this.getAttribute("button-label") || "Choose file").trim();
    const placeholder = (this.getAttribute("placeholder") || "No file selected").trim();
    const showFileName = this.hasAttribute("show-file-name");
    const autoOpen = (this.getAttribute("auto-open") || "").trim().toLowerCase() !== "false";

    this.replaceChildren();

    const triggerButton = document.createElement("button");
    triggerButton.id = buttonId;
    triggerButton.type = "button";
    triggerButton.className = "lht-file-select__button";
    triggerButton.textContent = buttonLabel;

    const input = document.createElement("input");
    input.id = inputId;
    input.type = "file";
    input.className = "lht-file-select__input";
    input.hidden = true;
    if (accept) input.accept = accept;
    if (this.hasAttribute("multiple")) input.multiple = true;
    if (this.hasAttribute("disabled")) {
      input.disabled = true;
      triggerButton.disabled = true;
    }
    triggerButton.setAttribute("aria-controls", inputId);

    const fileName = document.createElement("span");
    fileName.id = fileNameId;
    fileName.className = "lht-file-select__file-name";
    fileName.textContent = placeholder;
    fileName.setAttribute("aria-live", "polite");
    if (!showFileName) fileName.hidden = true;

    triggerButton.addEventListener("click", () => {
      const beforeOpenEvent = new CustomEvent("lht-file-select:before-open", {
        detail: { inputId, buttonId, input, triggerButton, autoOpen },
        bubbles: true,
        cancelable: true,
      });
      if (autoOpen && this.dispatchEvent(beforeOpenEvent)) input.click();
    });
    input.addEventListener("change", () => {
      const files = Array.from(input.files || []);
      const names = files.map((file) => file.name).filter(Boolean);
      fileName.textContent = names.length > 0 ? names.join(", ") : placeholder;
      this.dispatchEvent(new CustomEvent("lht-file-select:change", {
        detail: { files, names, input, fileName },
        bubbles: true,
      }));
    });

    this.append(triggerButton, fileName, input);
  }
}

if (!customElements.get("lht-file-select")) {
  customElements.define("lht-file-select", LhtFileSelect);
}
