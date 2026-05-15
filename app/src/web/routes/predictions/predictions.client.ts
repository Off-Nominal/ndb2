/**
 * Prediction browse form: **Me** shortcut for the predictor **`Select`** (`name="creator"` wire key;
 * native value + **`change`** → **`select.client`** sync).
 */
function predictorNativeSelect(form: HTMLFormElement): HTMLSelectElement | null {
  return form.querySelector<HTMLSelectElement>('select[name="creator"][data-select-native]');
}

function syncPredictorMeButton(form: HTMLFormElement): void {
  const btn = form.querySelector<HTMLButtonElement>("[data-predictions-predictor-me]");
  const native = predictorNativeSelect(form);
  const viewerId = form.dataset.viewerDiscordId?.trim();
  if (btn == null || native == null || viewerId == null || viewerId === "") {
    return;
  }
  btn.disabled = ![...native.options].some((o) => o.value === viewerId);
}

function wirePredictionBrowsePredictorMe(form: HTMLFormElement): void {
  const btn = form.querySelector<HTMLButtonElement>("[data-predictions-predictor-me]");
  if (btn == null) {
    return;
  }

  btn.addEventListener("click", () => {
    const native = predictorNativeSelect(form);
    const viewerId = form.dataset.viewerDiscordId?.trim();
    if (native == null || viewerId == null || viewerId === "") {
      return;
    }
    if (![...native.options].some((o) => o.value === viewerId)) {
      return;
    }
    if (native.value === viewerId) {
      return;
    }
    native.value = viewerId;
    native.dispatchEvent(new Event("change", { bubbles: true }));
  });

  syncPredictorMeButton(form);
}

function initPredictionBrowseForm(): void {
  const form = document.getElementById("predictions-filter-form");
  if (!(form instanceof HTMLFormElement)) {
    return;
  }
  if (form.dataset.predictionsBrowseClientInit === "1") {
    return;
  }
  form.dataset.predictionsBrowseClientInit = "1";

  wirePredictionBrowsePredictorMe(form);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPredictionBrowseForm, { once: true });
} else {
  initPredictionBrowseForm();
}

document.body.addEventListener("htmx:afterSwap", initPredictionBrowseForm);
document.body.addEventListener("htmx:afterSettle", initPredictionBrowseForm);

export {};
