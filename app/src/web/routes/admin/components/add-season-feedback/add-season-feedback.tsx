export type AddSeasonSuccessSnippetProps = {
  seasonName: string;
  seasonId: number;
};

/** HTMX success fragment after creating a season (errors use ErrorHtmxSnippet). */
export function AddSeasonSuccessSnippet(
  props: AddSeasonSuccessSnippetProps,
): JSX.Element {
  return (
    <div role="status" class="[ stack ]">
      <p>
        Created season “{props.seasonName}” (#{props.seasonId}).
      </p>
    </div>
  );
}
