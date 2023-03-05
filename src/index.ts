import express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();

const PORT = process.env.PORT || 80;

app.get("/", (req, res) => {
  res.json({ message: "Success!!!1" });
});

app.listen(PORT, () => {
  console.log(`App Listening on Port: `, PORT);
});
