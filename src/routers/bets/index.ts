import express from "express";

const router = express.Router();

// Temporary redirect until all clients are updated
router.post("/", (req, res) => {
  const { prediction_id } = req.body;
  res.redirect(308, `/api/predictions/${prediction_id}/bets`);
});

export default router;
