import { PoolClient } from "pg";
import seasons from "../db/queries/seasons";
import pool from "../db";
import { APISeasons } from "../types/seasons";
import schedule from "node-schedule";
import webhookManager from "../config/webhook_subscribers";
import predictions from "../db/queries/predictions";
import { PredictionLifeCycle } from "../types/predicitions";

export class SeasonManager {
  private seasons: APISeasons.EnhancedSeason[] = [];

  public getSeasonByIdentifier(identifier: "current" | "last") {
    if (identifier === "current") {
      return this.seasons.find((season) => season.identifier === "current");
    }
    if (identifier === "last") {
      return this.seasons.find((season) => season.identifier === "past");
    }
  }

  private async fetchAllSeasons(client: PoolClient) {
    return seasons.getAll(client)();
  }

  private refreshSeasons(client: PoolClient) {
    return this.fetchAllSeasons(client).then((allSeasons) => {
      const newCurrentSeason = allSeasons.find(
        (season) => season.identifier === "current"
      );
      const newLastSeason = allSeasons.find(
        (season) => season.identifier === "past"
      );

      if (allSeasons.length === 0 || !newCurrentSeason || !newLastSeason) {
        return;
      }

      const currentSeason = this.getSeasonByIdentifier("current");

      if (!currentSeason || currentSeason.id === newLastSeason.id) {
        // Season has changed
        webhookManager.emit("season_start", newCurrentSeason);
      }

      this.seasons = allSeasons;
      console.log("[SM]: Successfully refreshed seasons cache.");
    });
  }

  private async checkSeasonEndStatus(client: PoolClient) {
    try {
      await this.refreshSeasons(client);
    } catch (err) {
      return console.error("[SM]: Could not refresh seasons.", err);
    }

    const lastSeason = this.getSeasonByIdentifier("last");

    // Check if last season is still open
    if (!lastSeason || lastSeason?.closed) {
      return;
    }

    // If open, determine if there are any unresolved predictions
    try {
      const remainingPredictions = await predictions.searchPredictions(client)({
        season_id: lastSeason.id.toString(),
        statuses: [
          PredictionLifeCycle.OPEN,
          PredictionLifeCycle.CHECKING,
          PredictionLifeCycle.CLOSED,
        ],
      });

      // If there are unresolved predictions, do not close the season
      if (remainingPredictions.length > 0) {
        return;
      }
    } catch (err) {
      return console.error(
        "[SM]: Could not fetch predictions to determine if season is closed.",
        err
      );
    }

    // If there are no unresolved predictions, post results and close season
    try {
      await client.query("BEGIN");
      const results = await seasons.getResultsBySeasonId(client)(lastSeason.id);
      await seasons.closeSeasonById(client)(lastSeason.id);
      webhookManager.emit("season_end", results);
      await client.query("COMMIT");

      console.log("[SM]: Season results posted.");
    } catch (err) {
      return console.error("Could not post season results.", err);
    }
  }

  public async initialize() {
    const client = await pool.connect();

    this.seasons = await this.fetchAllSeasons(client).then((results) => {
      client.release();
      return results;
    });

    schedule.scheduleJob("1 0 * * *", async () => {
      const client = await pool.connect();

      this.checkSeasonEndStatus(client).finally(() => {
        client.release();
      });
    });

    console.log("[SM]: Seasons Manager running.");
  }
}

export const seasonsManager = new SeasonManager();
