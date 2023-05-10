import webhookManager from "../config/webhook_subscribers";
import pool from "../db";
import predictions from "../queries/predictions";
import cron from "node-cron";

const triggerSchedule = "0/30 12-21 * * *";
const judgementSchedule = "*/10 * * * *";

if (!cron.validate(triggerSchedule)) {
  throw new SyntaxError("Cron Trigger Schedule Syntax invalud");
}

if (!cron.validate(judgementSchedule)) {
  throw new SyntaxError("Cron Judgement Schedule Syntax invalud");
}

export default class PredictionMonitor {
  constructor() {
    // // Trigger Schedule
    // cron.schedule(
    //   triggerSchedule,
    //   () => {
    //     this.triggerNextPrediction();
    //   },
    //   cronOptions
    // );

    // Judgement Schedule
    cron.schedule(judgementSchedule, () => {
      this.judgeNextPrediction();
    });

    console.log("[PM]: Prediction Monitor running.");
  }

  private async triggerNextPrediction() {
    console.log("[PM]: Scheduled Trigger");
    const client = await pool.connect();

    predictions
      .getNextPredictionToTrigger(client)()
      .then((pred) => {
        if (!pred) {
          return;
        }
        console.log("[PM]: Triggering prediction with id ", pred.id);
        return predictions
          .closePredictionById(client)(pred.id, null, new Date(pred.due_date))
          .then(() => predictions.getByPredictionId(client)(pred.id))
          .then((prediction) => {
            webhookManager.emit("triggered_prediction", prediction);
          })
          .catch((err) => {
            console.error("[PM]: Failed to trigger prediction.");
            console.error(err);
          });
      })
      .catch((err) => {
        console.error("[PM]: Failed to fetch next prediction trigger.");
        console.error(err);
      })
      .finally(() => {
        client.release();
      });
  }

  private async judgeNextPrediction() {
    const client = await pool.connect();
    predictions
      .getNextPredictionToJudge(client)()
      .then((pred) => {
        if (!pred) {
          return;
        }
        console.log("[PM]: Judging prediction with id,", pred.id);
        return predictions
          .judgePredictionById(client)(pred.id)
          .then(() => predictions.getByPredictionId(client)(pred.id))
          .then((prediction) => {
            webhookManager.emit("judged_prediction", prediction);
          })
          .catch((err) => {
            console.error("[PM]: Failed to judge next prediction.");
            console.error(err);
          });
      })
      .catch((err) => {
        console.error("[PM]: Failed to get next prediction to judge.");
        console.error(err);
      })
      .finally(() => {
        client.release();
      });
  }
}
