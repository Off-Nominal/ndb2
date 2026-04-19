import { MonitorRunner } from "@domain/monitors/monitor-runner";
import { MonitorConfig } from "@domain/monitors/types";

export default class SeasonMonitor extends MonitorRunner {
  constructor(monitors: MonitorConfig[]) {
    super(monitors, { namespace: "SeM", runningMessage: "Season Monitor running." });
  }
}

