import express from "express";
import { signInPage } from "./signin";
import { homePage } from "./leaderboards";
import { authenticateUser } from "../../middleware/authenticateUser";
import { predictionsPage } from "./predictions";
import { errorPage } from "./error";

const pagesRouter = express.Router();
pagesRouter.use(authenticateUser);

// Register pages
errorPage(pagesRouter);
signInPage(pagesRouter);
homePage(pagesRouter);
predictionsPage(pagesRouter);

pagesRouter.get("/", (req, res) => {
  res.redirect("/leaderboards");
});

export default pagesRouter;
