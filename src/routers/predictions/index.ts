import express from "express";
const router = express.Router();

// Import route handlers
import get_id from "./get_{id}";
import post from "./post";
import patch_id_retire from "./patch_{id}_retire";
import post_id_trigger from "./post_{id}_trigger";

// Assign route handlers
router.use("/", get_id);
router.use("/", post);
router.use("/", post_id_trigger);
router.use("/", patch_id_retire);

// Temporary redirect for old route, can be removed when clients are updated
router.patch("/:prediction_id", (req, res) => {
  const { prediction_id } = req.params;
  res.redirect(308, `/api/predictions/${prediction_id}/retire`);
});

export default router;
