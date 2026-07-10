export type SeasonEndWebhookSuccessSnippetProps = {
  seasonName: string;
};

/** HTMX success fragment after re-sending a season_end webhook. */
export function SeasonEndWebhookSuccessSnippet(
  props: SeasonEndWebhookSuccessSnippetProps,
): JSX.Element {
  return (
    <div role="status" class="[ stack ]">
      <p>Season end webhook sent for {props.seasonName}.</p>
    </div>
  );
}
