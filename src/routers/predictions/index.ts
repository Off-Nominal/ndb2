import express from "express";
const router = express.Router();

// Import route handlers
import get_id from "./get_{id}";
import get from "./get";
import post from "./post";
import patch_id_retire from "./patch_{id}_retire";
import post_id_trigger from "./post_{id}_trigger";
import post_id_votes from "./post_{id}_votes";
import post_id_bets from "./post_{id}_bets";

// Assign route handlers
router.use("/", get_id);
router.use("/", get);
router.use("/", post);
router.use("/", patch_id_retire);
router.use("/", post_id_trigger);
router.use("/", post_id_votes);
router.use("/", post_id_bets);

export default router;
