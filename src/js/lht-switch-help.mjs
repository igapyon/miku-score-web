/*
 * Web-owned single-file adaptation of the lht-cmn switch-help control.
 * Licensed under the Apache License, Version 2.0.
 */

class LhtSwitchHelp extends HTMLElement {
  static get observedAttributes() {
    return ["checked", "disabled"];
  }

  connectedCallback() {
    if (this.dataset.initialized === "true") return;
    this.dataset.initialized = "true";

    const switchId = (this.getAttribute("switch-id") || "").trim();
    if (!switchId) return;

    const label = this.ownerDocument.createElement("label");
    label.className = "lht-switch-help__label";
    const field = this.ownerDocument.createElement("input");
    field.id = switchId;
    field.className = "lht-switch-help__field";
    field.type = "checkbox";
    field.checked = this.hasAttribute("checked");
    field.disabled = this.hasAttribute("disabled");
    const labelText = this.ownerDocument.createElement("span");
    labelText.className = "lht-switch-help__label-text";
    labelText.textContent = (this.getAttribute("label") || "").trim();

    label.append(field, labelText);
    const helpText = (this.getAttribute("help-text") || this.getAttribute("help-label") || "").trim();
    if (helpText) {
      const help = this.ownerDocument.createElement("lht-help-tooltip");
      help.setAttribute("label", `${labelText.textContent || "Switch"} help`);
      help.textContent = helpText;
      label.append(help);
    }

    this.replaceChildren(label);
    this.#field = field;
    field.addEventListener("change", () => this.setChecked(field.checked));
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (!this.#field) return;
    if (name === "checked") this.setChecked(newValue !== null);
    if (name === "disabled") this.#field.disabled = newValue !== null;
  }

  get checked() {
    return this.#field?.checked ?? this.hasAttribute("checked");
  }

  set checked(value) {
    this.setChecked(value);
  }

  setChecked(value) {
    const checked = Boolean(value);
    if (this.#field) this.#field.checked = checked;
    this.toggleAttribute("checked", checked);
  }

  #field;
}

if (!customElements.get("lht-switch-help")) {
  customElements.define("lht-switch-help", LhtSwitchHelp);
}
