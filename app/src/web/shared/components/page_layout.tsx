import type { ColorScheme, ThemePreference } from "../../middleware/theme-preference";
import type { HtmlHeadProps } from "./html_head";
import { HtmlHead } from "./html_head";
import { DefaultSiteNav } from "./site_nav";

const SITE_NAV_REVEAL_ID = "app-site-nav-reveal";

/**
 * Full-document shell (markup-driven CUBE — see cube-css-authoring skill).
 * `page-layout` holds layout vars; `app-shell__grid` is the main + right-nav grid.
 */
const SHELL_GRID_CLASSES = "[ app-shell__grid ] [ page-layout ]";

export type PageLayoutProps = HtmlHeadProps & {
  theme: ThemePreference;
  /** Maps `brand.*` in design tokens; default `blue` when cookie is absent. */
  colorScheme: ColorScheme;
  children: JSX.Element;
  /** Right column / drawer; defaults to {@link DefaultSiteNav}. */
  navigation?: JSX.Element;
  /** JSON for HTMX `hx-headers` on `<body>` (e.g. CSRF). */
  hxHeaders?: string;
};

/** Full HTML document: `<html>`, `<head>` via {@link HtmlHead}, `<body>` + main column + right nav shell. */
export function PageLayout(props: PageLayoutProps): JSX.Element {
  const {
    theme,
    colorScheme,
    children,
    hxHeaders,
    title,
    clientScripts,
    csrfMetaToken,
    navigation = <DefaultSiteNav />,
  } = props;
  return (
    <html lang="en" data-theme={theme} data-color-scheme={colorScheme}>
      <head>
        <HtmlHead title={title} clientScripts={clientScripts} csrfMetaToken={csrfMetaToken} />
      </head>
      <body
        class="app-bg-glass"
        {...(hxHeaders != null ? { "hx-headers": hxHeaders } : {})}
      >
        <input
          class="[ app-nav__state ]"
          type="checkbox"
          id={SITE_NAV_REVEAL_ID}
        />
        <label
          for={SITE_NAV_REVEAL_ID}
          class="[ app-nav__scrim ]"
          aria-hidden="true"
        />
        <div class={SHELL_GRID_CLASSES}>
          <main class="[ app-shell__main ]" id="main">
            <div class="[ center ]">{children}</div>
          </main>
          <div class="[ app-nav-dock ]">
            <div class="[ app-nav-drawer ]">
              <aside class="[ app-nav ] [ app-glass-skin ]" id="site-nav" aria-label="Site">
                {navigation}
              </aside>
              <label
                for={SITE_NAV_REVEAL_ID}
                class="[ app-nav__tab ] [ app-glass-skin ]"
                aria-label="Open or close the site menu"
              >
                <span class="[ app-nav__icon-open ]" aria-hidden="true">
                  Menu
                </span>
                <span class="[ app-nav__icon-close ]" aria-hidden="true">
                  Close
                </span>
              </label>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
