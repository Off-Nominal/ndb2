import { Router } from "express";
import { BaseLayout } from "../../views/layouts/BaseLayout";
import { renderToString } from "react-dom/server";
import SignIn from "../../views/SignIn";

const messages = {
  default:
    "Sign in to Nostradambot2 using your Discord Account. Nostradambot2 Users must be members of the Off-Nominal Discord with a paid account.",
  auth: "We were unable to authenticate your Discord account. Please make sure you're using an active account and your password is correct.",
  identify:
    "We were unable to find you on the Off-Nominal Discord. Please make sure you're a member of our server.",
  authorize:
    "We weren't able to verify that you have a paid role in the Off-Nominal Discord.",
  state:
    "There was a problem with your OAuth signin attempt. Please try again.",
};

export const signInPage = (router: Router) => {
  router.get("/signin", async (req, res) => {
    if (req.authenticated_user) {
      return res.redirect("/");
    }

    const { error, returnTo } = req.query;

    let returnToPath = "/";
    if (returnTo && typeof returnTo === "string") {
      returnToPath = returnTo;
    }

    const message = messages[error as string] || messages.default;

    res.send(
      renderToString(
        <BaseLayout>
          <SignIn message={message} returnToPath={returnToPath} />
        </BaseLayout>
      )
    );
  });
};
