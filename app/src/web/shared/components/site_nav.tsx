import { Button } from "./button";

/**
 * Default site links for the right-hand nav column. Replace via {@link PageLayout}’s `navigation` prop
 * for routes that need a different set (e.g. marketing-only or embedded shell).
 */
export function DefaultSiteNav(): JSX.Element {
  return (
    <nav class="[ site-nav ]">
      <ul class="[ stack ] [ list-plain ]">
        <li>
          <Button href="/">Home</Button>
        </li>
        <li>
          <Button href="/demo/suspense">Suspense demo</Button>
        </li>
        <li>
          <Button href="/login">Sign in</Button>
        </li>
      </ul>
    </nav>
  );
}
