import { isAfter, sub } from "date-fns";
import GAME_MECHANICS from "../config/game_mechanics";
import webhookManager from "../config/webhook_subscribers";
import pool from "../db";
import predictions from "../queries/predictions";

export default class PredictionMonitor {
  private schedule: Date[];

  constructor() {
    this.schedule = this.getSchedule();
    if (this.schedule.length === 0) {
      this.schedule = this.getSchedule(true);
    }
    console.log("[PM]: Prediction Monitor now running");

    // Queue up the next trigger
    this.scheduleNextTrigger();

    // Set judgement loop
    setInterval(() => {
      this.judgeNextPrediction();
    }, 600000);
  }

  private getSchedule(tomorrow: boolean = false): Date[] {
    const now = new Date();
    return GAME_MECHANICS.notificationSchedule.times
      .map((t) => {
        const offset = GAME_MECHANICS.notificationSchedule.offset;
        const [hour, minute] = t.split(":");
        const date = new Date();

        const offsetDate = sub(date, { days: 1 });

        offsetDate.setUTCHours(Number(hour) - offset);
        offsetDate.setUTCMinutes(Number(minute));
        offsetDate.setUTCSeconds(0);
        offsetDate.setUTCMilliseconds(0);

        return sub(offsetDate, {
          days: tomorrow ? -1 : 0,
        });
      })
      .filter((date) => isAfter(date, now));
  }

  private getTimeToNextTrigger(): number {
    const nextTrigger = this.schedule[0];
    return nextTrigger.getTime() - new Date().getTime();
  }

  private removeFirstScheduleTrigger(): void {
    const noItemsLeft = !this.schedule.shift();
    if (noItemsLeft) {
      this.schedule = this.getSchedule(true);
    }
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
        console.log(
          "[PM]: Prediction with id",
          pred.id,
          "due, triggering now."
        );
        return predictions
          .closePredictionById(client)(pred.id, null, new Date(pred.due_date))
          .then(() => predictions.getByPredictionId(client)(pred.id))
          .then((prediction) => {
            console.log(
              "[PM]: Prediction successfully triggered, sending webhook"
            );
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
        this.removeFirstScheduleTrigger();
        this.scheduleNextTrigger();
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
        console.log(
          "[PM]: Prediction with id,",
          pred.id,
          "due for judgement. Judging now."
        );
        return predictions
          .judgePredictionById(client)(pred.id)
          .then(() => predictions.getByPredictionId(client)(pred.id))
          .then((prediction) => {
            console.log(
              "[PM]: Prediction successfully judged, sending webhook"
            );

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

  private scheduleNextTrigger() {
    const nextTime = this.getTimeToNextTrigger();
    console.log(
      "[PM]: Next prediction trigger scheduled in",
      Math.floor(nextTime / 1000 / 60),
      "minutes."
    );
    setTimeout(() => {
      this.triggerNextPrediction();
    }, nextTime);
  }
}
