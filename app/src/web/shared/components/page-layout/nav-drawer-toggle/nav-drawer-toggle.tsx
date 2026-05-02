/**
 * Drawer shell only (under **wide**, **`80rem`**). `checked` = rail open; `:not(:checked)` slides it off-canvas.
 * Hidden with the mobile panel at wide breakpoint (`page-layout`). See `nav-drawer-toggle.css` and `page-layout.css`.
 */
export function NavDrawerToggle(): JSX.Element {
  return (
    <div
      class="[ nav-drawer-toggle ]"
    >

      <input
        type="checkbox"
        class="[ ring ]"
        id="app-site-nav-reveal"
        aria-label="Toggle site navigation"
      />
    </div>
  );
}
