import { Entities } from "@offnominal/ndb2-api-types/v2";
import { mergeClass } from "@web/shared/utils/merge_class.js";

type PredictionLifeCycle = Entities.Predictions.PredictionLifeCycle;

/** Console order (stable product ordering; must cover every {@link Entities.Predictions.PREDICTION_LIFECYCLE_VALUES}). */
const STATUS_LATTICE_DISPLAY_ORDER: readonly PredictionLifeCycle[] = [
  "open",
  "checking",
  "closed",
  "successful",
  "failed",
  "retired",
];

export type PredictionStatusLatticeProps = {
  /** Mirrors browse **`status`** query (repeat **`status=value`** on submit). */
  selected?: readonly PredictionLifeCycle[];
  /** **`fieldset`** legend; default **`Status`**. */
  legend?: string;
  class?: string;
  disabled?: boolean;
  /** Stable **`id`** prefix for each **`input`** (`${prefix}-${lifecycle}`). */
  controlIdPrefix?: string;
};

/**
 * Route-local lifecycle filter: **`fieldset`** + **`legend`**, **`name="status"`** checkboxes,
 * **`visually-hidden`** inputs and HUD tile **`label`** faces (**`:focus-within`** ring via **`ring-has-focus-visible`**).
 */
export function PredictionStatusLattice(
  props: PredictionStatusLatticeProps,
): JSX.Element {
  const legendText =
    props.legend !== undefined && props.legend.trim().length > 0
      ? props.legend.trim()
      : "Status";

  const idPrefix =
    props.controlIdPrefix !== undefined && props.controlIdPrefix.trim().length > 0
      ? props.controlIdPrefix.trim()
      : "predictions-status";

  const selected =
    props.selected !== undefined ? new Set(props.selected) : new Set<PredictionLifeCycle>();

  const disabled = props.disabled === true;

  return (
    <fieldset
      class={mergeClass("[ predictions-status-lattice ]", props.class)}
      {...(disabled ? { disabled: true } : {})}
    >
      <ul>
        {STATUS_LATTICE_DISPLAY_ORDER.map((status) => {
          const controlId = `${idPrefix}-${status}`;
          return (
            <li>
              <label class="[ ring-has-focus-visible ]">
                <input
                  id={controlId}
                  type="checkbox"
                  name="status"
                  value={status}
                  class="[ visually-hidden ]"
                  checked={selected.has(status)}
                />
                <span class="predictions-status-lattice-tile-face">{status}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <legend>{legendText}</legend>
    </fieldset>
  );
}
