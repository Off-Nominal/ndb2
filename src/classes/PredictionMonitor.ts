import schedule from "node-schedule";

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

    this.log("Prediction Monitor running.");
  }

  private async executeMonitorCallback(monitor: MonitorConfig) {
    this.log(`Running monitor: ${monitor.name}`);

    monitor.callback(this.log).catch((err) => {
      this.error(`Running monitor ${monitor.name} failed`, err);
    });
  }

  private log(message: string) {
    console.log(`[PM]: ${message}`);
  }

  private error(message: string, err: any) {
    console.error(`[PM]: ${message}`);
    console.error(err);
  }
}
