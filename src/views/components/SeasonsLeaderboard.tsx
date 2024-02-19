import { ReactNode } from "react";
import { Leaderboard, LeaderboardProps } from "./Leaderboard";
import { SelectOption } from "./BaseSelect";
import { Select } from "./Select";

export type SeasonsLeaderboard = LeaderboardProps & {
  seasonOptions: SelectOption<ReactNode>[];
};

export const SeasonsLeaderboard = (props: SeasonsLeaderboard) => {
  return (
    <>
      <div
        className="flex flex-col lg:flex-row justify-between gap-4"
        id="seasons-leaderboards"
      >
        <h2>Season Stats</h2>
        <Select
          name={"Season Selector"}
          id="leaderboards-seasons-selector"
          options={props.seasonOptions}
          placeholder="Select season"
          value={props.seasonOptions[0].value}
          className="min-w-80"
          handlers={{
            get: (value) => `/leaderboards?season=${value}`,
            target: "#seasons-leaderboards",
            push: true,
            swap: "outerHTML",
          }}
        />
      </div>
      <div className="my-8 flex flex-col justify-center gap-4 lg:flex-row">
        <Leaderboard
          points={props.points}
          predictions={props.predictions}
          bets={props.bets}
        />
      </div>
    </>
  );
};
