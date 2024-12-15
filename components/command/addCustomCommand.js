const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
require('dotenv').config();

const token = process.env.DISCORD_BOT_TOKEN; // Bot token
const clientId = process.env.DISCORD_CLIENT_ID; // Bot client ID
const guildId = process.env.DISCORD_GUILD_ID; // Guild ID where the commands are registered

const commands = [
    {
        name: 'linktwitch',
        description: 'Interact with twitch Account'
    },
    {
        name: 'linkyoutube',
        description: 'Interact with google Account'
    },
    {
        name: 'showprofile',
        description: 'Use it to show legit user profiles'
    }


];

async function registerCommands() {
    const rest = new REST({ version: '9' }).setToken(token);

    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Failed to refresh commands:', error);
    }
}



module.exports = { registerCommands };