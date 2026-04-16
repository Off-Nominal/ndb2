import { MonitorRunner } from "../monitors/MonitorRunner";
import { MonitorConfig } from "../monitors/types";

export default class PredictionMonitor extends MonitorRunner {
  constructor(monitors: MonitorConfig[]) {
    super(monitors, { namespace: "PM", runningMessage: "Prediction Monitor running." });
  }
}
