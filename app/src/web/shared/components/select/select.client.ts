import Fuse from "fuse.js";
import { syncUIFromNative } from "./select-display-sync.js";

/**
 * Custom select: toggle listbox, sync hidden native `<select>` for forms + bubbling `change`.
 * Panel placement: flips above/below from viewport + caps `max-height` so the list stays on-screen.
 * **`data-select-searchable`**: fuzzy filter with Fuse.js while the panel is open.
 */

/** Matches `max-height: 16rem` in `select.css`. */
const LIST_MAX_HEIGHT_REM = 16;
/** Inset from the visual viewport (px). */
const VIEWPORT_EDGE = 8;

function readListMaxHeightPx(): number {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  return LIST_MAX_HEIGHT_REM * rem;
}

/** Usable width/height (visual viewport when available so keyboard/shrinking chrome is considered). */
function getUsableViewport(): { w: number; h: number } {
  if (window.visualViewport != null) {
    return { w: window.visualViewport.width, h: window.visualViewport.height };
  }
  return { w: window.innerWidth, h: window.innerHeight };
}

/**
 * Flip list above or below the trigger, clamp `max-height`, and nudge horizontally if the panel
 * would overflow the viewport. Safe to call while the list is visible (e.g. after open, on scroll/resize).
 */
function placeSelectInViewport(root: HTMLElement, listEl: HTMLElement, triggerEl: HTMLElement): void {
  if (listEl.hidden) {
    return;
  }

  /** Changing `max-height` resets `scrollTop` in browsers — preserve so wheel/trackpad scroll isn't undone. */
  const preservedScrollTop = listEl.scrollTop;

  const { w: vw, h: vh } = getUsableViewport();
  const tr = triggerEl.getBoundingClientRect();
  const spaceBelow = vh - tr.bottom - VIEWPORT_EDGE;
  const spaceAbove = tr.top - VIEWPORT_EDGE;

  listEl.style.maxHeight = "none";
  void listEl.offsetHeight;
  void listEl.getBoundingClientRect();
  const natural = Math.max(listEl.scrollHeight, 1);
  const maxCap = readListMaxHeightPx();
  const ideal = Math.min(natural, maxCap);

  type Placement = "above" | "below";
  let placement: Placement;
  let maxH: number;

  if (ideal <= spaceBelow) {
    placement = "below";
    maxH = ideal;
  } else if (ideal <= spaceAbove) {
    placement = "above";
    maxH = ideal;
  } else if (spaceBelow >= spaceAbove) {
    placement = "below";
    maxH = Math.max(0, spaceBelow);
  } else {
    placement = "above";
    maxH = Math.max(0, spaceAbove);
  }
  maxH = Math.min(maxH, maxCap);

  if (maxH < 1) {
    maxH = Math.min(ideal, 120, maxCap);
  }
  maxH = Math.floor(maxH);
  maxH = Math.max(maxH, 1);
  listEl.style.maxHeight = `${maxH}px`;

  void listEl.offsetHeight;
  const maxScroll = Math.max(0, listEl.scrollHeight - listEl.clientHeight);
  listEl.scrollTop = Math.min(maxScroll, Math.max(0, preservedScrollTop));

  root.dataset.selectPlacement = placement;

  void listEl.offsetHeight;
  const lr = listEl.getBoundingClientRect();
  const edgeLeft = VIEWPORT_EDGE;
  const edgeRight = vw - VIEWPORT_EDGE;
  if (lr.left < edgeLeft) {
    const shift = edgeLeft - lr.left;
    listEl.style.transform = `translateX(${Math.ceil(shift)}px)`;
  } else if (lr.right > edgeRight) {
    const shift = edgeRight - lr.right;
    listEl.style.transform = `translateX(${Math.floor(shift)}px)`;
  } else {
    listEl.style.removeProperty("transform");
  }
}

function clearSelectPlacement(listEl: HTMLElement, root: HTMLElement): void {
  listEl.style.maxHeight = "";
  listEl.style.removeProperty("transform");
  delete root.dataset.selectPlacement;
}

