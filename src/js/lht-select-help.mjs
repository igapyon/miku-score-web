/*
 * Web-owned single-file adaptation of the lht-cmn select-help control.
 * Licensed under the Apache License, Version 2.0.
 */

class LhtSelectHelp extends HTMLElement {
  static get observedAttributes() {
    return ["disabled", "value"];
  }

  connectedCallback() {
    if (this.dataset.initialized === "true") return;
    this.dataset.initialized = "true";

    const fieldId = (this.getAttribute("field-id") || "").trim();
    if (!fieldId) return;

    const options = this.#readOptions();
    const label = this.ownerDocument.createElement("label");
    label.className = "lht-select-help__label";
    const labelText = this.ownerDocument.createElement("span");
    labelText.className = "lht-select-help__label-text";
    labelText.textContent = (this.getAttribute("label") || "").trim();
    const field = this.ownerDocument.createElement("select");
    field.id = fieldId;
    field.className = "lht-select-help__field";
    field.disabled = this.hasAttribute("disabled");
    field.required = this.hasAttribute("required");
    const helpText = (this.getAttribute("help-text") || "").trim();
    if (helpText) field.title = helpText;

    label.append(labelText, field);
    this.replaceChildren(label);
    this.#field = field;
    this.setOptions(options, { preserveValue: false });
    if (this.hasAttribute("value")) this.setValue(this.getAttribute("value"));
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

  setOptions(rawOptions, { preserveValue = true } = {}) {
    if (!this.#field) return;
    const previousValue = preserveValue ? this.#field.value : "";
    const options = this.#normalizeOptions(rawOptions);
    this.#field.replaceChildren();
    for (const entry of options) {
      const option = this.ownerDocument.createElement("option");
      option.value = entry.value;
      option.textContent = entry.label;
      option.disabled = entry.disabled;
      option.selected = entry.selected;
      this.#field.append(option);
    }
    if (previousValue && options.some((entry) => entry.value === previousValue)) {
      this.#field.value = previousValue;
    }
  }

  #readOptions() {
    const script = this.querySelector("script[type='application/json'][slot='options']");
    if (!script) return [];
    try {
      return JSON.parse(script.textContent || "[]");
    } catch {
      return [];
    }
  }

  #normalizeOptions(rawOptions) {
    if (!Array.isArray(rawOptions)) return [];
    return rawOptions
      .map((entry) => ({
        value: String(entry?.value ?? entry?.label ?? ""),
        label: String(entry?.label ?? entry?.text ?? entry?.value ?? ""),
        selected: entry?.selected === true,
        disabled: entry?.disabled === true,
      }))
      .filter((entry) => entry.value || entry.label);
  }

  #field;
}

if (!customElements.get("lht-select-help")) {
  customElements.define("lht-select-help", LhtSelectHelp);
}
