"use strict";
(() => {
  // src/web/shared/components/select/select.client.ts
  var LIST_MAX_HEIGHT_REM = 16;
  var VIEWPORT_EDGE = 8;
  function readListMaxHeightPx() {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return LIST_MAX_HEIGHT_REM * rem;
  }
  function getUsableViewport() {
    if (window.visualViewport != null) {
      return { w: window.visualViewport.width, h: window.visualViewport.height };
    }
    return { w: window.innerWidth, h: window.innerHeight };
  }
  function placeSelectInViewport(root, listEl, triggerEl) {
    if (listEl.hidden) {
      return;
    }
    const { w: vw, h: vh } = getUsableViewport();
    const tr = triggerEl.getBoundingClientRect();
    const spaceBelow = vh - tr.bottom - VIEWPORT_EDGE;
    const spaceAbove = tr.top - VIEWPORT_EDGE;
    listEl.style.maxHeight = "none";
    void listEl.offsetHeight;
    const natural = listEl.scrollHeight;
    const maxCap = readListMaxHeightPx();
    const ideal = Math.min(natural, maxCap);
    let placement;
    let maxH;
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
  function clearSelectPlacement(listEl, root) {
    listEl.style.maxHeight = "";
    listEl.style.removeProperty("transform");
    delete root.dataset.selectPlacement;
  }
  function optionDisplayLabelForNativeSelect(native) {
    const v = native.value;
    for (let i = 0; i < native.options.length; i++) {
      const o = native.options[i];
      if (o.value === v) {
        return (o.textContent?.trim() || o.label?.trim() || o.value).trim() || o.value;
      }
    }
    if (native.selectedIndex >= 0) {
      const o = native.options[native.selectedIndex];
      return (o.textContent?.trim() || o.label?.trim() || o.value).trim() || v;
    }
    return v;
  }
  function syncUIFromNative(root) {
    const native = root.querySelector("[data-select-native]");
    const valueEl = root.querySelector("[data-select-value]");
    if (native == null || valueEl == null) {
      return;
    }
    const display = optionDisplayLabelForNativeSelect(native);
    if (display !== "") {
      valueEl.textContent = display;
    }
    for (const li of root.querySelectorAll("[data-select-option]")) {
      const optVal = li.dataset.value ?? "";
      li.setAttribute("aria-selected", optVal === native.value ? "true" : "false");
    }
  }
  function initSelect(root) {
    if (root.dataset.selectInit === "1") {
      return;
    }
    root.dataset.selectInit = "1";
    const native = root.querySelector("[data-select-native]");
    const trigger = root.querySelector("[data-select-trigger]");
    const list = root.querySelector("[data-select-list]");
    if (native == null || trigger == null || list == null) {
      return;
    }
    const nativeSelect = native;
    const listEl = list;
    const triggerEl = trigger;
    let activeIndex = null;
    let rafViewport = null;
    const onViewportChange = () => {
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
    function attachViewportListeners() {
      window.addEventListener("scroll", onViewportChange, true);
      window.addEventListener("resize", onViewportChange);
      if (window.visualViewport != null) {
        window.visualViewport.addEventListener("resize", onViewportChange);
      }
    }
    function detachViewportListeners() {
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
    const onDocPointerDown = (e) => {
      if (!root.contains(e.target)) {
        closePanel();
      }
    };
    const onDocKeyDown = (e) => {
      if (listEl.hidden) {
        return;
      }
      const items = [...root.querySelectorAll("[data-select-option]")];
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
        const next = activeIndex == null ? currentOptionIndex() : Math.min(activeIndex + 1, items.length - 1);
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
    function setActiveOption(items, index) {
      items.forEach((li, i) => {
        if (i === index) {
          li.setAttribute("data-select-option-active", "true");
          li.scrollIntoView({ block: "nearest" });
        } else {
          li.removeAttribute("data-select-option-active");
        }
      });
    }
    function currentOptionIndex() {
      const items = [...root.querySelectorAll("[data-select-option]")];
      const i = items.findIndex((li) => (li.dataset.value ?? "") === nativeSelect.value);
      return i >= 0 ? i : 0;
    }
    function detachGlobalListeners() {
      document.removeEventListener("pointerdown", onDocPointerDown, true);
      document.removeEventListener("keydown", onDocKeyDown, true);
    }
    function setOpen(open) {
      if (!open) {
        clearSelectPlacement(listEl, root);
        detachGlobalListeners();
        detachViewportListeners();
      }
      listEl.hidden = !open;
      triggerEl.setAttribute("aria-expanded", open ? "true" : "false");
      root.classList.toggle("select--open", open);
      if (!open) {
        const items = [...root.querySelectorAll("[data-select-option]")];
        setActiveOption(items, null);
        activeIndex = null;
      }
    }
    function closePanel() {
      setOpen(false);
    }
    function openPanel() {
      document.addEventListener("pointerdown", onDocPointerDown, true);
      document.addEventListener("keydown", onDocKeyDown, true);
      attachViewportListeners();
      listEl.hidden = false;
      triggerEl.setAttribute("aria-expanded", "true");
      root.classList.add("select--open");
      activeIndex = currentOptionIndex();
      const items = [...root.querySelectorAll("[data-select-option]")];
      setActiveOption(items, activeIndex);
      requestAnimationFrame(() => {
        placeSelectInViewport(root, listEl, triggerEl);
        requestAnimationFrame(() => {
          placeSelectInViewport(root, listEl, triggerEl);
        });
      });
    }
    function commitValue(value, close) {
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
    triggerEl.addEventListener("keydown", (e) => {
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
    for (const li of root.querySelectorAll("[data-select-option]")) {
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
  function initAll() {
    for (const el of document.querySelectorAll("[data-select]")) {
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
})();
