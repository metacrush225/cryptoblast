require('dotenv').config({ path: './.env' });
const { exec } = require('child_process');
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');

// Set up Discord Client
const discordClient = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// Path to your Python script
const pythonScript = './python/script.py'; // Adjust the path if needed

// Function to clear all messages in a channel
async function clearChannel(channel) {
    let fetched;
    do {
        fetched = await channel.messages.fetch({ limit: 100 }); // Fetch up to 100 messages at a time
        if (fetched.size > 0) {
            await channel.bulkDelete(fetched, true); // Delete fetched messages
            console.log(`Deleted ${fetched.size} messages in channel: ${channel.name}`);
        }
    } while (fetched.size > 0); // Continue until there are no more messages
}

// Function to check RSI and post to Discord
function checkRSI() {
    exec(`python ${pythonScript}`, async (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return;
        }

        try {
            const results = JSON.parse(stdout);

            for (const result of results) {
                const { symbol, rsi, chart, error: scriptError } = result;

                if (scriptError) {
                    console.error(`Error from Python script for ${symbol}: ${scriptError}`);
                    continue;
                }

                console.log(`Symbol: ${symbol}, RSI: ${rsi}`);

                if (rsi < 30 || rsi > 70) {
                    console.log(`RSI threshold met for ${symbol}. Posting chart and news to Discord...`);

                    const channelId = process.env[`DISCORD_${symbol.toUpperCase()}_CHANNEL_ID`]; // Fetch the channel ID dynamically
                    const channel = discordClient.channels.cache.get(channelId); // Get the channel object

                    if (channel) {
                        let message;

                        if (rsi < 30) {
                            message = `${symbol} est en survente (RSI = ${rsi} < 30). C'est souvent un bon moment pour acheter avant une reprise.\n`;
                        } else if (rsi > 70) {
                            message = `${symbol} est en surachat (RSI = ${rsi} > 70). Une baisse pourrait suivre. Pensez à sécuriser vos gains.\n`;
                        }

                        if (result.news && result.news.length > 0) {
                            message += "\n**Dernières Actualités :**\n";
                            result.news.forEach((article, index) => {
                                message += `${index + 1}. [${article.title}](${article.url})\n`;
                            });
                        }

                        await clearChannel(channel); // Clear previous messages
                        await channel.send({
                            content: message,
                            files: [chart], // Send the chart as an attachment
                        });

                        console.log(`Chart and news for ${symbol} posted to Discord.`);
                    } else {
                        console.error(`Discord channel not found for ${symbol}.`);
                    }
                }
            }
        } catch (err) {
            console.error('Error parsing Python script output:', err);
        }
    });
}

// Periodically check the Python script output
setInterval(checkRSI, 1800000); // Check every 30 minutes
//setInterval(checkRSI, 5000); // Check every 5 seconds

// Log when the bot is ready
discordClient.once('ready', () => {
    console.log(`Logged in as ${discordClient.user.tag}!`);
});


// Start the Discord bot
discordClient.login(process.env.DISCORD_BOT_TOKEN);
