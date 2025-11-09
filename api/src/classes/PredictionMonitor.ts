import schedule from "node-schedule";
import { createLogger } from "@mendahu/utilities";

const logger = createLogger({ namespace: "PM", env: ["dev", "production"] });

export type MonitorLog = (message: string) => void;

export type MonitorConfig = {
  name: string;
  schedule: string;
  callback: (log: MonitorLog) => Promise<void>;
};

export default class PredictionMonitor {
  monitors: MonitorConfig[];

  constructor(monitors: MonitorConfig[]) {
    this.monitors = monitors;
  }

  public initiate() {
    for (const monitor of this.monitors) {
      schedule.scheduleJob(monitor.schedule, () => {
        this.executeMonitorCallback(monitor);
      });
    }

    logger.log("Prediction Monitor running.");
  }

  private async executeMonitorCallback(monitor: MonitorConfig) {
    logger.log(`Running monitor: ${monitor.name}`);

    monitor
      .callback((message: string) => logger.log(message))
      .catch((err) => {
        logger.error(`Running monitor ${monitor.name} failed`, err);
      });
  }
}
