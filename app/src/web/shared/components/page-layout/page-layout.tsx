import type { WebAuthAuthenticated } from "../../../middleware/auth/session";
import type { ColorScheme, ThemePreference } from "../../../middleware/theme-preference";
import type { HtmlHeadProps } from "../html-head";
import { HtmlHead } from "../html-head";
import { NavDrawerToggle } from "./nav-drawer-toggle";
import { NavigationMenu } from "../site-nav";

/**
 * Full-document shell (markup-driven CUBE — see cube-css-authoring skill).
 * Authenticated shell: `[ page-layout ]` + compact (`page-layout-nav-mobile`, under 64rem) vs desktop nav
 * (`page-layout-nav-desktop`, 64rem+). See `page-layout.css`.
 */

/** Base document: `<html>`, `<head>`, `<body>`, and a single `main` column (no site navigation). */
export type PageLayoutProps = HtmlHeadProps & {
  theme: ThemePreference;
  /** Maps `brand.*` in design tokens; default from cookie when absent. */
  colorScheme: ColorScheme;
  children: JSX.Element;
  /** JSON for HTMX `hx-headers` on `<body>` (e.g. CSRF). */
  hxHeaders?: string;
};

export type AuthenticatedPageLayoutProps = PageLayoutProps & {
  /** Session (CSRF for sign-out, preferences form, etc.). */
  auth: WebAuthAuthenticated;
  /** `POST /preferences` redirect target in the site nav; default `"/"`. */
  preferencesReturnTo?: string;
};

function DocumentFrame(props: PageLayoutProps): JSX.Element {
  return (
    <html lang="en" data-theme={props.theme} data-color-scheme={props.colorScheme}>
      <head>
        <HtmlHead
          title={props.title}
          clientScripts={props.clientScripts}
          csrfMetaToken={props.csrfMetaToken}
        />
      </head>
      <body
        class="[ glass-background ]"
        {...(props.hxHeaders != null ? { "hx-headers": props.hxHeaders } : {})}
      >
        <div class="[ center-inline ][ document-frame ]">
          {props.children}
        </div>
      </body>
    </html>
  );
}

/**
 * Public / unauthenticated document shell: main content only, no right-hand site nav
 * (login, OAuth error pages, 404, 5xx, etc.).
 */
export function PageLayout(props: PageLayoutProps): JSX.Element {
  return (
    <DocumentFrame
      theme={props.theme}
      colorScheme={props.colorScheme}
      title={props.title}
      clientScripts={props.clientScripts}
      csrfMetaToken={props.csrfMetaToken}
      hxHeaders={props.hxHeaders}
    >
      <main>
        <div class="[ center-inline ]">{props.children}</div>
      </main>
    </DocumentFrame>
  );
}

/**
 * Authenticated app shell: same document frame as {@link PageLayout} plus the site nav column / drawer
 * (and scrim, tab, HTMX `hx-headers` on `body` when provided).
 */
export function AuthenticatedPageLayout(props: AuthenticatedPageLayoutProps): JSX.Element {
  return (
    <DocumentFrame
      theme={props.theme}
      colorScheme={props.colorScheme}
      title={props.title}
      clientScripts={props.clientScripts}
      csrfMetaToken={props.csrfMetaToken}
      hxHeaders={props.hxHeaders}
    >
      <div>
        <div class="[ page-layout ]">
          <main id="main">
            <div class="[ center-inline ]">{props.children}</div>
          </main>
          <aside class="[ page-layout-nav ] [ glass-background ]">
            <div class="[ page-layout-nav-mobile ]">
              <div class="[ page-layout-nav-toggle ] [ glass-background ]">
                <NavDrawerToggle />
              </div>
              <div class="[ page-layout-nav-body ]">
                <NavigationMenu
                  auth={props.auth}
                  theme={props.theme}
                  colorScheme={props.colorScheme}
                  preferencesReturnTo={props.preferencesReturnTo ?? "/"}
                />
              </div>
            </div>
            <div class="[ page-layout-nav-desktop ]">
              <NavigationMenu
                auth={props.auth}
                theme={props.theme}
                colorScheme={props.colorScheme}
                preferencesReturnTo={props.preferencesReturnTo ?? "/"}
                preferencesControlIdSuffix="-desktop"
              />
            </div>
          </aside>
        </div>
      </div>
    </DocumentFrame>
  );
}
