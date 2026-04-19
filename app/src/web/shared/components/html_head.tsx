export type html_head_props = {
  title: string;
};

/** Shared document head: charset, viewport, design tokens, HTMX. */
export function html_head(props: html_head_props): JSX.Element {
  return (
    <>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{props.title}</title>
      <link rel="stylesheet" href="/assets/design-tokens.css" />
      <script src="/assets/htmx.min.js" defer />
    </>
  );
}
