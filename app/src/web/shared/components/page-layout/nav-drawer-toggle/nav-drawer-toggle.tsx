/**
 * Compact shell only (under 64rem). `checked` = rail open; `:not(:checked)` slides it off-canvas.
 * Hidden with the mobile panel at desktop breakpoint. See `nav-drawer-toggle.css` and `page-layout.css`.
 */
export function NavDrawerToggle(): JSX.Element {
  return (
    <div
      class="[ nav-drawer-toggle ]"
    >

      <input
        type="checkbox"
        id="app-site-nav-reveal"
        aria-label="Toggle site navigation"
      />
    </div>
  );
}
