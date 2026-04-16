export type MonitorLog = (message: string) => void;

export type MonitorConfig = {
  name: string;
  schedule: string;
  callback: (log: MonitorLog) => Promise<void>;
};

