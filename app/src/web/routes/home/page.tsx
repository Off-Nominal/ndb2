import type { Children } from "@kitajs/html";
import { HeadingScreenElement } from "@web/shared/components/heading-screen-element";

export type HomePageProps = {
  children: Children;
};

/** Body shell for `/` (heading + flow); route data is composed in `handler.tsx` via `children`. */
export function HomePage(props: HomePageProps): JSX.Element {
  return (
    <div class="[ stack ] [ main-menu ]">
      <HeadingScreenElement>
        <h1 class="[ canvas-knockout-text ]">Main Menu</h1>
      </HeadingScreenElement>
      {props.children}
    </div>
  );
}
