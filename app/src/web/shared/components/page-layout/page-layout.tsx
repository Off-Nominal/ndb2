import type { WebAuthAuthenticated } from "../../../middleware/auth/session";
import type { ColorScheme, ThemePreference } from "../../../middleware/theme-preference";
import type { HtmlHeadProps } from "../html-head";
import { HtmlHead } from "../html-head";
import { NavigationMenu } from "../site-nav";

const SITE_NAV_REVEAL_ID = "app-site-nav-reveal";

/**
 * Full-document shell (markup-driven CUBE — see cube-css-authoring skill).
 * `app-shell__grid` + `page-layout`: main + right-nav grid; on wide/desktop see `page-layout.css` comments.
 */
const SHELL_GRID_CLASSES = "[ app-shell__grid ] [ page-layout ]";

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
  /** Session (CSRF for default nav sign-out, etc.). */
  auth: WebAuthAuthenticated;
  /** Right column / drawer; defaults to {@link NavigationMenu} with `auth`. */
  navigation?: JSX.Element;
  /** `POST /preferences` redirect target for the default nav form; default `"/"`. */
  preferencesReturnTo?: string;
};

type DocumentFrameProps = Omit<PageLayoutProps, "children"> & {
  body: JSX.Element;
};

function DocumentFrame(props: DocumentFrameProps): JSX.Element {
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
        {props.body}
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
      body={
        <main>
          <div class="[ center-inline ]">{props.children}</div>
        </main>
      }
    />
  );
}

/**
 * Authenticated app shell: same document frame as {@link PageLayout} plus the site nav column / drawer
 * (and scrim, tab, HTMX `hx-headers` on `body` when provided).
 */
export function AuthenticatedPageLayout(props: AuthenticatedPageLayoutProps): JSX.Element {
  const navigation = props.navigation ?? (
    <NavigationMenu
      auth={props.auth}
      theme={props.theme}
      colorScheme={props.colorScheme}
      preferencesReturnTo={props.preferencesReturnTo ?? "/"}
    />
  );
  return (
    <DocumentFrame
      theme={props.theme}
      colorScheme={props.colorScheme}
      title={props.title}
      clientScripts={props.clientScripts}
      csrfMetaToken={props.csrfMetaToken}
      hxHeaders={props.hxHeaders}
      body={
        <>
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
              <div class="[ center-inline ]">{props.children}</div>
            </main>
            <div class="[ app-nav-dock ]">
              <div class="[ app-nav-drawer ]">
                <aside class="[ app-nav ] [ glass-background ]" id="site-nav" aria-label="Site">
                  {navigation}
                </aside>
                <label
                  for={SITE_NAV_REVEAL_ID}
                  class="[ app-nav__tab ] [ glass-background ]"
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
        </>
      }
    />
  );
}
