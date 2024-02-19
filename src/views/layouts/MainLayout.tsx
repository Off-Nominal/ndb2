export type MainLayoutProps = {
  activePath: "leaderboards" | "predictions";
  children: React.ReactNode;
};

export const MainLayout = (props: MainLayoutProps) => {
  const baseLiClasses =
    "relative after:absolute after:left-0 after:right-0 after:top-5 md:after:top-6 lg:after:top-7 after:mt-2 after:block after:h-1 after:w-full";
  const selectedLiClasses = baseLiClasses + " after:bg-moonstone-blue";
  const liClasses = baseLiClasses + " after:hover:bg-moss-green";
  const linkClasses = "text-md sm:text-base md:text-lg xl:text-xl";

  return (
    <div className="flex w-full flex-col content-center p-4 align-middle sm:px-6 sm:py-4">
      <header className="mb-10 mt-4 flex flex-col gap-4 md:mb-8 lg:flex-row lg:justify-between">
        <a href="/">
          <h1 className="h-min text-center text-3xl sm:text-4xl md:text-5xl">
            NOSTRADAMBOT<span className={"text-moonstone-blue"}>2</span>
          </h1>
        </a>
        <nav>
          <ul className="flex justify-around gap-2 font-bold uppercase sm:justify-center sm:gap-8 xl:gap-16 ">
            <li
              className={
                props.activePath === "leaderboards"
                  ? selectedLiClasses
                  : liClasses
              }
            >
              <a className={linkClasses} href="/">
                Leaders
              </a>
            </li>
            <li
              className={
                props.activePath === "predictions"
                  ? selectedLiClasses
                  : liClasses
              }
            >
              <a className={linkClasses} href="/predictions">
                Predictions
              </a>
            </li>
            <li className={liClasses}>
              <a className={linkClasses} href="/api/auth/signout">
                Logout
              </a>
            </li>
          </ul>
        </nav>
      </header>
      <main>{props.children}</main>
    </div>
  );
};
