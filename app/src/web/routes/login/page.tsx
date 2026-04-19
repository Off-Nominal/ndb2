export type LoginPageProps = {
  /** Post-login destination (path only, validated). */
  returnTo: string;
};

/** Body content for `GET /login`; document shell comes from {@link PageLayout} in the handler. */
export function LoginPage(props: LoginPageProps): JSX.Element {
  const discordHref = `/auth/discord?${new URLSearchParams({
    returnTo: props.returnTo,
  }).toString()}`;

  return (
    <main>
      <h1>Sign in</h1>
      <p>
        NDB2 uses Discord to verify your identity. Continue to Discord when you are ready.
      </p>
      <p>
        <a href={discordHref} class="login__action">
          Sign in with Discord
        </a>
      </p>
    </main>
  );
}
