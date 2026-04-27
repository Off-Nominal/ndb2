/**
 * Augments Kitajs {@link JSX.HtmlTag} with [Alpine.js directives](https://alpinejs.dev/directives) and
 * common [shorthand `:` / `@` attributes](https://alpinejs.dev/essentials/templating).
 *
 * `x-on` / `x-bind` and modifier-heavy variants (`@click.outside`, `@keydown.meta.enter`, …) are
 * open-ended; use the {@link JSX.HtmlTag.attrs `attrs`} prop for uncommon names, or add more quoted
 * keys here as needed.
 */
export {};

declare global {
  namespace JSX {
    interface HtmlTag {
      /** @see https://alpinejs.dev/directives/x-data */
      "x-data"?: string;
      /** @see https://alpinejs.dev/directives/x-init */
      "x-init"?: string;
      /** @see https://alpinejs.dev/directives/x-show */
      "x-show"?: string;
      /** @see https://alpinejs.dev/directives/x-transition */
      "x-transition"?: boolean | string;
      /** @see https://alpinejs.dev/directives/x-cloak */
      "x-cloak"?: boolean | string;
      /** @see https://alpinejs.dev/directives/x-ignore */
      "x-ignore"?: boolean | string;
      /** @see https://alpinejs.dev/directives/x-text */
      "x-text"?: string;
      /** @see https://alpinejs.dev/directives/x-html */
      "x-html"?: string;
      /** @see https://alpinejs.dev/directives/x-model */
      "x-model"?: string;
      /** @see https://alpinejs.dev/directives/x-modelable */
      "x-modelable"?: string;
      /** @see https://alpinejs.dev/directives/x-id */
      "x-id"?: string;
      /** @see https://alpinejs.dev/directives/x-for */
      "x-for"?: string;
      /** @see https://alpinejs.dev/directives/x-if */
      "x-if"?: string;
      /** @see https://alpinejs.dev/directives/x-effect */
      "x-effect"?: string;
      /** @see https://alpinejs.dev/directives/x-ref */
      "x-ref"?: string;
      /** @see https://alpinejs.dev/directives/teleport */
      "x-teleport"?: string;
      /** @see https://alpinejs.dev/plugins/trap (focus) */
      "x-trap"?: string;
      /** @see https://alpinejs.dev/docs/streaming */
      "x-stream"?: string;
      /** @see https://alpinejs.dev/plugins/intersect */
      "x-intersect"?: string;
      /** @see https://alpinejs.dev/plugins/mask */
      "x-mask"?: string;
      /** @see https://alpinejs.dev/plugins/collapse */
      "x-collapse"?: string;

      /** @see `x-bind` — e.g. `x-bind:disabled` */
      "x-bind:class"?: string;
      "x-bind:style"?: string;
      "x-bind:disabled"?: string;
      "x-bind:open"?: string;
      "x-bind:readonly"?: string;
      "x-bind:required"?: string;
      "x-bind:multiple"?: string;
      "x-bind:selected"?: string;
      "x-bind:show"?: string;
      "x-bind:checked"?: string;
      "x-bind:aria-hidden"?: string;
      "x-bind:tabindex"?: string;

      /** @see [Shorthand for `x-bind`](https://alpinejs.dev/essentials/templating#binding) */
      ":class"?: string;
      ":style"?: string;
      ":id"?: string;
      ":name"?: string;
      ":type"?: string;
      ":value"?: string;
      ":disabled"?: string;
      ":open"?: string;
      ":checked"?: string;
      ":readonly"?: string;
      ":required"?: string;
      ":multiple"?: string;
      ":selected"?: string;
      ":for"?: string;
      ":href"?: string;
      ":src"?: string;
      ":title"?: string;
      ":placeholder"?: string;
      ":tabindex"?: string;
      ":role"?: string;
      ":show"?: string;
      /** Template key in `x-for` */
      ":key"?: string;

      /**
       * @see `x-on` — e.g. `x-on:click.prevent` as `x-on:click` with modifiers, or
       * [shorthand `@`](https://alpinejs.dev/essentials/templating#event-listeners)
       */
      "x-on:click"?: string;
      "x-on:click.prevent"?: string;
      "x-on:click.stop"?: string;
      "x-on:click.outside"?: string;
      "x-on:submit"?: string;
      "x-on:change"?: string;
      "x-on:input"?: string;
      "x-on:keydown"?: string;
      "x-on:keydown.escape"?: string;
      "x-on:keydown.enter"?: string;
      "x-on:click.window"?: string;
      "x-on:load"?: string;
      "x-on:error"?: string;
      "x-on:scroll"?: string;
      "x-on:submit.prevent"?: string;
      "x-on:toggle"?: string;
      "x-on:focus"?: string;
      "x-on:blur"?: string;
      "x-on:select"?: string;
      "x-on:select.prevent"?: string;
      "x-on:resize.window"?: string;
      "x-on:intersect"?: string;

      /** Shorthand for `x-on` */
      "@click"?: string;
      "@click.prevent"?: string;
      "@click.stop"?: string;
      "@click.outside"?: string;
      "@click.window"?: string;
      "@click.document"?: string;
      "@click.self"?: string;
      "@submit"?: string;
      "@submit.prevent"?: string;
      "@change"?: string;
      "@input"?: string;
      "@keydown"?: string;
      "@keydown.escape"?: string;
      "@keydown.enter"?: string;
      "@keyup"?: string;
      "@keypress"?: string;
      "@focus"?: string;
      "@blur"?: string;
      "@load"?: string;
      "@error"?: string;
      "@scroll"?: string;
      "@scroll.window"?: string;
      "@resize"?: string;
      "@resize.window"?: string;
      "@mousedown"?: string;
      "@mouseup"?: string;
      "@mouseenter"?: string;
      "@mouseleave"?: string;
      "@intersect"?: string;
      "@toggle"?: string;
    }
  }
}
