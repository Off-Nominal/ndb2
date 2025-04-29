import { WebhookManager } from "../classes/WebhookManager";

const subscribers = [process.env.WEBHOOK_DISCORD_BOT];

const webhookManager = new WebhookManager(subscribers);

export default webhookManager;
