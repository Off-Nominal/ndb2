const OFF_NOMINAL_DISCORD_INVITE_HREF = "https://discord.gg/offnom";

/** Shown when the signed-in Discord user is not in the portal guild — pass as {@link error_page} `body`. */
export function discord_portal_requires_guild_membership_body(): JSX.Element {
  return (
    <>
      <p>
        You must be a member of the <strong>Off-Nominal Discord</strong> server to
        sign in to this site.
      </p>
      <p>
        <a
          href={OFF_NOMINAL_DISCORD_INVITE_HREF}
          target="_blank"
          rel="noopener noreferrer"
        >
          Join Off-Nominal Discord
        </a>{" "}
        (https://discord.gg/offnom)
      </p>
    </>
  );
}

/** Shown when the user is in the guild but lacks an allowed role — pass as {@link error_page} `body`. */
export function discord_portal_requires_allowed_role_body(): JSX.Element {
  return (
    <>
      <p>
        Your Discord account does not have a role that is allowed to use this
        site. You must be one of:
      </p>
      <ul>
        <li>The WeMartians Patreon</li>
        <li>The MECO Patreon</li>
        <li>YouTube Premium Member for Off-Nominal</li>
        <li>Off-Nominal Discord Membership</li>
      </ul>
    </>
  );
}

/** Rich copy for “OAuth env not set” — pass as {@link error_page} `body`. */
export function discord_oauth_env_missing_detail(): JSX.Element {
  return (
    <>
      <p>Discord sign-in is not configured on this server. Set:</p>
      <ul>
        <li>
          <code>DISCORD_OAUTH_CLIENT_ID</code>
        </li>
        <li>
          <code>DISCORD_OAUTH_CLIENT_SECRET</code>
        </li>
        <li>
          <code>DISCORD_OAUTH_REDIRECT_URI</code>
        </li>
      </ul>
    </>
  );
}
