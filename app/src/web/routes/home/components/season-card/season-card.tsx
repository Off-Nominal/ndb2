import { marked } from "marked";
import { CardScreenElement } from "@web/shared/components/card-screen-element";
import { HorizontalDivider } from "@web/shared/components/horizontal-divider";
import { mergeClass } from "@web/shared/utils/merge_class.js";


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
  class?: string;
}

/** Season summary with prediction counts by lifecycle status (HUD glass card). */
export function SeasonCard(props: SeasonCardProps): JSX.Element {
  const predictions = props.predictions;

  return (
    <CardScreenElement
      headingElement="h2"
      heading="Season"
      class={mergeClass("[ season-card ]", props.class)}
    >
      {predictions === null ? (
        <p class="[ season-card__empty ]">No current season data is available.</p>
      ) : (
        <>
          <p class="season-card__meta">
            {marked.parseInline(props.name)}
          </p>
          <div class="season-card__stats">
            <div class="[ stack ]">
              <SeasonCardPredictionRow label="[Open]" count={predictions.open} />
              <SeasonCardPredictionRow label="[Checking]" count={predictions.checking} />
              <SeasonCardPredictionRow label="[Voting]" count={predictions.closed} />
            </div>
            {/* <HorizontalDivider class="season-card__stats-divider" /> */}
            <div class="[ stack ]">
              <SeasonCardPredictionRow label="[Successful]" count={predictions.successful} />
              <SeasonCardPredictionRow label="[Failed]" count={predictions.failed} />
              <SeasonCardPredictionRow label="[Retired]" count={predictions.retired} />
            </div>
          </div>
        </>
      )}
    </CardScreenElement>
  );
}
