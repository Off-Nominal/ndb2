/**
 * Augments Kitajs {@link JSX.HtmlTag} with [HTMX core attributes](https://htmx.org/reference/#attributes).
 *
 * **hx-on:** Event handlers use colons (`hx-on:click`, `hx-on::before-request`) or JSX-friendly
 * [dash forms](https://htmx.org/attributes/hx-on/) (`hx-on--before-request`). Those names are
 * open-ended; use the {@link JSX.HtmlTag.attrs `attrs`} prop for uncommon `hx-on` variants, or
 * add more quoted keys here as needed.
 */
export {};

declare global {
  namespace JSX {
    /** Common `hx-swap` values; modifiers (e.g. `innerHTML swap:1s`) are still valid `string`s. */
    type htmx_swap =
      | "innerHTML"
      | "outerHTML"
      | "textContent"
      | "beforebegin"
      | "afterbegin"
      | "beforeend"
      | "afterend"
      | "delete"
      | "none"
      | string;

    interface HtmlTag {
      /** @see https://htmx.org/attributes/hx-get/ */
      "hx-get"?: string;
      /** @see https://htmx.org/attributes/hx-post/ */
      "hx-post"?: string;
      /** @see https://htmx.org/attributes/hx-put/ */
      "hx-put"?: string;
      /** @see https://htmx.org/attributes/hx-patch/ */
      "hx-patch"?: string;
      /** @see https://htmx.org/attributes/hx-delete/ */
      "hx-delete"?: string;

      /** @see https://htmx.org/attributes/hx-push-url/ */
      "hx-push-url"?: string | boolean;
      /** @see https://htmx.org/attributes/hx-select/ */
      "hx-select"?: string;
      /** @see https://htmx.org/attributes/hx-select-oob/ */
      "hx-select-oob"?: string;
      /** @see https://htmx.org/attributes/hx-swap/ */
      "hx-swap"?: htmx_swap;
      /** @see https://htmx.org/attributes/hx-swap-oob/ */
      "hx-swap-oob"?: string;
      /** @see https://htmx.org/attributes/hx-target/ */
      "hx-target"?: string;
      /** @see https://htmx.org/attributes/hx-trigger/ */
      "hx-trigger"?: string;
      /** @see https://htmx.org/attributes/hx-vals/ */
      "hx-vals"?: string;

      /** @see https://htmx.org/attributes/hx-boost/ */
      "hx-boost"?: string | boolean;
      /** @see https://htmx.org/attributes/hx-confirm/ */
      "hx-confirm"?: string;
      /** @see https://htmx.org/attributes/hx-disable/ */
      "hx-disable"?: string | boolean;
      /** @see https://htmx.org/attributes/hx-disabled-elt/ */
      "hx-disabled-elt"?: string;
      /** @see https://htmx.org/attributes/hx-disinherit/ */
      "hx-disinherit"?: string;
      /** @see https://htmx.org/attributes/hx-encoding/ */
      "hx-encoding"?: string;
      /** @see https://htmx.org/attributes/hx-ext/ */
      "hx-ext"?: string;
      /** @see https://htmx.org/attributes/hx-headers/ */
      "hx-headers"?: string;
      /** @see https://htmx.org/attributes/hx-history/ */
      "hx-history"?: string | boolean;
      /** @see https://htmx.org/attributes/hx-history-elt/ */
      "hx-history-elt"?: string;
      /** @see https://htmx.org/attributes/hx-include/ */
      "hx-include"?: string;
      /** @see https://htmx.org/attributes/hx-indicator/ */
      "hx-indicator"?: string;
      /** @see https://htmx.org/attributes/hx-inherit/ */
      "hx-inherit"?: string;
      /** @see https://htmx.org/attributes/hx-params/ */
      "hx-params"?: string;
      /** @see https://htmx.org/attributes/hx-preserve/ */
      "hx-preserve"?: string;
      /** @see https://htmx.org/attributes/hx-prompt/ */
      "hx-prompt"?: string;
      /** @see https://htmx.org/attributes/hx-replace-url/ */
      "hx-replace-url"?: string | boolean;
      /** @see https://htmx.org/attributes/hx-request/ */
      "hx-request"?: string;
      /** @see https://htmx.org/attributes/hx-sync/ */
      "hx-sync"?: string;
      /** @see https://htmx.org/attributes/hx-validate/ */
      "hx-validate"?: string | boolean;
      /**
       * @deprecated Prefer {@linkcode "hx-vals"}.
       * @see https://htmx.org/attributes/hx-vars/
       */
      "hx-vars"?: string;

      /**
       * Legacy multi-handler form (`htmx:beforeRequest: …`).
       * @see https://htmx.org/attributes/hx-on/
       */
      "hx-on"?: string;

      /**
       * Shorthand htmx event handler (equivalent to `hx-on::before-request`).
       * @see https://htmx.org/attributes/hx-on/
       */
      "hx-on--before-request"?: string;
      "hx-on--after-request"?: string;
      "hx-on--before-on-load"?: string;
      "hx-on--after-on-load"?: string;
      /**
       * DOM / htmx events using dash form instead of colons, e.g. `click`.
       * @see https://htmx.org/attributes/hx-on/
       */
      "hx-on--click"?: string;
      "hx-on--submit"?: string;
      "hx-on--change"?: string;
    }
  }
}
