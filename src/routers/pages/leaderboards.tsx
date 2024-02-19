import { Router } from "express";
import { renderToString } from "react-dom/server";
import { BaseLayout } from "../../views/layouts/BaseLayout";
import { MainLayout } from "../../views/layouts/MainLayout";
import { Leaderboard } from "../../views/components/Leaderboard";
import scores from "../../queries/scores";
import { getDbClient } from "../../middleware/getDbClient";
import { ErrorCode } from "../../types/responses";
import { APIScores } from "../../types/scores";
import { discordMemberManager } from "../../classes/DiscordMemberManager";
import { buildAvatarUrl } from "../../utils/discord";
import seasons from "../../queries/seasons";
import { SelectOption } from "../../views/components/BaseSelect";
import React from "react";
import { format } from "date-fns";
import { Select } from "../../views/components/Select";
import { SeasonsLeaderboard } from "../../views/components/SeasonsLeaderboard";
import { render } from "react-dom";

export type Leader = {
  discordId: string;
  rank: number;
  avatarUrl: string;
  name: string;
  value: number | string | undefined;
};

const mapToLeaders = (
  leaders:
    | APIScores.PointsLeader[]
    | APIScores.PredictionsLeader[]
    | APIScores.BetsLeader[],
  targetArray: Leader[]
) => {
  const promises = [];

  for (const leader of leaders) {
    promises.push(
      discordMemberManager
        .fetchMember(leader.discord_id)
        .then((member) => {
          targetArray.push({
            discordId: leader.discord_id,
            rank: leader.rank,
            avatarUrl: buildAvatarUrl(
              member.user.id,
              member.avatar,
              member.user.avatar,
              Number(member.user?.discriminator)
            ),
            name: member.displayName || "Unknown User",
            value:
              "points" in leader
                ? leader.points
                : "bets" in leader
                ? leader.bets.total
                : leader.predictions.total,
          });
        })
        .catch((err) => {
          targetArray.push({
            discordId: leader.discord_id,
            rank: leader.rank,
            avatarUrl: buildAvatarUrl(leader.discord_id, null, null, 0),
            name: "Unknown User",
            value:
              "points" in leader
                ? leader.points
                : "bets" in leader
                ? leader.bets.total
                : leader.predictions.total,
          });
        })
    );
  }

  return Promise.allSettled(promises);
};

export const homePage = (router: Router) => {
  router.get("/leaderboards", getDbClient, async (req, res) => {
    const { season } = req.query;
    if (!season) {
      return res.redirect("/leaderboards?season=current");
    }

    const isHtmx = req.header("HX-Request") === "true";

    const s_points: Leader[] = [];
    const s_predictions: Leader[] = [];
    const s_bets: Leader[] = [];
    const a_points: Leader[] = [];
    const a_predictions: Leader[] = [];
    const a_bets: Leader[] = [];
    const seasonOptions: SelectOption<React.ReactNode>[] = [];

    const promises: Promise<any>[] = [
      scores
        .getLeaderboard(req.dbClient)("points", "current")
        .then((res) => mapToLeaders(res.leaders, s_points)),
      scores
        .getLeaderboard(req.dbClient)("predictions", "current")
        .then((res) => mapToLeaders(res.leaders, s_predictions)),
      scores
        .getLeaderboard(req.dbClient)("bets", "current")
        .then((res) => mapToLeaders(res.leaders, s_bets)),
      seasons
        .getAll(req.dbClient)()
        .then((res) => {
          for (const season of res) {
            const name = season.name;
            const identifier = season.identifier;
            const start = format(new Date(season.start), "MMM d, yyyy");
            const end = format(new Date(season.end), "MMM d, yyyy");

            seasonOptions.push({
              value: season.id.toString(),
              ariaLabel: `${name} - ${identifier} (${start} - ${end})`,
              label: (
                <div>
                  <div className="flex grow justify-between gap-2">
                    <div className="">
                      <span>{name}</span>
                    </div>
                    <div className="">
                      <p className="text-xs uppercase text-slate-500 dark:text-slate-300">
                        ( {identifier} )
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div>
                      <p className="text-sm">
                        {start} - {end}
                      </p>
                    </div>
                  </div>
                </div>
              ),
            });
          }
        }),
    ];

    if (!isHtmx) {
      promises.push(
        scores
          .getLeaderboard(req.dbClient)("points")
          .then((res) => mapToLeaders(res.leaders, a_points))
      );
      promises.push(
        scores
          .getLeaderboard(req.dbClient)("predictions")
          .then((res) => mapToLeaders(res.leaders, a_predictions))
      );
      promises.push(
        scores
          .getLeaderboard(req.dbClient)("bets")
          .then((res) => mapToLeaders(res.leaders, a_bets))
      );
    }

    try {
      await Promise.all(promises);

      if (isHtmx) {
        return res.send(
          renderToString(
            <SeasonsLeaderboard
              seasonOptions={seasonOptions}
              points={s_points}
              predictions={s_predictions}
              bets={s_bets}
            />
          )
        );
      }

      res.send(
        renderToString(
          <BaseLayout
            scripts={
              <>
                <script
                  src="https://unpkg.com/htmx.org@1.9.10"
                  integrity="sha384-D1Kt99CQMDuVetoL1lrYwg5t+9QdHe7NLX/SoJYkXDFfX37iInKRy5xLSi8nO7UC"
                  crossOrigin="anonymous"
                ></script>
                {/* <script src="scripts/select.js"></script> */}
                <script
                  defer
                  src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"
                ></script>
              </>
            }
          >
            <MainLayout activePath="leaderboards">
              <SeasonsLeaderboard
                seasonOptions={seasonOptions}
                points={s_points}
                predictions={s_predictions}
                bets={s_bets}
              />
              <h2>All-Time Stats</h2>
              <div className="my-8 flex flex-col justify-center gap-4 lg:flex-row">
                <Leaderboard
                  points={a_points}
                  predictions={a_predictions}
                  bets={a_bets}
                />
              </div>
            </MainLayout>
          </BaseLayout>
        )
      );
    } catch (err) {
      console.error(err);
      res.redirect("/error/" + ErrorCode.WEB_APP_DATA_FETCH_ERROR);
    }
  });
};
