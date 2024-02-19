import { ReactNode } from "react";

export type BaseLayoutProps = {
  children: ReactNode;
  title?: string;
  scripts?: ReactNode;
};

export const BaseLayout = (props: BaseLayoutProps) => {
  let title: string = "Nostradambot2";

  if (props.title) {
    title = `${props.title} | Nostradambot2`;
  }

  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="/output.css" rel="stylesheet" />

        {props.scripts || null}
        <title>{title}</title>
        <meta
          name="description"
          content="A fun predictions betting game for the Off-Nominal Discord."
        />
        <meta name="application-name" content="Nostradambot2" />
        <link rel="author" href="https://twitter.com/JakeOnOrbit" />
        <meta name="author" content="Jake Robins" />
        <meta name="author" content="David Halpin" />
        <meta name="author" content="Ben Hallert" />
        <link rel="author" href="https://deltayeet.net" />
        <meta name="creator" content="Jake Robins" />
        <meta name="publisher" content="Off-Nominal Studios" />
        <meta name="msapplication-Tilecolor" content="#2b5797" />
        <link rel="canonical" href="https://ndb.offnom.com/" />

        <meta property="og:title" content="Nostradambot2" />
        <meta
          property="og:description"
          content="A fun predictions betting game for the Off-Nominal Discord."
        />
        <meta property="og:url" content="https://ndb.offnom.com/" />
        <meta property="og:site_name" content="Nostradambot2" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="5000" />
        <meta property="og:image:height" content="2625" />
        <meta
          property="og:image"
          content="https://ndb.offnom.com/opengraph-image.png"
        />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:site" content="@offnom" />
        <meta name="twitter:creator" content="@JakeOnOrbit" />
        <meta name="twitter:title" content="Nostradambot2" />
        <meta
          name="twitter:description"
          content="A fun predictions betting game for the Off-Nominal Discord."
        />
        <meta name="twitter:image:type" content="image/png" />
        <meta name="twitter:image:width" content="260" />
        <meta name="twitter:image:height" content="260" />
        <meta
          name="twitter:image"
          content="https://ndb.offnom.com/twitter-image.png"
        />
        <link rel="icon" href="favicon.ico" type="image/x-icon" sizes="48x48" />
        <link
          rel="apple-touch-icon"
          href="apple-icon.png"
          type="image/png"
          sizes="180x180"
        />
      </head>
      <body className="flex h-full w-full justify-center">
        <div className="sm:w-[480px] md:w-[768px] lg:w-[976px] xl:w-[1200px]">
          {props.children}
        </div>
      </body>
    </html>
  );
};
