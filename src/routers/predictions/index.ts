import express from "express";
const router = express.Router();

import post from "./post";
import patch_id from "./patch_{id}";

router.use("/", post);
router.use("/", patch_id);

export default router;
