import { syncUIFromNative } from "./select-display-sync.js";

/**
 * Custom select: toggle listbox, sync hidden native `<select>` for forms + bubbling `change`.
 * Panel placement: flips above/below from viewport + caps `max-height` so the list stays on-screen.
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

  const { w: vw, h: vh } = getUsableViewport();
  // `getBoundingClientRect` is in client (viewport) coordinates; `vh` from visualViewport matches
  // when the URL bar/keyboard resizes the visible area.
  const tr = triggerEl.getBoundingClientRect();
  const spaceBelow = vh - tr.bottom - VIEWPORT_EDGE;
  const spaceAbove = tr.top - VIEWPORT_EDGE;

  listEl.style.maxHeight = "none";
  // Force reflow so scrollHeight reflects full content for measurement.
  void listEl.offsetHeight;
  const natural = listEl.scrollHeight;
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
  listEl.style.maxHeight = maxH > 0 ? `${maxH}px` : "";

  root.dataset.selectPlacement = placement;

  // Horizontal: nudge the list if the surface is near the left/right edge of the visible viewport.
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

  let activeIndex: number | null = null;
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
      placeSelectInViewport(root, listEl, triggerEl);
    });
  };

  function attachViewportListeners(): void {
    window.addEventListener("scroll", onViewportChange, true);
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
    window.removeEventListener("scroll", onViewportChange, true);
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
    const items = [...root.querySelectorAll<HTMLElement>("[data-select-option]")];
    if (items.length === 0) {
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      closePanel();
      triggerEl.focus();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next =
        activeIndex == null ? currentOptionIndex() : Math.min(activeIndex + 1, items.length - 1);
      activeIndex = next;
      setActiveOption(items, activeIndex);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = activeIndex == null ? currentOptionIndex() : Math.max(activeIndex - 1, 0);
      activeIndex = next;
      setActiveOption(items, activeIndex);
      return;
    }
    if (e.key === "Enter" && activeIndex != null) {
      e.preventDefault();
      const li = items[activeIndex];
      const v = li?.dataset.value;
      if (v != null) {
        commitValue(v, true);
      }
    }
  };

  function setActiveOption(items: HTMLElement[], index: number | null): void {
    items.forEach((li, i) => {
      if (i === index) {
        li.setAttribute("data-select-option-active", "true");
        li.scrollIntoView({ block: "nearest" });
      } else {
        li.removeAttribute("data-select-option-active");
      }
    });
  }

  function currentOptionIndex(): number {
    const items = [...root.querySelectorAll<HTMLElement>("[data-select-option]")];
    const i = items.findIndex((li) => (li.dataset.value ?? "") === nativeSelect.value);
    return i >= 0 ? i : 0;
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
  }

  function openPanel(): void {
    document.addEventListener("pointerdown", onDocPointerDown, true);
    document.addEventListener("keydown", onDocKeyDown, true);
    attachViewportListeners();
    listEl.hidden = false;
    triggerEl.setAttribute("aria-expanded", "true");
    root.classList.add("select--open");
    activeIndex = currentOptionIndex();
    const items = [...root.querySelectorAll<HTMLElement>("[data-select-option]")];
    setActiveOption(items, activeIndex);
    requestAnimationFrame(() => {
      placeSelectInViewport(root, listEl, triggerEl);
      requestAnimationFrame(() => {
        placeSelectInViewport(root, listEl, triggerEl);
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
    } else {
      setOpen(false);
    }
  });

  triggerEl.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (listEl.hidden) {
        openPanel();
      } else {
        setOpen(false);
      }
      return;
    }
    if (e.key === "ArrowDown" && listEl.hidden) {
      e.preventDefault();
      openPanel();
      return;
    }
    if (e.key === "Escape" && !listEl.hidden) {
      e.preventDefault();
      setOpen(false);
    }
  });

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
