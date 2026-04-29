import { marked } from "marked";
import { CardScreenElement } from "@web/shared/components/card-screen-element";
import { HorizontalDivider } from "@web/shared/components/horizontal-divider";
import { mergeClass } from "@web/shared/utils/merge_class.js";
import { ProgressBarTicks } from "@web/shared/components/progress-bar-ticks";


interface SeasonCardPredictionRowProps {
  label: string;
  count: number;
}

function SeasonCardPredictionRow(props: SeasonCardPredictionRowProps): JSX.Element {
  return (
    <div class={"[ split-pair ] [ season-card__row ]"}>
      <span>{props.label}</span>
      <span>{props.count}</span>
    </div>
  );
}

/** Six lifecycle buckets rendered by {@link SeasonCard} (counts only). */
export interface SeasonCardPredictionCounts {
  open: number;
  checking: number;
  closed: number;
  successful: number;
  failed: number;
  retired: number;
}

export interface SeasonCardProps {
  /** Markdown-capable title (parsed inline). */
  name: string;
  /** When `null`, the card shows the empty state. */
  predictions: SeasonCardPredictionCounts | null;
  startDate: string;
  endDate: string;
  class?: string;
}

/** Season summary with prediction counts by lifecycle status (HUD glass card). */
export function SeasonCard(props: SeasonCardProps): JSX.Element {
  const predictions = props.predictions;

  // Progress in resolving predictions for this season
  const totalPredictions = predictions ? predictions.open + predictions.checking + predictions.closed + predictions.successful + predictions.failed + predictions.retired : 0;
  const unresolvedPredictions = predictions ? predictions.open + predictions.checking + predictions.closed : 0;
  const predictionProgress = (unresolvedPredictions / totalPredictions) * 100;

  // Temporal progress for this season
  const MS_PER_DAY = 86_400_000;
  const startDate = new Date(props.startDate);
  const endDate = new Date(props.endDate);
  const now = new Date();
  const rangeMs = endDate.getTime() - startDate.getTime();
  const elapsedMs = now.getTime() - startDate.getTime();
  const temporalProgress =
    rangeMs > 0 ? (elapsedMs / rangeMs) * 100 : 0;
  const totalDays = Math.max(
    1,
    rangeMs > 0 ? Math.ceil(rangeMs / MS_PER_DAY) : 1,
  );
  const elapsedDays = Math.min(
    totalDays,
    Math.max(0, Math.floor(elapsedMs / MS_PER_DAY)),
  );

  return (
    <CardScreenElement
      headingElement="h2"
      heading="Current Season"
      class={mergeClass("[ season-card ]", props.class)}
    >
      {predictions === null ? (
        <p class="[ season-card__empty ] [ center ]">No current season data is available.</p>
      ) : (
        <div class="[ stack ]">
          <p class="[ season-card__meta ]">
            "{marked.parseInline(props.name)}"
          </p>
          <div class="[ season-card__stats ]">
            <div class="[ stack ]">
              <SeasonCardPredictionRow label="[Open]" count={predictions.open} />
              <SeasonCardPredictionRow label="[Checking]" count={predictions.checking} />
              <SeasonCardPredictionRow label="[Voting]" count={predictions.closed} />
            </div>
            <div class="[ stack ]">
              <SeasonCardPredictionRow label="[Successful]" count={predictions.successful} />
              <SeasonCardPredictionRow label="[Failed]" count={predictions.failed} />
              <SeasonCardPredictionRow label="[Retired]" count={predictions.retired} />
            </div>
          </div>

          <HorizontalDivider />
          <div>
            <div class="[ split-pair ]">

              <h3>Predictions Resolved</h3>
              <span>{unresolvedPredictions} / {totalPredictions}</span>
            </div>
            <ProgressBarTicks value={predictionProgress} aria-label="Progress" showPercentage={true} />
          </div>
          <div>
            <div class="[ split-pair ]">

              <h3>Days Elapsed</h3>
              <span>
                {elapsedDays} / {totalDays}
              </span>
            </div>
            <ProgressBarTicks value={temporalProgress} aria-label="Progress" showPercentage={true} />
          </div>
        </div>
      )}
    </CardScreenElement>
  );
}
