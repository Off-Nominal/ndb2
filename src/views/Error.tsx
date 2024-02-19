import { Card } from "./components/Card";

export type ErrorProps = {
  errorMessage: string;
};

export const Error = (props: ErrorProps) => {
  return (
    <section className="grid h-full place-content-center">
      <Card
        header={
          <h2 className="text-center text-2xl uppercase text-white sm:text-3xl">
            Something went wrong!
          </h2>
        }
        className="m-4 h-min max-w-xl shadow-md"
      >
        <div className="p-8">
          <p className="my-8">{props.errorMessage}</p>
          <div className="mt-16 flex justify-center">
            <a
              className={
                "block rounded-2xl bg-discord-purple px-8 py-4 text-center text-xl"
              }
              href={"/"}
            >
              Return Home
            </a>
          </div>
        </div>
      </Card>
    </section>
  );
};
