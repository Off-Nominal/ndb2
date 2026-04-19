import { PoolClient } from "pg";
import pool from "@data/db";
import { eventsManager } from "@domain/events/events-manager";
import seasonsV2 from "@data/queries/seasons";
import * as API from "@offnominal/ndb2-api-types/v2";
import { createLogger } from "@mendahu/utilities";

const logger = createLogger({ namespace: "SM", env: ["dev", "production"] });

export class SeasonManager {
  private seasons: API.Entities.Seasons.Season[] = [];

  public getSeasonByIdentifier(
    identifier: "current" | "last"
  ): API.Entities.Seasons.Season {
    if (identifier === "current") {
      const season = this.seasons.find(
        (season) => season.identifier === "current"
      );
      if (!season) {
        throw new Error("Current season not found");
      }
      return season;
    }
    if (identifier === "last") {
      const season = this.seasons.find(
        (season) => season.identifier === "past"
      );
      if (!season) {
        throw new Error("Last season not found");
      }
      return season;
    }

    throw new Error("Invalid season identifier");
  }

  private async fetchAllSeasons(
    client: PoolClient
  ): Promise<API.Entities.Seasons.Season[]> {
    return seasonsV2.getAll(client)();
  }

  public refreshSeasons(client: PoolClient) {
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
        eventsManager.emit("season_start", newCurrentSeason);
      }

      this.seasons = allSeasons;
      logger.log("Successfully refreshed seasons cache.");
    });
  }

  public async initialize() {
    const client = await pool.connect();

    this.seasons = await this.fetchAllSeasons(client).then((results) => {
      client.release();
      return results;
    });

    logger.log("Seasons Manager running.");
  }
}

export const seasonsManager = new SeasonManager();
