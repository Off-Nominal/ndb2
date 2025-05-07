import { WebhookManager } from "../classes/WebhookManager";

const discordBot = process.env.WEBHOOK_DISCORD_BOT;

const subscribers: string[] = [];

if (discordBot) {
  subscribers.push(discordBot);
}

const webhookManager = new WebhookManager(subscribers);

export default webhookManager;
