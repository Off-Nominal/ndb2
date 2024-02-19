import { Router } from "express";
import { renderToString } from "react-dom/server";
import { BaseLayout } from "../../views/layouts/BaseLayout";
import { getDbClient } from "../../middleware/getDbClient";
import { Error } from "../../views/Error";
import { ErrorCode } from "../../types/responses";

const errors = {
  default: "Unknown error",
  [ErrorCode.SERVER_ERROR]:
    "The server seems to have made a mistake somewhere. Please let Jake know!",
  [ErrorCode.NOT_FOUND]:
    "The page you're looking for doesn't exist. Check the URL in your browser to double check.",
  [ErrorCode.WEB_APP_DATA_FETCH_ERROR]:
    "[95100]: There was an error fetching data from the server. Please let Jake know, this shouldn't happen.",
};

export const errorPage = (router: Router) => {
  router.get("/error/:errorId", getDbClient, async (req, res) => {
    const errorMessage = errors[req.params.errorId] || errors["default"];
    res.send(
      renderToString(
        <BaseLayout>
          <Error errorMessage={errorMessage} />
        </BaseLayout>
      )
    );
  });
};
