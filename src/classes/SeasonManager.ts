import { PoolClient } from "pg";
import seasons from "../queries/seasons";
import pool from "../db";
import { APISeasons } from "../types/seasons";
import schedule from "node-schedule";
import webhookManager from "../config/webhook_subscribers";

export class SeasonManager {
  private seasons: APISeasons.EnhancedSeason[] = [];

  constructor() {
    this.refreshSeasons().then(() => {
      console.log("[SM] Seasons Manager running.");
    });

    schedule.scheduleJob("1 0 * * *", () => {
      this.refreshSeasons().then(() => {
        console.log("[SM]: Seasons refreshed.");
      });
    });
  }

  private fetchAllSeasons(client: PoolClient) {
    return seasons.getAll(client);
  }

  private refreshSeasons() {
    return pool
      .connect()
      .then((client) => {
        return this.fetchAllSeasons(client)().finally(() => client.release());
      })
      .then((seasons) => {
        const newCurrentSeason = seasons.find(
          (season) => season.identifier === "current"
        );
        const newLastSeason = seasons.find(
          (season) => season.identifier === "past"
        );

        if (this.getSeasonByIdentifier("current")?.id === newLastSeason.id) {
          // Season has changed
          webhookManager.emit("season_start", newCurrentSeason);
        }
        this.seasons = seasons;
      })
      .catch((err) => {
        console.error(err);
        console.error("Could not refresh seasons.");
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
