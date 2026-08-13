/*
 * Web-owned single-file adaptation of the lht-cmn help-tooltip control.
 * Licensed under the Apache License, Version 2.0.
 */

class LhtHelpTooltip extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;

    const label = this.getAttribute("label") || "Help";
    const tooltipId = `lht-help-tooltip-${LhtHelpTooltip.nextId++}`;
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `
      <style>
        :host { display: inline-block; position: relative; vertical-align: middle; }
        button {
          display: inline-grid;
          width: 1.55rem;
          height: 1.55rem;
          padding: 0;
          place-items: center;
          border: 1px solid #8a6dd4;
          border-radius: 50%;
          background: #f3eeff;
          color: #4d2aa5;
          cursor: help;
          font: 700 1rem/1 system-ui, sans-serif;
        }
        button:focus-visible { outline: 3px solid rgb(98 0 238 / 28%); outline-offset: 2px; }
        [role="tooltip"] {
          position: absolute;
          z-index: 10;
          top: calc(100% + .5rem);
          left: 50%;
          display: none;
          width: max-content;
          max-width: min(22rem, calc(100vw - 2rem));
          padding: .65rem .75rem;
          border: 1px solid #8a6dd4;
          border-radius: .65rem;
          background: #2e2540;
          box-shadow: 0 .45rem 1.2rem rgb(28 27 31 / 24%);
          color: #fff;
          font: .84rem/1.45 system-ui, sans-serif;
          text-align: left;
          transform: translateX(-50%);
        }
        :host([open]) [role="tooltip"], :host(:hover) [role="tooltip"], :host(:focus-within) [role="tooltip"] { display: block; }
        @media (max-width: 680px) {
          [role="tooltip"] { left: auto; right: 0; transform: none; }
        }
      </style>
      <button type="button" aria-label="${escapeHtml(label)}" aria-expanded="false" aria-describedby="${tooltipId}">?</button>
      <span id="${tooltipId}" role="tooltip"><slot></slot></span>
    `;

    this.button = root.querySelector("button");
    this.onButtonClick = () => {
      const open = this.toggleAttribute("open");
      this.button.setAttribute("aria-expanded", String(open));
    };
    this.onDocumentPointerDown = (event) => {
      if (event.composedPath().includes(this)) return;
      this.close();
    };
    this.onKeydown = (event) => {
      if (event.key !== "Escape") return;
      this.close();
      this.button.focus();
    };
    this.button.addEventListener("click", this.onButtonClick);
    root.addEventListener("keydown", this.onKeydown);
    document.addEventListener("pointerdown", this.onDocumentPointerDown);
  }

  disconnectedCallback() {
    this.button?.removeEventListener("click", this.onButtonClick);
    this.shadowRoot?.removeEventListener("keydown", this.onKeydown);
    document.removeEventListener("pointerdown", this.onDocumentPointerDown);
  }

  close() {
    this.removeAttribute("open");
    this.button?.setAttribute("aria-expanded", "false");
  }
}

LhtHelpTooltip.nextId = 1;

if (!customElements.get("lht-help-tooltip")) {
  customElements.define("lht-help-tooltip", LhtHelpTooltip);
}

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
