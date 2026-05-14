import { Entities } from "@offnominal/ndb2-api-types/v2";
import {
  LatticeCheckboxGroup,
  type LatticeCheckboxGroupProps,
} from "@web/shared/components/lattice-checkbox-group";
import { mergeClass } from "@web/shared/utils/merge_class.js";

type PredictionLifeCycle = Entities.Predictions.PredictionLifeCycle;

/** Product order for **`GET`** **`status`** (covers **`PREDICTION_LIFECYCLE_VALUES`**). */
const STATUS_LATTICE_DISPLAY_ORDER: readonly PredictionLifeCycle[] = [
  "open",
  "checking",
  "closed",
  "successful",
  "failed",
  "retired",
];

const STATUS_LATTICE_OPTIONS = STATUS_LATTICE_DISPLAY_ORDER.map((value) => ({
  value,
  label: value,
}));

export type PredictionStatusLatticeProps = Omit<
  LatticeCheckboxGroupProps,
  "name" | "options"
> & {
  selected?: readonly PredictionLifeCycle[];
};

/** Browse **`status`** filter built on {@link LatticeCheckboxGroup} (**`name="status"`**, uppercase rows). */
export function PredictionStatusLattice(props: PredictionStatusLatticeProps): JSX.Element {
  return (
    <LatticeCheckboxGroup
      name="status"
      options={STATUS_LATTICE_OPTIONS}
      selected={props.selected}
      legend={props.legend ?? "Status"}
      controlIdPrefix={props.controlIdPrefix ?? "predictions-status"}
      optionRowClass={mergeClass("[ uppercase ]", props.optionRowClass)}
      class={props.class}
      consoleClass={props.consoleClass}
      disabled={props.disabled}
      checkGlyphWidth={props.checkGlyphWidth}
      checkGlyphHeight={props.checkGlyphHeight}
      checkGlyphClass={props.checkGlyphClass}
    />
  );
}
