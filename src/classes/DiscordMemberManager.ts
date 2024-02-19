import { Client, GatewayIntentBits, Guild } from "discord.js";
import envVars from "../config/web_app";

export class DiscordMemberManager {
  private client: Client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  });
  private guild: Guild;

  initialize() {
    this.client.login(envVars.DISCORD_BOT_TOKEN);

    this.client.once("ready", () => {
      console.log("[DISCORD] Discord bot is ready");
      this.guild = this.client.guilds.cache.find(
        (guild) => guild.id === envVars.DISCORD_GUILD_ID
      );
      console.log(`[DISCORD] Discord Guild (ID: ${this.guild.id}) fetched`);
      this.fetchAllMembers().then((m) => {
        console.log(`[DISCORD] Fetched ${m.size} guild members and cached`);
      });
    });

    this.client.on("guildMemberAdd", (member) => {
      this.fetchMember(member.id, true);
    });

    this.client.on("guildMemberUpdate", (member) => {
      this.fetchMember(member.id, true);
    });
  }

  fetchAllMembers() {
    return this.guild.members.fetch();
  }

  fetchMember(discordId: string, force: boolean = false) {
    return this.guild.members.fetch({
      user: discordId,
      cache: !force,
      force: false,
    });
  }
}

export const discordMemberManager = new DiscordMemberManager();
