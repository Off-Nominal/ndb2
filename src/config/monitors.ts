import { PoolClient } from "pg";
import predictions from "../db/queries/predictions";
import webhookManager from "./webhook_subscribers";
import { MonitorConfig, MonitorLog } from "../classes/PredictionMonitor";
import snoozes from "../db/queries/snoozes";

export const monitors: MonitorConfig[] = [
  {
    name: "Trigger Check",
    schedule: "0/30 12-21 * * *", // every 30 minutes, on the 0 and 30, between 12pm and 9pm UTC
    callback: (client: PoolClient, log: MonitorLog) => {
      return predictions
        .getNextPredictionToTrigger(client)()
        .then((pred) => {
          if (!pred) {
            return;
          }
          log(`Triggering prediction with id ${pred.id}`);
          return predictions
            .closePredictionById(client)(pred.id, null, new Date(pred.due_date))
            .then(() => predictions.getPredictionById(client)(pred.id))
            .then((prediction) => {
              webhookManager.emit("triggered_prediction", prediction);
            });
        });
    },
  },
  {
    name: "Snooze Check",
    schedule: "15/45 12-21 * * *", // every 30 minutes, on the 15 and 45, between 12pm and 9pm UTC
    callback: (client: PoolClient, log: MonitorLog) => {
      return predictions
        .getNextPredictionToCheck(client)()
        .then((pred) => {
          if (!pred) {
            return;
          }
          log(`Checking prediction with id ${pred.id}`);
          return snoozes
            .addCheck(client)(pred.id)
            .then(() => predictions.getPredictionById(client)(pred.id))
            .then((prediction) => {
              webhookManager.emit("new_snooze_check", prediction);
            });
        });
    },
  },
  {
    name: "Unactioned Snooze Check",
    schedule: "12/50 12-21 * * *", // every 30 minutes, on the 20 and 50, between 12pm and 9pm UTC
    callback: (client: PoolClient, log: MonitorLog) => {
      return snoozes
        .getNextUnactionedSnoozeCheck(client)()
        .then((check) => {
          if (!check) {
            return;
          }
          log(`Snoozing unactioned Snooze Check with id ${check.id} for 1 day`);
          return predictions
            .snoozePredictionById(client)(check.id, 1)
            .then(() => predictions.getPredictionById(client)(check.id))
            .then((prediction) => {
              webhookManager.emit("snoozed_prediction", prediction);
            });
        });
    },
  },
  {
    name: "Judgement Check",
    schedule: "*/10 * * * *", // every 10 minutes
    callback: (client: PoolClient, log: MonitorLog) => {
      return predictions
        .getNextPredictionToJudge(client)()
        .then((pred) => {
          if (!pred) {
            return;
          }
          log(`Judging prediction with id ${pred.id}`);
          return predictions
            .judgePredictionById(client)(pred.id)
            .then(() => predictions.getPredictionById(client)(pred.id))
            .then((prediction) => {
              webhookManager.emit("judged_prediction", prediction);
            });
        });
    },
  },
];