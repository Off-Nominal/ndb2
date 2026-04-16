import schedule from "node-schedule";
import { createLogger } from "@mendahu/utilities";
import { MonitorConfig } from "./types";

export class MonitorRunner {
  private logger: ReturnType<typeof createLogger>;

  constructor(
    private monitors: MonitorConfig[],
    options: { namespace: string; runningMessage: string },
  ) {
    this.logger = createLogger({
      namespace: options.namespace,
      env: ["dev", "production"],
    });
    this.runningMessage = options.runningMessage;
  }

  private runningMessage: string;

  public initiate() {
    for (const monitor of this.monitors) {
      schedule.scheduleJob(monitor.schedule, () => {
        this.executeMonitorCallback(monitor);
      });
    }

    this.logger.log(this.runningMessage);
  }

  private async executeMonitorCallback(monitor: MonitorConfig) {
    this.logger.log(`Running monitor: ${monitor.name}`);

    monitor
      .callback((message: string) => this.logger.log(message))
      .catch((err) => {
        this.logger.error(`Running monitor ${monitor.name} failed`, err);
      });
  }
}

