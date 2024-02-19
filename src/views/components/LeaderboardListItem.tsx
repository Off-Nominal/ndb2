import { Avatar } from "./Avatar";

type LeaderboardEntryProps = {
  rank: number;
  avatarUrl: string;
  name: string;
  value: number | string | undefined;
};

const defaultAvatarUrl = "https://cdn.discordapp.com/embed/avatars/0.png";

export const LeaderboardListItem = (props: LeaderboardEntryProps) => {
  return (
    <div className="flex items-center">
      <div className="mr-2 flex shrink-0 grow-0 basis-5 justify-end">
        <span>{props.rank}</span>
      </div>
      <div className="mx-2 shrink-0 grow-0 basis-8">
        <Avatar
          src={props.avatarUrl || defaultAvatarUrl}
          alt={`Avatar photo for user ${props.name}`}
          size={30}
        />
      </div>
      <div className="mx-2 grow">
        <span>{props.name}</span>
      </div>
      <div className="ml-2 shrink-0 grow-0 ">
        <span>{props.value?.toLocaleString("en-US") || "-"}</span>
      </div>
    </div>
  );
};
