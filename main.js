require('dotenv').config({ path: './.env' });
const { exec } = require('child_process');
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const AlertManager = require('./alertManager');

const lastCryptoCommand = require('./lastCryptoCommand');

// Constants
const pythonScript = './python/script.py';

// Initialize Discord Client
const discordClient = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

let alertManager; // Declare alertManager globally


const symbolToNameMap = {
    XRPUSDT: "XRP",
    BTCUSDT: "Bitcoin",
    ETHUSDT: "Ethereum",
    DOGEUSDT: "Dogecoin",
    SHIBUSDT: "ShibaInu"
    // Add more mappings as needed
};



const DISCORD_NEWS_CHANNEL_ID = process.env.DISCORD_NEWS_CHANNEL_ID;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;


console.log('AlertManager is initialized.');


if (!DISCORD_BOT_TOKEN || !DISCORD_CLIENT_ID || !DISCORD_NEWS_CHANNEL_ID) {
    console.error("Missing required environment variables. Check your .env file.");
    process.exit(1);
}


const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN);



const convertSymbolsToQuery = (symbols) => {
    return symbols
        .map(symbol => symbolToNameMap[symbol] || symbol) // Fallback to original if no mapping exists
        .join(" OR ");
};


// Register slash commands
const commands = [
    {
        name: lastCryptoCommand.name,
        description: lastCryptoCommand.description,
    },
];

// Register the command
(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(Routes.applicationCommands(DISCORD_CLIENT_ID), {
            body: commands,
        });

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
})();



// Command handling
discordClient.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === lastCryptoCommand.name) {
        await lastCryptoCommand.execute(interaction, discordClient, DISCORD_NEWS_CHANNEL_ID);
    }
});


// Main function to check RSI
const checkRSI = () => {
    console.log("Starting RSI check...");
    exec(`python ${pythonScript}`, async (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing Python script: ${error.message}`);
            return;
        }

        try {
            const results = JSON.parse(stdout);
            const symbolsBelow30 = [];
            const symbolsAbove70 = [];

            for (const result of results) {
                const { symbol, rsi, chart } = result;

                if (rsi < 60) symbolsBelow30.push({ symbol, chart });
                if (rsi > 70) symbolsAbove70.push({ symbol, chart });
            }

            console.log(`symbolBelow30.length = ${symbolsBelow30.length}`);
            console.log(`symbolAbove70.length = ${symbolsAbove70.length}`);

            const alertSymbols = [...symbolsBelow30, ...symbolsAbove70];
            if (alertSymbols.length > 0) {
                const newsQuery = convertSymbolsToQuery(alertSymbols.map(({ symbol }) => symbol));

                await alertManager.sendGraph(symbolsBelow30, symbolsAbove70);

                // Send Alerts
                // await alertManager.sendApiNewsAlert(
                //     newsQuery,
                //     DISCORD_NEWS_CHANNEL_ID
                // );

                // await alertManager.sendTwitterAlert(
                //     symbolsBelow30,
                //     symbolsAbove70,
                //     newsQuery,
                //     process.env.DISCORD_TWITTER_CHANNEL_ID
                // );
            }
        } catch (err) {
            console.error('Error parsing Python script output:', err);
        }
    });
};


// Schedule RSI checks
setInterval(checkRSI, 1800000);


// Discord bot ready event
discordClient.once('ready', () => {
    console.log(`Logged in as ${discordClient.user.tag}!`);

    // Initialize AlertManager after client is ready
    alertManager = new AlertManager(
        discordClient,
        NEWS_API_KEY,
        TWITTER_BEARER_TOKEN
    );
    console.log('AlertManager is initialized.');

    // Start RSI check
    checkRSI();

});

// Start Discord bot
discordClient.login(DISCORD_BOT_TOKEN);

