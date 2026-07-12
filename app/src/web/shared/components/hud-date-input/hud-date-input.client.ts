/**
 * Custom HUD date / datetime picker: syncs a hidden native input for forms,
 * renders a month grid popover, optional time fields for datetime mode.
 * Header drills up: days → years (decade) → months → days.
 */

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Years shown per decade page in the year grid. */
const YEAR_PAGE_SIZE = 12;

type PanelView = "days" | "months" | "years";

type ParsedParts = {
  year: number;
  month: number; // 0-11
  day: number;
  hour: number;
  minute: number;
};

function decadeStartFor(year: number): number {
  return Math.floor(year / YEAR_PAGE_SIZE) * YEAR_PAGE_SIZE;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function parseValue(raw: string, mode: "date" | "datetime"): ParsedParts | null {
  if (raw === "") {
    return null;
  }
  if (mode === "date") {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (!m) {
      return null;
    }
    return {
      year: Number(m[1]),
      month: Number(m[2]) - 1,
      day: Number(m[3]),
      hour: 0,
      minute: 0,
    };
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(raw);
  if (!m) {
    return null;
  }
  return {
    year: Number(m[1]),
    month: Number(m[2]) - 1,
    day: Number(m[3]),
    hour: Number(m[4]),
    minute: Number(m[5]),
  };
}

function formatDateParts(p: ParsedParts): string {
  return `${p.year}-${pad2(p.month + 1)}-${pad2(p.day)}`;
}

function formatNativeValue(p: ParsedParts, mode: "date" | "datetime"): string {
  const date = formatDateParts(p);
  if (mode === "date") {
    return date;
  }
  return `${date}T${pad2(p.hour)}:${pad2(p.minute)}`;
}

function formatDisplay(raw: string, mode: "date" | "datetime"): string {
  if (raw === "") {
    return mode === "datetime" ? "Select date & time" : "Select date";
  }
  return raw.replace("T", " ");
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function clampDay(year: number, month: number, day: number): number {
  return Math.min(day, daysInMonth(year, month));
}

function todayParts(): ParsedParts {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth(),
    day: now.getDate(),
    hour: now.getHours(),
    minute: now.getMinutes(),
  };
}

function initHudDateInput(root: HTMLElement): void {
  if (root.dataset.hudDateInit === "1") {
    return;
  }
  root.dataset.hudDateInit = "1";

  const modeAttr = root.dataset.hudDateMode;
  const mode: "date" | "datetime" = modeAttr === "datetime" ? "datetime" : "date";

  const native = root.querySelector<HTMLInputElement>("[data-hud-date-native]");
  const trigger = root.querySelector<HTMLButtonElement>("[data-hud-date-trigger]");
  const display = root.querySelector<HTMLElement>("[data-hud-date-display]");
  const panel = root.querySelector<HTMLElement>("[data-hud-date-panel]");
  if (native == null || trigger == null || display == null || panel == null) {
    return;
  }

  let viewYear: number;
  let viewMonth: number;
  let panelView: PanelView = "days";
  let decadeStart: number;
  let selected: ParsedParts | null = parseValue(native.value, mode);

  const seed = selected ?? todayParts();
  viewYear = seed.year;
  viewMonth = seed.month;
  decadeStart = decadeStartFor(viewYear);

  function syncDisplay(): void {
    display!.textContent = formatDisplay(native!.value, mode);
  }

  function commit(next: ParsedParts, close: boolean): void {
    selected = next;
    const value = formatNativeValue(next, mode);
    const prev = native!.value;
    native!.value = value;
    if (prev !== value) {
      native!.dispatchEvent(new Event("change", { bubbles: true }));
      native!.dispatchEvent(new Event("input", { bubbles: true }));
    }
    syncDisplay();
    if (close && mode === "date") {
      closePanel();
    } else {
      renderPanel();
    }
  }

  const VIEWPORT_EDGE = 8;

  let rafViewport: number | null = null;

  /** Flip above/below like `select` — CSS owns absolute coords under the root. */
  function placePanel(): void {
    if (panel!.hidden) {
      return;
    }
    const vh = window.visualViewport?.height ?? window.innerHeight;
    const rect = trigger!.getBoundingClientRect();
    void panel!.offsetHeight;
    const needed = panel!.offsetHeight || 280;
    const spaceBelow = vh - rect.bottom - VIEWPORT_EDGE;
    const spaceAbove = rect.top - VIEWPORT_EDGE;
    if (needed > spaceBelow && spaceAbove > spaceBelow) {
      root.dataset.hudDatePlacement = "above";
    } else {
      delete root.dataset.hudDatePlacement;
    }
  }

  const onViewportChange = (): void => {
    if (panel!.hidden) {
      return;
    }
    if (rafViewport != null) {
      cancelAnimationFrame(rafViewport);
    }
    rafViewport = requestAnimationFrame(() => {
      rafViewport = null;
      placePanel();
    });
  };

  function attachViewportListeners(): void {
    window.addEventListener("scroll", onViewportChange, true);
    window.addEventListener("resize", onViewportChange);
    window.visualViewport?.addEventListener("resize", onViewportChange);
  }

  function detachViewportListeners(): void {
    if (rafViewport != null) {
      cancelAnimationFrame(rafViewport);
      rafViewport = null;
    }
    window.removeEventListener("scroll", onViewportChange, true);
    window.removeEventListener("resize", onViewportChange);
    window.visualViewport?.removeEventListener("resize", onViewportChange);
  }

  const onDocPointerDown = (e: Event): void => {
    if (!root.contains(e.target as Node)) {
      closePanel();
    }
  };

  const onDocKeyDown = (e: KeyboardEvent): void => {
    if (e.key !== "Escape") {
      return;
    }
    e.preventDefault();
    if (panelView === "months") {
      panelView = "years";
      decadeStart = decadeStartFor(viewYear);
      renderPanel();
      return;
    }
    if (panelView === "years") {
      panelView = "days";
      renderPanel();
      return;
    }
    closePanel();
    trigger!.focus();
  };

  function closePanel(): void {
    panel!.hidden = true;
    trigger!.setAttribute("aria-expanded", "false");
    root.classList.remove("hud-date-input--open");
    delete root.dataset.hudDatePlacement;
    panelView = "days";
    detachViewportListeners();
    document.removeEventListener("pointerdown", onDocPointerDown, true);
    document.removeEventListener("keydown", onDocKeyDown, true);
  }

  function openPanel(): void {
    selected = parseValue(native!.value, mode);
    const seedOpen = selected ?? todayParts();
    viewYear = seedOpen.year;
    viewMonth = seedOpen.month;
    decadeStart = decadeStartFor(viewYear);
    panelView = "days";
    panel!.hidden = false;
    trigger!.setAttribute("aria-expanded", "true");
    root.classList.add("hud-date-input--open");
    document.addEventListener("pointerdown", onDocPointerDown, true);
    document.addEventListener("keydown", onDocKeyDown, true);
    attachViewportListeners();
    renderPanel();
    requestAnimationFrame(placePanel);
  }

  function renderNav(
    label: string,
    prevLabel: string,
    nextLabel: string,
    labelClimb?: string,
  ): string {
    const labelInner =
      labelClimb != null
        ? `<button type="button" class="hud-date-input__month-label" data-hud-date-climb aria-label="${labelClimb}">${label}</button>`
        : `<div class="hud-date-input__month-label" aria-live="polite">${label}</div>`;
    return `
      <div class="hud-date-input__month-nav">
        <button type="button" class="hud-date-input__nav-btn" data-hud-date-prev aria-label="${prevLabel}">‹</button>
        ${labelInner}
        <button type="button" class="hud-date-input__nav-btn" data-hud-date-next aria-label="${nextLabel}">›</button>
      </div>`;
  }

  function bindNav(
    onPrev: () => void,
    onNext: () => void,
    onClimb?: () => void,
  ): void {
    panel!.querySelector("[data-hud-date-prev]")?.addEventListener("click", (e) => {
      e.stopPropagation();
      onPrev();
      renderPanel();
    });
    panel!.querySelector("[data-hud-date-next]")?.addEventListener("click", (e) => {
      e.stopPropagation();
      onNext();
      renderPanel();
    });
    if (onClimb != null) {
      panel!.querySelector("[data-hud-date-climb]")?.addEventListener("click", (e) => {
        e.stopPropagation();
        onClimb();
        renderPanel();
      });
    }
  }

  function renderDaysView(): string {
    const firstDow = new Date(viewYear, viewMonth, 1).getDay();
    const dim = daysInMonth(viewYear, viewMonth);
    const prevDim = daysInMonth(
      viewMonth === 0 ? viewYear - 1 : viewYear,
      viewMonth === 0 ? 11 : viewMonth - 1,
    );

    const cells: {
      year: number;
      month: number;
      day: number;
      outside: boolean;
    }[] = [];

    for (let i = 0; i < firstDow; i++) {
      const day = prevDim - firstDow + 1 + i;
      const month = viewMonth === 0 ? 11 : viewMonth - 1;
      const year = viewMonth === 0 ? viewYear - 1 : viewYear;
      cells.push({ year, month, day, outside: true });
    }
    for (let day = 1; day <= dim; day++) {
      cells.push({ year: viewYear, month: viewMonth, day, outside: false });
    }
    while (cells.length < 42) {
      const nextIndex = cells.length - firstDow - dim;
      const day = nextIndex + 1;
      const month = viewMonth === 11 ? 0 : viewMonth + 1;
      const year = viewMonth === 11 ? viewYear + 1 : viewYear;
      cells.push({ year, month, day, outside: true });
    }

    const today = todayParts();
    const weekdays = WEEKDAYS.map(
      (d) => `<span class="hud-date-input__weekday">${d}</span>`,
    ).join("");

    const days = cells
      .map((cell) => {
        const iso = `${cell.year}-${pad2(cell.month + 1)}-${pad2(cell.day)}`;
        const isSelected =
          selected != null &&
          selected.year === cell.year &&
          selected.month === cell.month &&
          selected.day === cell.day;
        const isToday =
          today.year === cell.year &&
          today.month === cell.month &&
          today.day === cell.day;
        return `<button type="button" class="hud-date-input__day" data-hud-date-day="${iso}" data-hud-date-outside="${cell.outside ? "true" : "false"}" data-hud-date-today="${isToday ? "true" : "false"}" aria-selected="${isSelected ? "true" : "false"}">${cell.day}</button>`;
      })
      .join("");

    const timeBlock =
      mode === "datetime"
        ? `<div class="hud-date-input__time">
            <span class="hud-date-input__time-label">UTC time</span>
            <div class="hud-date-input__time-fields">
              <input class="hud-date-input__time-input" data-hud-date-hour type="text" inputmode="numeric" maxlength="2" aria-label="Hours" value="${pad2(selected?.hour ?? 0)}" />
              <span class="hud-date-input__time-sep" aria-hidden="true">:</span>
              <input class="hud-date-input__time-input" data-hud-date-minute type="text" inputmode="numeric" maxlength="2" aria-label="Minutes" value="${pad2(selected?.minute ?? 0)}" />
            </div>
          </div>
          <div class="hud-date-input__footer">
            <button type="button" class="hud-date-input__action" data-hud-date-apply>Apply</button>
          </div>`
        : "";

    return `
      ${renderNav(
        `${MONTHS[viewMonth]} ${viewYear}`,
        "Previous month",
        "Next month",
        "Choose year",
      )}
      <div class="hud-date-input__weekdays">${weekdays}</div>
      <div class="hud-date-input__grid" role="grid">${days}</div>
      ${timeBlock}
    `;
  }

  function renderYearsView(): string {
    const today = todayParts();
    const end = decadeStart + YEAR_PAGE_SIZE - 1;
    const years = Array.from({ length: YEAR_PAGE_SIZE }, (_, i) => decadeStart + i)
      .map((year) => {
        const isSelected = selected?.year === year;
        const isCurrent = viewYear === year;
        const isToday = today.year === year;
        return `<button type="button" class="hud-date-input__period" data-hud-date-year="${year}" aria-selected="${isSelected ? "true" : "false"}" data-hud-date-current="${isCurrent ? "true" : "false"}" data-hud-date-today="${isToday ? "true" : "false"}">${year}</button>`;
      })
      .join("");

    return `
      ${renderNav(`${decadeStart} – ${end}`, "Previous years", "Next years")}
      <div class="hud-date-input__period-grid" role="listbox" aria-label="Choose year">${years}</div>
    `;
  }

  function renderMonthsView(): string {
    const today = todayParts();
    const months = MONTHS.map((label, month) => {
      const isSelected =
        selected != null && selected.year === viewYear && selected.month === month;
      const isCurrent = viewMonth === month;
      const isToday = today.year === viewYear && today.month === month;
      return `<button type="button" class="hud-date-input__period" data-hud-date-month="${month}" aria-selected="${isSelected ? "true" : "false"}" data-hud-date-current="${isCurrent ? "true" : "false"}" data-hud-date-today="${isToday ? "true" : "false"}">${label}</button>`;
    }).join("");

    return `
      ${renderNav(
        String(viewYear),
        "Previous year",
        "Next year",
        "Choose year",
      )}
      <div class="hud-date-input__period-grid" role="listbox" aria-label="Choose month">${months}</div>
    `;
  }

  function bindDaysHandlers(): void {
    bindNav(
      () => {
        if (viewMonth === 0) {
          viewMonth = 11;
          viewYear -= 1;
        } else {
          viewMonth -= 1;
        }
      },
      () => {
        if (viewMonth === 11) {
          viewMonth = 0;
          viewYear += 1;
        } else {
          viewMonth += 1;
        }
      },
      () => {
        decadeStart = decadeStartFor(viewYear);
        panelView = "years";
      },
    );

    for (const btn of panel!.querySelectorAll<HTMLButtonElement>("[data-hud-date-day]")) {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const iso = btn.dataset.hudDateDay;
        if (iso == null) {
          return;
        }
        const [y, m, d] = iso.split("-").map(Number);
        const next: ParsedParts = {
          year: y!,
          month: m! - 1,
          day: d!,
          hour: selected?.hour ?? 0,
          minute: selected?.minute ?? 0,
        };
        commit(next, mode === "date");
      });
    }

    const hourInput = panel!.querySelector<HTMLInputElement>("[data-hud-date-hour]");
    const minuteInput = panel!.querySelector<HTMLInputElement>("[data-hud-date-minute]");
    const applyBtn = panel!.querySelector<HTMLButtonElement>("[data-hud-date-apply]");

    function readTimeFields(): { hour: number; minute: number } {
      const hour = Math.min(23, Math.max(0, Number(hourInput?.value || "0") || 0));
      const minute = Math.min(59, Math.max(0, Number(minuteInput?.value || "0") || 0));
      return { hour, minute };
    }

    applyBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      const base = selected ?? {
        year: viewYear,
        month: viewMonth,
        day: clampDay(viewYear, viewMonth, todayParts().day),
        hour: 0,
        minute: 0,
      };
      const { hour, minute } = readTimeFields();
      commit({ ...base, hour, minute }, true);
      closePanel();
    });

    const syncTimeOnBlur = (): void => {
      if (selected == null) {
        return;
      }
      const { hour, minute } = readTimeFields();
      commit({ ...selected, hour, minute }, false);
    };
    hourInput?.addEventListener("change", syncTimeOnBlur);
    minuteInput?.addEventListener("change", syncTimeOnBlur);
  }

  function bindYearsHandlers(): void {
    bindNav(
      () => {
        decadeStart -= YEAR_PAGE_SIZE;
      },
      () => {
        decadeStart += YEAR_PAGE_SIZE;
      },
    );

    for (const btn of panel!.querySelectorAll<HTMLButtonElement>("[data-hud-date-year]")) {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const year = Number(btn.dataset.hudDateYear);
        if (!Number.isFinite(year)) {
          return;
        }
        viewYear = year;
        panelView = "months";
        renderPanel();
      });
    }
  }

  function bindMonthsHandlers(): void {
    bindNav(
      () => {
        viewYear -= 1;
      },
      () => {
        viewYear += 1;
      },
      () => {
        decadeStart = decadeStartFor(viewYear);
        panelView = "years";
      },
    );

    for (const btn of panel!.querySelectorAll<HTMLButtonElement>("[data-hud-date-month]")) {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const month = Number(btn.dataset.hudDateMonth);
        if (!Number.isFinite(month)) {
          return;
        }
        viewMonth = month;
        panelView = "days";
        renderPanel();
      });
    }
  }

  function renderPanel(): void {
    if (panelView === "years") {
      panel!.innerHTML = renderYearsView();
      bindYearsHandlers();
    } else if (panelView === "months") {
      panel!.innerHTML = renderMonthsView();
      bindMonthsHandlers();
    } else {
      panel!.innerHTML = renderDaysView();
      bindDaysHandlers();
    }

    if (!panel!.hidden) {
      requestAnimationFrame(placePanel);
    }
  }

  trigger.addEventListener("click", () => {
    if (panel.hidden) {
      openPanel();
    } else {
      closePanel();
    }
  });

  trigger.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (panel.hidden) {
        openPanel();
      } else {
        closePanel();
      }
    }
    if (e.key === "ArrowDown" && panel.hidden) {
      e.preventDefault();
      openPanel();
    }
  });

  syncDisplay();
}

function initAll(): void {
  for (const el of document.querySelectorAll<HTMLElement>("[data-hud-date-input]")) {
    initHudDateInput(el);
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
