import { FormField } from "@web/shared/components/form-field";
import { HeadingScreenElement } from "@web/shared/components/heading-screen-element";
import { HudTextInput } from "@web/shared/components/hud-text-input";

const PREVIEW_FIELD_ID = "predictions-hud-input-preview";

/** Shell for **`GET /predictions`** (browse UI lands here in later plan steps). */
export function PredictionsPage(): JSX.Element {
  return (
    <div class="[ stack ] [ main-menu ]">
      <HeadingScreenElement>
        <h1 class="[ canvas-knockout-text ]">Predictions</h1>
      </HeadingScreenElement>
      <p>Browse UI scaffold — filter form and results arrive in later milestones.</p>
      <FormField label="Keyword (preview)" fieldId={PREVIEW_FIELD_ID}>
        <HudTextInput
          id={PREVIEW_FIELD_ID}
          name="keyword"
          placeholder="Try typing…"
          maxlength={500}
          autocomplete="off"
        />
      </FormField>
    </div>
  );
}
