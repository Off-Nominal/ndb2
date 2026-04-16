import express from "express";
const router = express.Router();

// Import route handlers
import get_id from "./get_{id}";
import get_search from "./get_search";
import post from "./post";
import patch_id_retire from "./patch_{id}_retire";
import post_id_trigger from "./post_{id}_trigger";
import delete_id_trigger from "./delete_{id}_trigger";
import post_id_votes from "./post_{id}_votes";
import post_id_bets from "./post_{id}_bets";
import post_id_snooze_checks from "./post_{id}_snooze_checks_{id}";
import patch_id_snooze from "./patch_{id}_snooze";

// Assign route handlers
router.use("/", get_search);
router.use("/", get_id);
router.use("/", post);
router.use("/", patch_id_retire);
router.use("/", post_id_trigger);
router.use("/", delete_id_trigger);
router.use("/", post_id_votes);
router.use("/", post_id_bets);
router.use("/", post_id_snooze_checks);
router.use("/", patch_id_snooze);

export default router;
