import { PoolClient } from "pg";
import seasons from "../db/queries/seasons";
import pool from "../db";
import { APISeasons } from "../types/seasons";
import schedule from "node-schedule";
import webhookManager from "../config/webhook_subscribers";
import predictions from "../db/queries/predictions";
import { APIPredictions, PredictionLifeCycle } from "../types/predicitions";

export class SeasonManager {
  private seasons: APISeasons.EnhancedSeason[] = [];

  constructor() {
    let poolClient: PoolClient;

    pool
      .connect()
      .then((client) => {
        poolClient = client;
        return this.refreshSeasons(client);
      })
      .then(() => {
        console.log("[SM] Seasons Manager running.");
      })
      .catch((err) => {
        console.error(err);
        console.error("Could not refresh seasons.");
      })
      .finally(() => {
        poolClient.release();
      });

    schedule.scheduleJob("1 0 * * *", async () => {
      const poolClient = await pool.connect();

      try {
        await this.refreshSeasons(poolClient);
        console.log("[SM]: Seasons refreshed.");
      } catch (err) {
        console.error("Could not refresh seasons.");
        poolClient.release();
        return console.error(err);
      }

      const lastSeason = this.getSeasonByIdentifier("last");

      // Check if last season is still open
      if (lastSeason.closed) {
        return Promise.resolve();
      }

      // If open, determine if there are any unresolved predictions
      let remainingPredictions: APIPredictions.ShortEnhancedPrediction[] = [];

      try {
        remainingPredictions = await predictions.searchPredictions(poolClient)({
          season_id: lastSeason.id.toString(),
          statuses: [PredictionLifeCycle.OPEN, PredictionLifeCycle.CLOSED],
        });
      } catch (err) {
        console.error(
          "Could not fetch predictions to determine if season is closed."
        );
        poolClient.release();
        return console.error(err);
      }

      // If there are unresolved predictions, do not close the season
      if (remainingPredictions.length > 0) {
        return;
      }

      // If there are no unresolved predictions, post results and close season
      try {
        await poolClient.query("BEGIN");
        const results = await seasons.getResultsBySeasonId(poolClient)(
          lastSeason.id
        );
        await seasons.closeSeasonById(poolClient)(lastSeason.id);
        webhookManager.emit("season_end", results);
        await poolClient.query("COMMIT");

        console.log("[SM]: Season results posted.");
      } catch (err) {
        console.error("Could not post season results.");
        poolClient.release();
        return console.error(err);
      }

      poolClient.release();
    });
  }

  private fetchAllSeasons(client: PoolClient) {
    return seasons.getAll(client);
  }

  private refreshSeasons(client: PoolClient) {
    return this.fetchAllSeasons(client)().then((allSeasons) => {
      const newCurrentSeason = allSeasons.find(
        (season) => season.identifier === "current"
      );
      const newLastSeason = allSeasons.find(
        (season) => season.identifier === "past"
      );

      if (this.getSeasonByIdentifier("current")?.id === newLastSeason.id) {
        // Season has changed
        webhookManager.emit("season_start", newCurrentSeason);
      }
      this.seasons = allSeasons;
    });
  }

  public getSeasonByIdentifier(identifier: "current" | "last") {
    if (identifier === "current") {
      return this.seasons.find((season) => season.identifier === "current");
    }
    if (identifier === "last") {
      return this.seasons.find((season) => season.identifier === "past");
    }
  }
}

export const seasonManager = new SeasonManager();
