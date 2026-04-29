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
  /** When true, renders normalized completion as a percentage in the centered HUD tab below the ticks. */
  showPercentLabel?: boolean;
  /** Caption aligned to the inline-start of the caption row below the ticks (muted body text). */
  minLabel?: string;
  /** Caption aligned to the inline-end of the caption row below the ticks (muted body text). */
  maxLabel?: string;
  /** Exposed to assistive technologies when there is no visible label. */
  "aria-label": string;
};

const DEFAULT_MIN = 0;
const DEFAULT_MAX = 100;
const DEFAULT_SEGMENTS = 40;

/**
 * Segmented HUD progress: vertical ticks in a `.screen-element` frame; optional caption row below the shell
 * shows any combination of `showPercentLabel` (knockout tab), `minLabel`, and `maxLabel`.
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

  const showCaptionRow =
    props.showPercentLabel === true ||
    props.minLabel !== undefined ||
    props.maxLabel !== undefined;

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
          showCaptionRow ? "[ progress-bar-ticks--with-caption ]" : undefined,
        ),
        props.class,
      )}
      role="progressbar"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={ariaNow}
      aria-valuetext={props.showPercentLabel ? pctLabel : undefined}
      aria-label={props["aria-label"]}
    >
      <div class="[ screen-element ] [ progress-bar-ticks__shell ]">
        <div class="[ progress-bar-ticks__track ]">{segments}</div>
      </div>
      {showCaptionRow ? (
        <div class="[ progress-bar-ticks__figure-mount ]">
          <span class="[ progress-bar-ticks__caption-min ]">{props.minLabel ?? ""}</span>
          <div class="[ progress-bar-ticks__caption-center ]">
            {props.showPercentLabel ? (
              <span
                class="[ progress-bar-ticks__figure ] [ primary-specular-gradient ]"
                aria-hidden="true"
              >
                <span class="[ progress-bar-ticks__figure-label ] [ canvas-knockout-text ]">{pctLabel}</span>
              </span>
            ) : null}
          </div>
          <span class="[ progress-bar-ticks__caption-max ]">{props.maxLabel ?? ""}</span>
        </div>
      ) : null}
    </div>
  );
}
