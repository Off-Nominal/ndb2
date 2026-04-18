import { createElement } from "@kitajs/html";
import { renderToStream } from "@kitajs/html/suspense";
import { Router } from "express";
import { Route } from "@shared/routerMap";
import { suspense_demo_page } from "./page";

export const SuspenseDemo: Route = (router: Router) => {
  router.get("/demo/suspense", (req, res, next) => {
    const stream = renderToStream((rid) =>
      createElement(suspense_demo_page, { rid }),
    );

    stream.on("error", (err) => {
      stream.destroy();
      if (!res.headersSent) {
        next(err);
      }
    });

    res.type("html");
    stream.pipe(res);
  });
};
