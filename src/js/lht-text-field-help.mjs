/*
 * Web-owned single-file adaptation of the lht-cmn text-field-help control.
 * Licensed under the Apache License, Version 2.0.
 */

class LhtTextFieldHelp extends HTMLElement {
  static get observedAttributes() {
    return ["disabled", "value"];
  }

  connectedCallback() {
    if (this.dataset.initialized === "true") return;
    this.dataset.initialized = "true";

    const fieldId = (this.getAttribute("field-id") || "").trim();
    if (!fieldId) return;

    const isTextarea = (this.getAttribute("type") || "").trim().toLowerCase() === "textarea" || this.hasAttribute("rows");
    const label = this.ownerDocument.createElement("label");
    label.className = "lht-text-field-help__label";
    const labelText = this.ownerDocument.createElement("span");
    labelText.className = "lht-text-field-help__label-text";
    labelText.textContent = (this.getAttribute("label") || "").trim();
    const field = this.ownerDocument.createElement(isTextarea ? "textarea" : "input");
    field.id = fieldId;
    field.className = "lht-text-field-help__field";
    if (!isTextarea && this.hasAttribute("type")) field.type = this.getAttribute("type") || "text";

    for (const name of ["placeholder", "autocomplete", "min", "max", "step", "rows", "maxlength"]) {
      const value = this.getAttribute(name);
      if (value !== null) field.setAttribute(name, value);
    }
    field.required = this.hasAttribute("required");
    field.disabled = this.hasAttribute("disabled");
    if (this.hasAttribute("value")) field.value = this.getAttribute("value") || "";
    const helpText = (this.getAttribute("help-text") || "").trim();
    if (helpText) field.title = helpText;

    label.append(labelText, field);
    this.replaceChildren(label);
    this.#field = field;
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (!this.#field) return;
    if (name === "disabled") {
      this.#field.disabled = newValue !== null;
      return;
    }
    if (name === "value") this.setValue(newValue);
  }

  getValue() {
    return this.#field?.value ?? "";
  }

  setValue(value) {
    if (this.#field) this.#field.value = value == null ? "" : String(value);
  }

  #field;
}

if (!customElements.get("lht-text-field-help")) {
  customElements.define("lht-text-field-help", LhtTextFieldHelp);
}
