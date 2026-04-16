import { MonitorRunner } from "../monitors/MonitorRunner";
import { MonitorConfig } from "../monitors/types";

export default class SeasonMonitor extends MonitorRunner {
  constructor(monitors: MonitorConfig[]) {
    super(monitors, { namespace: "SeM", runningMessage: "Season Monitor running." });
  }
}

