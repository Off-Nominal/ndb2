import * as express from "express";
import { PoolClient } from "pg";
import { APIPredictions } from "./predicitions";

declare global {
  namespace Express {
    interface Request {
      prediction?: APIPredictions.EnhancedPrediction;
      user_id: string;
      dbClient: PoolClient;
    }
  }
}
