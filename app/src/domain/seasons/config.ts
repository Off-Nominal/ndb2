import { MonitorConfig } from "@domain/monitors/types";
import { withPoolClient } from "@domain/monitors/withPoolClient";
import { eventsManager } from "@domain/events/eventsManager";
import predictions from "@data/queries/predictions";
import seasonsV2 from "@data/queries/seasons";
import { seasonsManager } from "./SeasonManager";

export const monitors: MonitorConfig[] = [
  {
    name: "Season End Check",
    schedule: "1 0 * * *", // daily at 00:01
    callback: (log) => {
      return withPoolClient(async (client) => {
        await seasonsManager.refreshSeasons(client);

        const lastSeason = seasonsManager.getSeasonByIdentifier("last");
        if (!lastSeason || lastSeason.closed) {
          return;
        }

        const remainingPredictions = await predictions.search(client)({
          season_id: lastSeason.id,
          statuses: ["open", "checking", "closed"],
          page: 1,
        });

        if (remainingPredictions.length > 0) {
          log(
            `Season ${lastSeason.id} still has unresolved predictions; not closing.`,
          );
          return;
        }

        try {
          await client.query("BEGIN");
          const results = await seasonsV2.getResultsById(client)(lastSeason.id);
          if (!results) {
            throw new Error(`No season results found for season ${lastSeason.id}`);
          }
          await seasonsV2.closeById(client)(lastSeason.id);
          await client.query("COMMIT");
          eventsManager.emit("season_end", results);
          log("Season results posted.");
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        }
      });
    },
  },
];

