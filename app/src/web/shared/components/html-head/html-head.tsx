import { isDev } from "@shared/utils";
import { sharedComponentsClientScriptUrls } from "../../../generated/routeClientScripts";
import { browserClientScriptTagProps, cubeStylesheetHref } from "../../../vite-dev-client-src";

export type HtmlHeadProps = {
  title: string;
  /**
   * Route-colocated `*.client.js` URLs from `clientScriptsForModule(__filename)`.
   * Loaded after the default {@link sharedComponentsClientScriptUrls} list.
   */
  clientScripts?: readonly string[];
  /** When set, exposes the per-session CSRF secret for non-JS consumers (forms read `meta[name=csrf-token]`). */
  csrfMetaToken?: string;
};

/** Shared document head: charset, viewport, CUBE CSS layers, client islands, HTMX. */
export function HtmlHead(props: HtmlHeadProps): JSX.Element {
  const scripts = [...sharedComponentsClientScriptUrls, ...(props.clientScripts ?? [])];
  return (
    <>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      {props.csrfMetaToken != null && props.csrfMetaToken !== "" ? (
        <meta name="csrf-token" content={props.csrfMetaToken} />
      ) : null}
      <title>{props.title}</title>
      <link rel="stylesheet" href={cubeStylesheetHref()} />
      {isDev() ? <script type="module" src="/@vite/client" /> : null}
      {scripts.map((assetUrl) => {
        const { src, typeModule } = browserClientScriptTagProps(assetUrl);
        return typeModule ? (
          <script type="module" src={src} />
        ) : (
          <script src={src} defer />
        );
      })}
      <script src="/assets/htmx.min.js" defer />
    </>
  );
}
