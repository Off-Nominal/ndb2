import { isBefore } from "date-fns";
import { getAllSeasons } from "./seasons.queries";
import * as API from "@offnominal/ndb2-api-types/v2";

const getIdentifier = (
  start: Date,
  end: Date
): API.Entities.Seasons.Identifier => {
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
  getAll:
    (dbClient: any) => async (): Promise<API.Entities.Seasons.Season[]> => {
      const result = await getAllSeasons.run(undefined, dbClient);

      const seasons = result.map((season) => ({
        ...season,
        start: season.start.toISOString(),
        end: season.end.toISOString(),
        identifier: getIdentifier(new Date(season.start), new Date(season.end)),
      }));

      return seasons;
    },
};
