import type { ColorScheme, ThemePreference } from "../../middleware/theme-preference";
import type { HtmlHeadProps } from "./html_head";
import { HtmlHead } from "./html_head";

/**
 * Full-document shell (markup-driven CUBE — see cube-css-authoring skill).
 * Uses literal bracket tokens in `class` for scanning: `[ center ]` then `[ page-layout ]`.
 */
const PAGE_LAYOUT_CLASSES = "[ center ] [ page-layout ]";

export type PageLayoutProps = HtmlHeadProps & {
  theme: ThemePreference;
  /** Maps `brand.*` in design tokens; default `blue` when cookie is absent. */
  colorScheme: ColorScheme;
  children: JSX.Element;
  /** JSON for HTMX `hx-headers` on `<body>` (e.g. CSRF). */
  hxHeaders?: string;
};

/** Full HTML document: `<html>`, `<head>` via {@link HtmlHead}, `<body>` + default column wrapper. */
export function PageLayout(props: PageLayoutProps): JSX.Element {
  const { theme, colorScheme, children, hxHeaders, title, clientScripts, csrfMetaToken } = props;
  return (
    <html lang="en" data-theme={theme} data-color-scheme={colorScheme}>
      <head>
        <HtmlHead title={title} clientScripts={clientScripts} csrfMetaToken={csrfMetaToken} />
      </head>
      <body
        class="app-bg-glass"
        {...(hxHeaders != null ? { "hx-headers": hxHeaders } : {})}
      >
        <div class={PAGE_LAYOUT_CLASSES}>{children}</div>
      </body>
    </html>
  );
}
