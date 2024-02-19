import { Card } from "./components/Card";

export type SignInProps = {
  returnToPath?: string;
  message?: string;
};

export default function SignIn(props: SignInProps) {
  const returnToPath = props.returnToPath ?? "/";
  const message =
    props.message ??
    "Sign in to Nostradambot2 using your Discord Account. Nostradambot2 Users must be members of the Off-Nominal Discord with a paid account.";

  return (
    <main className="grid h-full place-content-center">
      <Card
        header={
          <h2 className="text-center text-2xl uppercase text-white sm:text-3xl">
            Login with Discord
          </h2>
        }
        className="m-4 h-min max-w-xl"
      >
        <div className="p-8">
          <div className="my-4 flex justify-center">
            <img
              src="/offnominal.svg"
              width={150}
              height={150}
              alt="Off-Nominal Podcast Logo"
            />
          </div>
          <p className="my-16">{message}</p>
          <a
            className={
              "block rounded-2xl bg-discord-purple px-8 py-4 text-center text-xl"
            }
            href={
              "/api/auth/oauth?returnTo=" +
              encodeURIComponent(returnToPath || "/")
            }
          >
            Sign In through Discord
          </a>
        </div>
      </Card>
    </main>
  );
}
