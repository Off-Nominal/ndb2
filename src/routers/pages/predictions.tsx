import { Router } from "express";
import { renderToString } from "react-dom/server";
import { BaseLayout } from "../../views/layouts/BaseLayout";
import { MainLayout } from "../../views/layouts/MainLayout";

export const predictionsPage = (router: Router) => {
  router.get("/predictions", (req, res) => {
    res.send(
      renderToString(
        <BaseLayout>
          <MainLayout activePath="predictions">Hi</MainLayout>
        </BaseLayout>
      )
    );
  });
};
