import { PoolClient } from "pg";
import seasons from "../queries/seasons";
import pool from "../db";
import { APISeasons } from "../types/seasons";
import schedule from "node-schedule";
import webhookManager from "../config/webhook_subscribers";

export class SeasonManager {
  private currentSeason: APISeasons.Season;
  private lastSeason: APISeasons.Season;

  constructor() {
    this.refreshSeasons().then(() => {
      console.log("[SM] Seasons Manager running.");
    });

    schedule.scheduleJob("1 0 * * *", () => {
      this.refreshSeasons().then(() => {
        console.log("[SM] Seasons refreshed.");
      });
    });
  }

  private fetchCurrentSeason(client: PoolClient) {
    return seasons.getSeasonByIdentifier(client)("current");
  }

  private fetchLastSeason(client: PoolClient) {
    return seasons.getSeasonByIdentifier(client)("last");
  }

  private refreshSeasons() {
    return pool
      .connect()
      .then((client) => {
        const promises = [
          this.fetchCurrentSeason(client),
          this.fetchLastSeason(client),
        ];

        return Promise.all(promises).finally(() => client.release());
      })
      .then(([currentSeason, lastSeason]) => {
        if (this.currentSeason?.id === lastSeason.id) {
          // Season has changed
          webhookManager.emit("season_start", currentSeason);
        }
        this.currentSeason = currentSeason;
        this.lastSeason = lastSeason;
      })
      .catch((err) => {
        console.error(err);
        console.error("Could not refresh seasons.");
      });
  }

  public getSeasonByIdentifier(identifier: "current" | "last") {
    if (identifier === "current") {
      return this.currentSeason;
    }
    if (identifier === "last") {
      return this.lastSeason;
    }
  }
}

export const seasonManager = new SeasonManager();
