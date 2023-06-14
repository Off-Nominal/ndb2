import { PoolClient } from "pg";
import seasons from "../queries/seasons";
import pool from "../db";
import { APISeasons } from "../types/seasons";
import schedule from "node-schedule";
import webhookManager from "../config/webhook_subscribers";
import { add, isAfter, sub } from "date-fns";

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

  private postCompletedSeasonResults(date: Date) {
    let job;
    let poolClient: PoolClient;

    job = schedule.scheduleJob(date, () => {
      pool
        .connect()
        .then((client) => {
          poolClient = client;
          return seasons.getResultsBySeasonId(client)(
            this.getSeasonByIdentifier("last")?.id
          );
        })
        .then((results) => {
          webhookManager.emit("season_end", results);
        })
        .catch((err) => {
          console.error("Error emiting season results");
          console.error(err);
        })
        .finally(() => {
          job.cancel();
          poolClient.release();
        });
    });

    console.log("[SM]: Seasons results scheduled. for ", date);
  }

  private refreshSeasons() {
    let poolClient: PoolClient;

    return pool
      .connect()
      .then((client) => {
        poolClient = client;
        return this.fetchAllSeasons(poolClient)();
      })
      .then((allSeasons) => {
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

        const now = new Date();
        const postDate = add(new Date(newLastSeason.end), { days: 2 });

        if (isAfter(postDate, now)) {
          this.postCompletedSeasonResults(postDate);
        }
      })
      .catch((err) => {
        console.error(err);
        console.error("Could not refresh seasons.");
      })
      .finally(() => poolClient.release());
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
