import { isBefore } from "date-fns";
import { Seasons } from "../../types/seasons";
import { getAllSeasons } from "./seasons.queries";

const getIdentifier = (start: Date, end: Date): Seasons.Identifier => {
  const now = new Date();
  if (isBefore(end, now)) {
    return "past";
  }

  if (isBefore(now, start)) {
    return "future";
  }

  return "current";
};

export default {
  getAll: (dbClient: any) => async (): Promise<Seasons.GET> => {
    const result = await getAllSeasons.run(null, dbClient);

    const seasons: Seasons.GET = result.map((season) => ({
      ...season,
      identifier: getIdentifier(new Date(season.start), new Date(season.end)),
    }));

    return seasons;
  },
};