function initSelect(root: HTMLElement): void {
  if (root.dataset.selectInit === "1") {
    return;
  }
  root.dataset.selectInit = "1";

  const native = root.querySelector<HTMLSelectElement>("[data-select-native]");
  const trigger = root.querySelector<HTMLElement>("[data-select-trigger]");
  const list = root.querySelector<HTMLElement>("[data-select-list]");
  if (native == null || trigger == null || list == null) {
    return;
  }

  const nativeSelect = native;
  const listEl = list;
  const triggerEl = trigger;
  const triggerField = root.querySelector<HTMLElement>("[data-select-trigger-field]");
  /** Full trigger row (searchable) vs focusable control alone — used for panel **`getBoundingClientRect`**. */
  const layoutAnchorEl = triggerField ?? triggerEl;
  const searchable = root.dataset.selectSearchable === "true";
  /** Stable DOM order for **`restoreOptionDomOrder`** after Fuse reorders matches by relevance. */
  const originalOptionOrder = searchable
    ? [...root.querySelectorAll<HTMLElement>("[data-select-option]")]
    : [];

  let activeIndex: number | null = null;
  let lastHighlightedValue: string | null = null;
  let rafViewport: number | null = null;

  const onViewportChange = (): void => {
    if (listEl.hidden) {
      return;
    }
    if (rafViewport != null) {
      cancelAnimationFrame(rafViewport);
    }
    rafViewport = requestAnimationFrame(() => {
      rafViewport = null;
      placeSelectInViewport(root, listEl, layoutAnchorEl);
    });
  };

  function attachViewportListeners(): void {
    window.addEventListener("scroll", onViewportChange);
    window.addEventListener("resize", onViewportChange);
    if (window.visualViewport != null) {
      window.visualViewport.addEventListener("resize", onViewportChange);
    }
  }

  function detachViewportListeners(): void {
    if (rafViewport != null) {
      cancelAnimationFrame(rafViewport);
      rafViewport = null;
    }
    window.removeEventListener("scroll", onViewportChange);
    window.removeEventListener("resize", onViewportChange);
    if (window.visualViewport != null) {
      window.visualViewport.removeEventListener("resize", onViewportChange);
    }
  }

  const onDocPointerDown = (e: Event): void => {
    if (!root.contains(e.target as Node)) {
      closePanel();
    }
  };

  const onDocKeyDown = (e: KeyboardEvent): void => {
    if (listEl.hidden) {
      return;
    }
    if (e.key !== "Escape") {
      return;
    }
    e.preventDefault();
    closePanel();
  };

  const ACTIVE_OPTION_CLASS = "select__option--keyboard-active";

  function optionElementsForNav(): HTMLElement[] {
    return [...root.querySelectorAll<HTMLElement>("[data-select-option]")].filter((li) => !li.hidden);
  }

  function pickInitialActiveIndex(items: HTMLElement[]): number {
    const v = nativeSelect.value;
    const i = items.findIndex((li) => (li.dataset.value ?? "") === v);
    return i >= 0 ? i : 0;
  }

  function restoreOptionDomOrder(): void {
    if (!searchable || originalOptionOrder.length === 0) {
      return;
    }
    for (const li of originalOptionOrder) {
      listEl.appendChild(li);
    }
  }

  function clearSearchFilter(): void {
    if (!searchable) {
      return;
    }
    restoreOptionDomOrder();
    for (const li of root.querySelectorAll<HTMLElement>("[data-select-option]")) {
      li.hidden = false;
    }
  }

  function applySearchFilter(raw: string): void {
    if (!searchable) {
      return;
    }
    const q = raw.trim();
    const all = [...root.querySelectorAll<HTMLElement>("[data-select-option]")];

    if (q === "") {
      restoreOptionDomOrder();
      all.forEach((li) => {
        li.hidden = false;
      });
    } else {
      type FuseRow = { label: string; el: HTMLElement };
      const corpus: FuseRow[] = all.map((el) => ({
        label: el.dataset.selectSearchLabel ?? el.textContent?.trim() ?? "",
        el,
      }));
      const fuse = new Fuse(corpus, {
        keys: ["label"],
        threshold: 0.38,
        ignoreLocation: true,
        minMatchCharLength: 1,
        shouldSort: true,
      });
      const matchedInRelevanceOrder = fuse.search(q).map((r) => r.item.el);
      const matchedSet = new Set(matchedInRelevanceOrder);

      for (const li of matchedInRelevanceOrder) {
        listEl.appendChild(li);
        li.hidden = false;
      }
      for (const li of originalOptionOrder) {
        if (!matchedSet.has(li)) {
          listEl.appendChild(li);
          li.hidden = true;
        }
      }
    }
    requestAnimationFrame(() => placeSelectInViewport(root, listEl, layoutAnchorEl));
  }

  function setActiveOption(items: HTMLElement[], index: number | null): void {
    const all = [...root.querySelectorAll<HTMLElement>("[data-select-option]")];
    for (const li of all) {
      li.removeAttribute("data-select-option-active");
      li.classList.remove(ACTIVE_OPTION_CLASS);
    }

    if (index == null || items.length === 0 || items[index] == null) {
      triggerEl.removeAttribute("aria-activedescendant");
      lastHighlightedValue = null;
      return;
    }

    const activeLi = items[index]!;
    const id = activeLi.id;
    if (id != null && id !== "") {
      triggerEl.setAttribute("aria-activedescendant", id);
    } else {
      triggerEl.removeAttribute("aria-activedescendant");
    }

    activeLi.setAttribute("data-select-option-active", "true");
    activeLi.classList.add(ACTIVE_OPTION_CLASS);
    activeLi.scrollIntoView({ block: "nearest" });
    lastHighlightedValue = activeLi.dataset.value ?? null;
  }

  function detachGlobalListeners(): void {
    document.removeEventListener("pointerdown", onDocPointerDown, true);
    document.removeEventListener("keydown", onDocKeyDown, true);
  }

  function setOpen(open: boolean): void {
    if (!open) {
      clearSelectPlacement(listEl, root);
      detachGlobalListeners();
      detachViewportListeners();
      if (searchable) {
        clearSearchFilter();
        if (triggerEl instanceof HTMLInputElement) {
          triggerEl.readOnly = true;
        }
      }
    }
    listEl.hidden = !open;
    triggerEl.setAttribute("aria-expanded", open ? "true" : "false");
    root.classList.toggle("select--open", open);
    if (!open) {
      const items = [...root.querySelectorAll<HTMLElement>("[data-select-option]")];
      setActiveOption(items, null);
      activeIndex = null;
    }
  }

  function closePanel(): void {
    setOpen(false);
    syncUIFromNative(root);
    triggerEl.focus({ preventScroll: true });
  }

  function openPanel(): void {
    document.addEventListener("pointerdown", onDocPointerDown, true);
    document.addEventListener("keydown", onDocKeyDown, true);
    attachViewportListeners();
    listEl.hidden = false;
    triggerEl.setAttribute("aria-expanded", "true");
    root.classList.add("select--open");
    clearSearchFilter();
    if (searchable && triggerEl instanceof HTMLInputElement) {
      triggerEl.readOnly = false;
      triggerEl.value = "";
    }
    const items = optionElementsForNav();
    activeIndex = items.length === 0 ? null : pickInitialActiveIndex(items);
    setActiveOption(items, activeIndex);
    requestAnimationFrame(() => {
      placeSelectInViewport(root, listEl, layoutAnchorEl);
      requestAnimationFrame(() => {
        placeSelectInViewport(root, listEl, layoutAnchorEl);
      });
    });
  }

  function commitValue(value: string, close: boolean): void {
    const prev = nativeSelect.value;
    nativeSelect.value = value;
    if (prev !== value) {
      nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));
    }
    syncUIFromNative(root);
    if (close) {
      closePanel();
    }
  }

  triggerEl.addEventListener("click", () => {
    if (listEl.hidden) {
      openPanel();
    } else if (!searchable) {
      closePanel();
    }
  });

  /**
   * Chevron uses **`pointer-events: none`** — hits fall through to **`select__trigger-field`**.
   * Focus stays on the combobox **`input`**; ring wraps the row via **`ring-has-focus-visible`**.
   */
  if (searchable && triggerField != null) {
    triggerField.addEventListener("click", (e: MouseEvent) => {
      const t = e.target;
      if (t instanceof Node && triggerEl.contains(t)) {
        return;
      }
      triggerEl.focus({ preventScroll: true });
      if (listEl.hidden) {
        openPanel();
      }
    });
  }

  function handleListboxNavigationKeys(key: string): void {
    const items = optionElementsForNav();
    if (items.length === 0) {
      return;
    }

    if (key === "ArrowDown") {
      activeIndex =
        activeIndex == null ? pickInitialActiveIndex(items) : Math.min(activeIndex + 1, items.length - 1);
    } else if (key === "ArrowUp") {
      activeIndex =
        activeIndex == null ? pickInitialActiveIndex(items) : Math.max(activeIndex - 1, 0);
    } else if (key === "Home") {
      activeIndex = 0;
    } else if (key === "End") {
      activeIndex = items.length - 1;
    } else if (key === "Enter" || (!searchable && key === " ")) {
      const idx = activeIndex ?? pickInitialActiveIndex(items);
      const v = items[idx]?.dataset.value;
      if (v != null) {
        commitValue(v, true);
      }
      return;
    } else {
      return;
    }

    setActiveOption(items, activeIndex);
  }

  triggerEl.addEventListener("keydown", (e: KeyboardEvent) => {
    if (!listEl.hidden) {
      if (e.key === "Tab") {
        setOpen(false);
        syncUIFromNative(root);
        return;
      }
      const navigates =
        e.key === "ArrowDown" ||
        e.key === "ArrowUp" ||
        e.key === "Enter" ||
        e.key === "Home" ||
        e.key === "End" ||
        (!searchable && e.key === " ");
      if (navigates) {
        e.preventDefault();
        handleListboxNavigationKeys(e.key);
      }
      return;
    }

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPanel();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      openPanel();
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      openPanel();
      return;
    }
  });

  if (searchable && triggerEl instanceof HTMLInputElement) {
    triggerEl.addEventListener("input", () => {
      if (listEl.hidden) {
        return;
      }
      const keep = lastHighlightedValue;
      applySearchFilter(triggerEl.value);
      const visible = optionElementsForNav();
      if (visible.length === 0) {
        activeIndex = null;
        setActiveOption([], null);
        return;
      }
      let idx = keep != null ? visible.findIndex((li) => (li.dataset.value ?? "") === keep) : -1;
      if (idx < 0) {
        idx = pickInitialActiveIndex(visible);
      }
      activeIndex = idx;
      setActiveOption(visible, activeIndex);
    });
  }

  listEl.addEventListener("mousedown", (e: MouseEvent) => {
    if (listEl.hidden || e.button !== 0) {
      return;
    }
    if ((e.target as HTMLElement).closest("[data-select-option]") != null) {
      return;
    }
    e.preventDefault();
  });

  listEl.addEventListener(
    "wheel",
    (e: WheelEvent) => {
      if (listEl.hidden) {
        return;
      }
      if (listEl.scrollHeight <= listEl.clientHeight + 2) {
        return;
      }

      let dy = e.deltaY;
      if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) {
        dy *= 16;
      } else if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
        dy *= listEl.clientHeight;
      }

      const st = listEl.scrollTop;
      const maxSt = listEl.scrollHeight - listEl.clientHeight;
      const eps = 1;

      if (dy > 0 && st < maxSt - eps) {
        e.preventDefault();
        e.stopPropagation();
        listEl.scrollTop = Math.min(maxSt, st + dy);
      } else if (dy < 0 && st > eps) {
        e.preventDefault();
        e.stopPropagation();
        listEl.scrollTop = Math.max(0, st + dy);
      }
    },
    { passive: false },
  );

  for (const li of root.querySelectorAll<HTMLElement>("[data-select-option]")) {
    li.addEventListener("click", (e) => {
      e.stopPropagation();
      const v = li.dataset.value;
      if (v != null) {
        commitValue(v, true);
      }
    });
  }

  syncUIFromNative(root);
}

function initAll(): void {
  for (const el of document.querySelectorAll<HTMLElement>("[data-select]")) {
    initSelect(el);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAll, { once: true });
} else {
  initAll();
}

document.body.addEventListener("htmx:afterSwap", initAll);
document.body.addEventListener("htmx:afterSettle", initAll);

export {};
