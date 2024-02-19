import { truncateText } from "../../helpers";
import { Leader } from "../../routers/pages/leaderboards";
import { Card } from "./Card";
import { LeaderboardListItem } from "./LeaderboardListItem";
import { List } from "./List";

export type LeaderboardProps = {
  points: Leader[];
  predictions: Leader[];
  bets: Leader[];
};

export const Leaderboard = (props: LeaderboardProps) => {
  return (
    <>
      <Card
        header={
          <h2 className="text-center text-2xl uppercase text-white sm:text-3xl">
            Points
          </h2>
        }
        className="grow basis-4"
      >
        <List
          items={props.points.map((l) => {
            return (
              <LeaderboardListItem
                key={l.discordId}
                rank={l.rank}
                name={truncateText(l.name, 20)}
                value={l.value}
                avatarUrl={l.avatarUrl}
              />
            );
          })}
        />
      </Card>
      <Card
        header={
          <h2 className="text-center text-2xl uppercase text-white sm:text-3xl">
            Predictions
          </h2>
        }
        className="grow basis-4"
      >
        <List
          items={props.predictions.map((l) => {
            return (
              <LeaderboardListItem
                key={l.discordId}
                rank={l.rank}
                name={truncateText(l.name, 24)}
                value={l.value}
                avatarUrl={l.avatarUrl}
              />
            );
          })}
        />
      </Card>
      <Card
        header={
          <h2 className="text-center text-2xl uppercase text-white sm:text-3xl">
            Bets
          </h2>
        }
        className="grow basis-4"
      >
        <List
          items={props.bets.map((l) => {
            return (
              <LeaderboardListItem
                key={l.discordId}
                rank={l.rank}
                name={truncateText(l.name, 20)}
                value={l.value}
                avatarUrl={l.avatarUrl}
              />
            );
          })}
        />
      </Card>
    </>
  );
};
