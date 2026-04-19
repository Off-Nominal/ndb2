export type html_head_props = {
  title: string;
  /** Route colocated `*.client.js` URLs from `clientScriptsForModule(__filename)` (or manual list). */
  clientScripts?: readonly string[];
  /** When set, exposes the per-session CSRF secret for non-JS consumers (forms read `meta[name=csrf-token]`). */
  csrfMetaToken?: string;
};

/** Shared document head: charset, viewport, CUBE CSS layers, route client islands, HTMX. */
export function html_head(props: html_head_props): JSX.Element {
  const scripts = props.clientScripts ?? [];
  return (
    <>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      {props.csrfMetaToken != null && props.csrfMetaToken !== "" ? (
        <meta name="csrf-token" content={props.csrfMetaToken} />
      ) : null}
      <title>{props.title}</title>
      <link rel="stylesheet" href="/assets/design-tokens.css" />
      <link rel="stylesheet" href="/assets/globals.css" />
      <link rel="stylesheet" href="/assets/compositions.css" />
      <link rel="stylesheet" href="/assets/utilities.css" />
      <link rel="stylesheet" href="/assets/blocks.css" />
      {scripts.map((src) => (
        <script src={src} defer />
      ))}
      <script src="/assets/htmx.min.js" defer />
    </>
  );
}
