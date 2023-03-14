import GAME_MECHANICS from "../config/game_mechanics";
import { MS_IN_A_DAY } from "../types/constants";
import { APIPredictions } from "../types/predicitions";

interface Bet {
  date: string;
  endorsed: boolean;
}

const calculatePointRatio = (correct: number, total: number): number => {
  // Account for divide by zero errors by guaranteeing minimum denominator
  const adjustedCorrect = correct > 0 ? correct : GAME_MECHANICS.minDenom;
  const roundingFigure = Math.pow(10, GAME_MECHANICS.payoutSigDigits);

  const initialRatio = total / adjustedCorrect;
  const baselinedRatio = initialRatio * GAME_MECHANICS.baseline;
  const smoothedRatio =
    Math.log(baselinedRatio) / GAME_MECHANICS.extremeness + 1;
  const roundedRatio =
    Math.round(smoothedRatio * roundingFigure) / roundingFigure;

  return roundedRatio;
};

export const calculatePointRatios = (
  closeDate: Date,
  bets: Bet[]
): [number, number] => {
  let endorsementPoints: number = 0;
  let undorsementPoints: number = 0;

  for (let i = 0; i < bets.length; i++) {
    const betTimestamp = new Date(bets[i].date);
    const points = Math.floor(
      (closeDate.getTime() - betTimestamp.getTime()) / MS_IN_A_DAY
    );

    if (bets[i].endorsed) {
      endorsementPoints += points | 1;
    } else {
      undorsementPoints += points | 1;
    }
  }

  const totalPoints = endorsementPoints + undorsementPoints;

  const endorsementPayoutRatio = calculatePointRatio(
    endorsementPoints,
    totalPoints
  );
  const endorsementPenaltyRatio = calculatePointRatio(
    undorsementPoints,
    totalPoints
  );

  return [endorsementPayoutRatio, endorsementPenaltyRatio];
};

export const addRatiosToPrediction = (
  ep: Omit<APIPredictions.EnhancedPrediction, "payouts">
): APIPredictions.EnhancedPrediction => {
  const [endorse, undorse] = calculatePointRatios(
    new Date(ep.due_date),
    ep.bets
  );

  const enhancedPrediction = {
    ...ep,
    payouts: {
      endorse,
      undorse,
    },
  };

  return enhancedPrediction;
};
