const dropdownXData = `{
  open: false,
  toggle() {
    if (this.open) {
      return this.close();
    }
    this.$refs.button.focus();
    this.open = true;
  },
  close(focusAfter) {
    if (!this.open) return;
    this.open = false;
    focusAfter && focusAfter.focus();
  }
}`;

/**
 * In TSX, names like `x-on:...` and `@...` with dots are not valid as bare prop names. Put them
 * in a spread object with a string key, same as `hx-*` spreads in `page-layout`.
 */
const keydownClose = {
  "x-on:keydown.escape.prevent.stop": "close($refs.button)",
  "x-on:focusin.window": "! $refs.panel.contains($event.target) && close()",
  "x-id": "['dropdown-button']"
} as const;

// Equivalent Alpine, if you prefer the `@` prefix:
// { "@keydown.escape.prevent.stop": "close($refs.button)" }

export function AlpineSelect(): JSX.Element {
  return (
    <div class="flex justify-center">
      <div
        x-data={dropdownXData}
        {...keydownClose}
      />
    </div>
  );
}
