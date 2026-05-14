/**
 * Keeps **`unbetter_id`** **`GET`** serialization unambiguous: when “exclude my bets” is checked,
 * the text field must not submit **`name="unbetter_id"`** (native **`disabled`** alone is enough, but we
 * mirror SSR and avoid duplicate keys if **`disabled`** ever lapses).
 */
function syncPredictionBrowseUnbetterWire(): void {
  const checkbox = document.getElementById("predictions-exclude-my-bets");
  const input = document.getElementById("predictions-unbetter-id");
  if (!(checkbox instanceof HTMLInputElement) || !(input instanceof HTMLInputElement)) {
    return;
  }

  const apply = (): void => {
    if (checkbox.checked) {
      input.disabled = true;
      input.removeAttribute("name");
    } else {
      input.disabled = false;
      input.setAttribute("name", "unbetter_id");
    }
  };

  checkbox.addEventListener("change", apply);
  apply();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", syncPredictionBrowseUnbetterWire);
} else {
  syncPredictionBrowseUnbetterWire();
}

export {};
