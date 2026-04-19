export type html_head_props = {
  title: string;
};

/** Shared document head: charset, viewport, CUBE CSS layers + design tokens + HTMX. */
export function html_head(props: html_head_props): JSX.Element {
  return (
    <>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{props.title}</title>
      <link rel="stylesheet" href="/assets/design-tokens.css" />
      <link rel="stylesheet" href="/assets/globals.css" />
      <link rel="stylesheet" href="/assets/compositions.css" />
      <link rel="stylesheet" href="/assets/utilities.css" />
      <link rel="stylesheet" href="/assets/blocks.css" />
      <script src="/assets/htmx.min.js" defer />
    </>
  );
}
