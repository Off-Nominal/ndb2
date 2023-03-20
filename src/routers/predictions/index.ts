import express from "express";
const router = express.Router();

import post from "./post";
import patch_id_retire from "./patch_{id}_retire";
import get_id from "./get_{id}";
import post_id_trigger from "./post_{id}_trigger";

router.use("/", post);

router.use("/", get_id);
router.use("/", post_id_trigger);
router.use("/", patch_id_retire);

export default router;
