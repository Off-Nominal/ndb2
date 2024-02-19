// ENV VARS

export const getAppUrl = () => {
  const baseUrl = process.env.APP_URL || "localhost:3000";
  if (process.env.NODE_ENV !== "dev") {
    return "https://" + baseUrl;
  } else {
    return "http://" + baseUrl;
  }
};

const isProdDiscord = process.env.DISCORD_ENV === "production";

const envVars = {
  APP_URL: getAppUrl(),
  //   NDB2_API_BASEURL: process.env.NDB2_API_BASEURL || "",
  //   NDB2_API_KEY: process.env.NDB2_API_KEY || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
  DISCORD_API_BASE_URL: "https://discord.com/api/v10",
  DISCORD_CDN_BASE_URL: "https://cdn.discordapp.com",
  DISCORD_ENV: process.env.DISCORD_ENV || "development",
  DISCORD_CLIENT_ID: isProdDiscord
    ? process.env.PROD_DISCORD_CLIENT_ID || ""
    : process.env.DISCORD_CLIENT_ID || "",
  DISCORD_CLIENT_SECRET: isProdDiscord
    ? process.env.PROD_DISCORD_CLIENT_SECRET || ""
    : process.env.DISCORD_CLIENT_SECRET || "",
  DISCORD_BOT_TOKEN: isProdDiscord
    ? process.env.PROD_DISCORD_CLIENT_BOT_TOKEN || ""
    : process.env.DISCORD_CLIENT_BOT_TOKEN || "",
  DISCORD_GUILD_ID: isProdDiscord
    ? process.env.PROD_OFFNOMDISCORD_GUILD_ID || ""
    : process.env.OFFNOMDISCORD_GUILD_ID || "",
  ROLE_ID_HOST: isProdDiscord
    ? process.env.PROD_ROLE_ID_HOST || ""
    : process.env.ROLE_ID_HOST || "",
  ROLE_ID_MODS: isProdDiscord
    ? process.env.PROD_ROLE_ID_MODS || ""
    : process.env.ROLE_ID_MODS || "",
  ROLE_ID_MECO: isProdDiscord
    ? process.env.PROD_ROLE_ID_MECO || ""
    : process.env.ROLE_ID_MECO || "",
  ROLE_ID_WM: isProdDiscord
    ? process.env.PROD_ROLE_ID_WM || ""
    : process.env.ROLE_ID_WM || "",
  ROLE_ID_YT: isProdDiscord
    ? process.env.PROD_ROLE_ID_YT || ""
    : process.env.ROLE_ID_YT || "",
  ROLE_ID_ANOM: isProdDiscord
    ? process.env.PROD_ROLE_ID_ANOM || ""
    : process.env.ROLE_ID_ANOM || "",
  ROLE_ID_GUEST: isProdDiscord
    ? process.env.PROD_ROLE_ID_GUEST || ""
    : process.env.ROLE_ID_GUEST || "",
};

export const ALLOWED_ROLES = new Set([
  envVars.ROLE_ID_HOST,
  envVars.ROLE_ID_MODS,
  envVars.ROLE_ID_MECO,
  envVars.ROLE_ID_WM,
  envVars.ROLE_ID_YT,
  envVars.ROLE_ID_ANOM,
  envVars.ROLE_ID_GUEST,
]);

// ENV VAR Checks
if (isProdDiscord) {
  if (process.env.PROD_DISCORD_CLIENT_ID === "") {
    throw new Error(
      "PROD_DISCORD_CLIENT_ID is not defined. PROD Discord variables must be defined to run in Production Discord mode."
    );
  }
  if (process.env.PROD_DISCORD_CLIENT_SECRET === "") {
    throw new Error(
      "PROD_DISCORD_CLIENT_SECRET is not defined. PROD Discord variables must be defined to run in Production Discord mode."
    );
  }
  if (process.env.PROD_DISCORD_CLIENT_BOT_TOKEN === "") {
    throw new Error(
      "PROD_DISCORD_CLIENT_BOT_TOKEN is not defined. PROD Discord variables must be defined to run in Production Discord mode."
    );
  }
  if (process.env.PROD_OFFNOMDISCORD_GUILD_ID === "") {
    throw new Error(
      "PROD_OFFNOMDISCORD_GUILD_ID is not defined. PROD Discord variables must be defined to run in Production Discord mode."
    );
  }
} else {
  if (process.env.DISCORD_CLIENT_ID === "") {
    throw new Error(
      "DISCORD_CLIENT_ID is not defined. Please define it in your environment variables."
    );
  }
  if (process.env.DISCORD_CLIENT_SECRET === "") {
    throw new Error(
      "DISCORD_CLIENT_SECRET is not defined. Please define it in your environment variables."
    );
  }
  if (process.env.DISCORD_CLIENT_BOT_TOKEN === "") {
    throw new Error(
      "DISCORD_CLIENT_BOT_TOKEN is not defined. Please define it in your environment variables."
    );
  }
  if (process.env.OFFNOMDISCORD_GUILD_ID === "") {
    throw new Error(
      "OFFNOMDISCORD_GUILD_ID is not defined. Please define it in your environment variables."
    );
  }
}

if (ALLOWED_ROLES.size < 1) {
  throw new Error(
    "Please specify at least one allowed role in your environment variables."
  );
}

if (ALLOWED_ROLES.size !== 7) {
  console.warn("All Discord Roles are not defined in Environment Variables.");
}

// if (envVars.NDB2_API_BASEURL === "") {
//   throw new Error(
//     "NDB2_API_BASEURL is not defined. Please define it in your environment variables."
//   );
// }

// if (envVars.NDB2_API_KEY === "") {
//   throw new Error(
//     "NDB2_API_KEY is not defined. Please define it in your environment variables."
//   );
// }

if (envVars.JWT_SECRET === "") {
  throw new Error(
    "JWT_SECRET is not defined. Please define it in your environment variables."
  );
}

export default envVars;
