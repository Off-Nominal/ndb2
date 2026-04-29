import { mergeClass } from "../../utils/merge_class.js";

export type ProgressBarTicksProps = {
  /** Current value in the range `min`–`max` (inclusive). */
  value: number;
  class?: string;
  /** Range lower bound (default `0`). */
  min?: number;
  /** Range upper bound (default `100`). */
  max?: number;
  /** Number of discrete vertical segments (default `40`). */
  segmentCount?: number;
  /** When true, shows normalized completion as a percentage on a centered tab below the ticks. */
  showPercentage?: boolean;
  /** Exposed to assistive technologies when there is no visible label. */
  "aria-label": string;
};

const DEFAULT_MIN = 0;
const DEFAULT_MAX = 100;
const DEFAULT_SEGMENTS = 40;

/**
 * Segmented HUD progress: vertical ticks in a `.screen-element` frame, filled segments use the theme
 * primary colour; unfilled segments stay dimmed. Optional `showPercentage` adds a primary-gradient tab
 * below the `.screen-element` HUD frame (outside the bordered shell) with the normalized percentage.
 */
export function ProgressBarTicks(props: ProgressBarTicksProps): JSX.Element {
  const min = props.min ?? DEFAULT_MIN;
  const max = props.max ?? DEFAULT_MAX;
  const span = max - min;
  const safeSpan = span <= 0 ? 1 : span;
  const segmentCount = props.segmentCount ?? DEFAULT_SEGMENTS;

  const clamped =
    props.value <= min ? min : props.value >= max ? max : props.value;
  const filledCount = Math.round(((clamped - min) / safeSpan) * segmentCount);
  const cappedFilled = Math.min(segmentCount, Math.max(0, filledCount));
  const ariaNow = Math.round(clamped);
  const pctNormalized = safeSpan <= 0 ? 0 : ((clamped - min) / safeSpan) * 100;
  const pctLabel = `${Math.round(pctNormalized)}%`;

  const segments: JSX.Element[] = [];
  for (let i = 0; i < segmentCount; i += 1) {
    const filled = i < cappedFilled;
    segments.push(
      <span
        class="[ progress-bar-ticks__segment ]"
        data-filled={filled ? "true" : "false"}
        aria-hidden="true"
      />,
    );
  }

  return (
    <div
      class={mergeClass(
        mergeClass(
          "[ progress-bar-ticks ]",
          props.showPercentage ? "[ progress-bar-ticks--with-figure ]" : undefined,
        ),
        props.class,
      )}
      role="progressbar"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={ariaNow}
      aria-valuetext={props.showPercentage ? pctLabel : undefined}
      aria-label={props["aria-label"]}
    >
      <div class="[ screen-element ] [ progress-bar-ticks__shell ]">
        <div class="[ progress-bar-ticks__track ]">{segments}</div>
      </div>
      {props.showPercentage ? (
        <div class="[ progress-bar-ticks__figure-mount ]">
          <span
            class="[ progress-bar-ticks__figure ] [ primary-specular-gradient ]"
            aria-hidden="true"
          >
            <span class="[ progress-bar-ticks__figure-label ] [ canvas-knockout-text ]">{pctLabel}</span>
          </span>
        </div>
      ) : null}
    </div>
  );
}
