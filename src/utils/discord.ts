import axios from "axios";
import {
  APIGuildMember,
  RESTError,
  RESTGetAPIGuildMemberResult,
} from "discord-api-types/v10";
import envVars, { ALLOWED_ROLES } from "../config/web_app";
import { APIAuth } from "../types/auth";

const REDIRECT_URI = `${envVars.APP_URL}/api/auth/oauth`;
const GUILD_ID = envVars.DISCORD_GUILD_ID;

const isDiscordAPIError = (err: any): err is RESTError => {
  if (typeof err !== "object") {
    return false;
  }

  if (!("code" in err) || !("message" in err)) {
    return false;
  }

  return true;
};

const handleDiscordError = (res: Response, body: any) => {
  if (!isDiscordAPIError(body)) {
    if (res.status) {
      throw new Error(
        `Received an error from the Discord API but it is not recognized:\n- HTTP: ${res.status}\n- Message: ${res.statusText}`
      );
    } else {
      console.error(body);
      throw new Error(
        "Something went wrong with the Discord API call, but we don't recognize the error."
      );
    }
  }

  throw new Error(
    `Discord API Error:\n- HTTP: ${res.status}\n- Message: ${body.message}\n- Error Code: ${body.code}`
  );
};

const buildDiscordOAuthUrl = (options: {
  baseUrl: string;
  clientId: string;
  scope: string[];
  redirectUri: string;
  state: string;
}): string => {
  return `${options.baseUrl}/oauth2/authorize?response_type=code&client_id=${
    options.clientId
  }&scope=${encodeURIComponent(
    options.scope.join(" ")
  )}&redirect_uri=${encodeURIComponent(
    options.redirectUri
  )}&prompt=consent&state=${options.state}`;
};

export const buildAvatarUrl = (
  userId: string,
  hash: string | null | undefined,
  fallbackHash: string | null,
  discriminator: number
): string => {
  if (hash) {
    return `${envVars.DISCORD_CDN_BASE_URL}/guilds/${GUILD_ID}/users/${userId}/avatars/${hash}.png`;
  }

  if (fallbackHash) {
    return `${envVars.DISCORD_CDN_BASE_URL}/avatars/${userId}/${fallbackHash}.png`;
  }

  return `${envVars.DISCORD_CDN_BASE_URL}/embed/avatars/${
    discriminator % 5
  }.png`;
};

export const hasCorrectRole = (roles: string[]): boolean => {
  for (const role of roles) {
    if (ALLOWED_ROLES.has(role)) {
      return true;
    }
  }
  return false;
};

const baseUrl = envVars.DISCORD_API_BASE_URL;
const scope = ["identify", "guilds", "guilds.members.read"];

const authenticate = (
  code: string
): Promise<{
  access_token: string;
  token_type: string;
}> => {
  const body = new URLSearchParams({
    client_id: envVars.DISCORD_CLIENT_ID,
    client_secret: envVars.DISCORD_CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: "authorization_code",
    code,
    scope: scope.join(" "),
  }).toString();

  return axios
    .post(`${baseUrl}/oauth2/token`, body, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
    .then((res) => res.data);
};

const identify = (
  access_token: string
): Promise<RESTGetAPIGuildMemberResult> => {
  return axios
    .get(`${baseUrl}/users/@me/guilds/${GUILD_ID}/member`, {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    .then((res) => res.data);
};

const authorize = (
  member: RESTGetAPIGuildMemberResult
): {
  user: APIAuth.User | null;
  error: string | null;
} => {
  if (!hasCorrectRole(member.roles)) {
    return { user: null, error: "Incorrect role" };
  }

  if (!member.user) {
    return { user: null, error: "Missing Member information" };
  }

  const user = {
    name: member.nick || member.user?.username || "Unknown User",
    avatarUrl: buildAvatarUrl(
      member.user.id,
      member.avatar,
      member.user.avatar,
      Number(member.user.discriminator)
    ),
    discordId: member.user?.id,
  };

  return { user, error: null };
};

const getOAuthUrl = (state: string): string =>
  buildDiscordOAuthUrl({
    baseUrl,
    clientId: envVars.DISCORD_CLIENT_ID,
    redirectUri: REDIRECT_URI,
    scope,
    state,
  });

const discordAPI = {
  authenticate,
  identify,
  authorize,
  getOAuthUrl,
};

export default discordAPI;
