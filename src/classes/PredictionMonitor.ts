import { isAfter, sub } from "date-fns";
import GAME_MECHANICS from "../config/game_mechanics";
import webhookManager from "../config/webhook_subscribers";
import predictions from "../queries/predictions";

export default class PredictionMonitor {
  private schedule: Date[];

  constructor() {
    this.schedule = this.getSchedule();
    console.log(this.schedule);
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

  private triggerNextPrediction() {
    console.log("[PM]: Scheduled Trigger");
    predictions
      .getNextPredictionToTrigger()
      .then((pred) => {
        if (!pred) {
          console.log("[PM]: No predictions due, skipping.");
          return;
        }
        console.log(
          "[PM]: Prediction with id",
          pred.id,
          "due, triggering now."
        );
        return predictions
          .closePredictionById(pred.id, null, new Date(pred.due_date))
          .then((prediction) => {
            console.log(
              "[PM]: Prediction successfully triggered, sending webhook"
            );
            console.log(prediction);
            webhookManager.emit("triggered_prediction", prediction);
          });
      })
      .finally(() => {
        this.removeFirstScheduleTrigger();
        this.scheduleNextTrigger();
      });
  }

  private judgeNextPrediction() {
    console.log("[PM]: Looking for judgements.");
    predictions.getNextPredictionToJudge().then((pred) => {
      if (!pred) {
        console.log("[PM]: No judgements due, skipping.");
        return;
      }
      console.log(
        "[PM]: Prediction with id,",
        pred.id,
        "due for judgement. Judging now."
      );
      return predictions.judgePredictionById(pred.id).then((prediction) => {
        console.log("[PM]: Prediction successfully judged, sending webhook");
        console.log(prediction);
        webhookManager.emit("judged_prediction", prediction);
      });
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
