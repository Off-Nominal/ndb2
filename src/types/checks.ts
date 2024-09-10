export namespace APIChecks {
  export type Check = {
    id: number;
    prediction_id: number;
    check_date: string;
    closed: boolean;
    closed_at: string | null;
  };

  export type AddCheck = Check;
}
