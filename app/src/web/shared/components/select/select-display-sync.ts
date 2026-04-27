/// <reference lib="dom" />
/**
 * Shared by `select.client.ts` and `preferences-form.client.ts` (separate esbuild bundles).
 */

/**
 * Resolves the visible label for the current `native.value` (prefer `value` over `selectedIndex`,
 * and `textContent` / `label` over legacy `.text`, which can be empty in some DOM states).
 */
export function optionDisplayLabelForNativeSelect(native: HTMLSelectElement): string {
  const v = native.value;
  for (let i = 0; i < native.options.length; i++) {
    const o = native.options[i]!;
    if (o.value === v) {
      return (o.textContent?.trim() || o.label?.trim() || o.value).trim() || o.value;
    }
  }
  if (native.selectedIndex >= 0) {
    const o = native.options[native.selectedIndex]!;
    return (o.textContent?.trim() || o.label?.trim() || o.value).trim() || v;
  }
  return v;
}

export function syncUIFromNative(root: HTMLElement): void {
  const native = root.querySelector<HTMLSelectElement>("[data-select-native]");
  const valueEl = root.querySelector("[data-select-value]");
  if (native == null || valueEl == null) {
    return;
  }
  const display = optionDisplayLabelForNativeSelect(native);
  if (display !== "") {
    valueEl.textContent = display;
  }
  const options = root.querySelectorAll<HTMLElement>("[data-select-option]");
  for (let i = 0; i < options.length; i++) {
    const li = options[i]!;
    const optVal = li.dataset.value ?? "";
    li.setAttribute("aria-selected", optVal === native.value ? "true" : "false");
  }
}
