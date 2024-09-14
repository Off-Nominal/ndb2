import { PoolClient } from "pg";
import { APIPredictions, PredictionDriver } from "../../../types/predicitions";
import {
  generate_SEARCH_PREDICTIONS,
  SearchOptions,
} from "../predictions_search";
import queries from "..";
import { APISnoozes } from "../../../types/snoozes";

const add = (client: PoolClient) =>
  function (
    user_id: string,
    text: string,
    drive_date: Date,
    created_date: Date = new Date(),
    driver: PredictionDriver
  ): Promise<APIPredictions.AddPrediction> {
    let query: string;

    if (driver === "date") {
      query = queries.get("InsertDateDrivenPrediction");
    } else {
      query = queries.get("InsertEventDrivenPrediction");
    }

    return client
      .query<APIPredictions.AddPrediction>(query, [
        user_id,
        text,
        created_date,
        driver,
        drive_date,
      ])
      .then((response) => response.rows[0]);
  };

const getPredictionById = (client: PoolClient) =>
  function (
    prediction_id: number | string
  ): Promise<APIPredictions.GetPredictionById | null> {
    const query = queries.get("GetPredictionById");
    return client
      .query<APIPredictions.GetPredictionById>(query, [prediction_id])
      .then((response) => response.rows[0] ?? null);
  };

const retirePredictionById = (client: PoolClient) =>
  function (
    prediction_id: number | string
  ): Promise<APIPredictions.RetirePredictionById> {
    const query = queries.get("RetirePredictionById");
    return client
      .query<null>(query, [prediction_id])
      .then((response) => response.rows[0]);
  };

const closePredictionById = (client: PoolClient) =>
  function (
    prediction_id: number | string,
    triggerer_id: number | string | null,
    closed_date: Date
  ): Promise<APIPredictions.ClosePredictionById> {
    const query = queries.get("ClosePredictionById");
    return client
      .query<null>(query, [prediction_id, triggerer_id, closed_date])
      .then((response) => response.rows[0]);
  };

const judgePredictionById = (client: PoolClient) =>
  function (
    prediction_id: number | string
  ): Promise<APIPredictions.JudgePredictionById> {
    const query = queries.get("JudgePredictionById");
    return client
      .query<null>(query, [prediction_id])
      .then((response) => response.rows[0]);
  };

const getNextPredictionToTrigger = (client: PoolClient) =>
  function (): Promise<APIPredictions.GetNextPredictionToTrigger | undefined> {
    const query = queries.get("GetNextPredictionToTrigger");
    return client
      .query<APIPredictions.GetNextPredictionToTrigger>(query)
      .then((res) => res.rows[0]);
  };

const getNextPredictionToCheck = (client: PoolClient) =>
  function (): Promise<APIPredictions.GetNextPredictionToCheck | undefined> {
    const query = queries.get("GetNextPredictionToCheck");
    return client
      .query<APIPredictions.GetNextPredictionToCheck>(query)
      .then((res) => res.rows[0]);
  };

const getNextPredictionToJudge = (client: PoolClient) =>
  function (): Promise<APIPredictions.GetNextPredictionToJudge | undefined> {
    const query = queries.get("GetNextPredictionToJudge");
    return client
      .query<APIPredictions.GetNextPredictionToJudge>(query)
      .then((res) => res.rows[0]);
  };

const searchPredictions = (client: PoolClient) =>
  function (
    options: SearchOptions
  ): Promise<APIPredictions.SearchPredictions[]> {
    const [query, params] = generate_SEARCH_PREDICTIONS(options);
    return client
      .query<APIPredictions.SearchPredictions>(query, params)
      .then((res) => res.rows);
  };

const snoozePredictionById = (client: PoolClient) =>
  function (
    prediction_id: number | string,
    snooze_value: APISnoozes.SnoozeOptions
  ): Promise<APIPredictions.SnoozePredictionById> {
    const query = queries.get("SnoozePredictionById");
    return client
      .query<APIPredictions.SnoozePredictionById>(query, [
        prediction_id,
        snooze_value,
      ])
      .then((response) => response.rows[0]);
  };

export default {
  add,
  getPredictionById,
  retirePredictionById,
  closePredictionById,
  judgePredictionById,
  getNextPredictionToTrigger,
  getNextPredictionToCheck,
  getNextPredictionToJudge,
  searchPredictions,
  snoozePredictionById,
};
