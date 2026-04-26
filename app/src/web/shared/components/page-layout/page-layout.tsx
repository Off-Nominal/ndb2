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

const SOLO_MAIN_CLASSES = "[ app-shell__main ] [ page-layout ] [ app-shell__main--solo ]";

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
};

type DocumentFrameProps = Omit<PageLayoutProps, "children"> & {
  body: JSX.Element;
};

function DocumentFrame(props: DocumentFrameProps): JSX.Element {
  const { theme, colorScheme, title, clientScripts, csrfMetaToken, hxHeaders, body } = props;
  return (
    <html lang="en" data-theme={theme} data-color-scheme={colorScheme}>
      <head>
        <HtmlHead title={title} clientScripts={clientScripts} csrfMetaToken={csrfMetaToken} />
      </head>
      <body
        class="[ glass-background ]"
        {...(hxHeaders != null ? { "hx-headers": hxHeaders } : {})}
      >
        {body}
      </body>
    </html>
  );
}

/**
 * Public / unauthenticated document shell: main content only, no right-hand site nav
 * (login, OAuth error pages, 404, 5xx, etc.).
 */
export function PageLayout(props: PageLayoutProps): JSX.Element {
  const { children, ...rest } = props;
  return (
    <DocumentFrame
      {...rest}
      body={
        <main class={SOLO_MAIN_CLASSES} id="main">
          <div class="[ center ]">{children}</div>
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
  const { children, auth, navigation = <NavigationMenu auth={auth} />, ...rest } = props;
  return (
    <DocumentFrame
      {...rest}
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
              <div class="[ center ]">{children}</div>
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
