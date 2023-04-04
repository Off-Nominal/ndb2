import * as express from "express";
import { APIPredictions } from "./predicitions";

declare global {
  namespace Express {
    interface Request {
      prediction?: APIPredictions.EnhancedPrediction;
      user_id: string;
    }
  }
}
