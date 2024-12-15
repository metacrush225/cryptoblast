// discordUtils.js
const { Client, GatewayIntentBits } = require('discord.js');
const discordClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

discordClient.login(process.env.DISCORD_BOT_TOKEN);

async function sendToDiscord(message) {
    try {
        const channel = await discordClient.channels.fetch(process.env.DISCORD_CHANNEL_ID, { force: true });
        await channel.send(message);
        console.log(`Message sent to channel ${channel.name}`);
    } catch (error) {
        console.error('Error sending message to Discord:', error);
    }
}

module.exports = { discordClient, sendToDiscord };