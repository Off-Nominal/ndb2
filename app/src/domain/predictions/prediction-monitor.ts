import { MonitorRunner } from "@domain/monitors/monitor-runner";
import { MonitorConfig } from "@domain/monitors/types";

export default class PredictionMonitor extends MonitorRunner {
  constructor(monitors: MonitorConfig[]) {
    super(monitors, { namespace: "PM", runningMessage: "Prediction Monitor running." });
  }
}
