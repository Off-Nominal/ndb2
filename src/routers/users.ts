import express from "express";
import { isNumber, isUuid } from "../helpers/typeguards";
import users from "../queries/users";

const router = express.Router();

// router.get("/", (req, res) => {
//   const { discordId } = req.query;

//   if (!discordId) {
//     return users.get().then((users) => res.json(users));
//   }

//   // discord id must be a number
//   if (!isNumber(discordId)) {
//     return res.status(400).json("Discord Ids must be a parseable as number");
//   }

//   return users
//     .get({ discordId })
//     .then((user) => user || users.add(discordId))
//     .then((user) => res.json(user));
// });

// router.get("/:uuid", (req, res) => {
//   const { uuid } = req.params;

//   // uuid id must be a uuid
//   if (!isUuid(uuid)) {
//     return res.status(400).json("User Ids must be a parseable as a UUID");
//   }

//   // Fetch User
//   return users
//     .get({ uuid })
//     .then((user) => {
//       if (!user.length) {
//         return res
//           .status(400)
//           .json({ status: 400, error: "User doesn't exist." });
//       } else {
//         return res.json(user[0]);
//       }
//     })
//     .catch((err) => {
//       console.error(err);
//       res.status(500).json({ status: 500, error: err });
//     });
// });

export default router;
