export type Event = "untriggered_prediction";

export type Notification<T> = {
  event_name: Event;
  version: number;
  date: Date;
  data: T;
};
