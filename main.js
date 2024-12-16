require('dotenv').config({ path: './.env' });
const { exec } = require('child_process');
const { Client, GatewayIntentBits } = require('discord.js');
const { TwitterApi } = require('twitter-api-v2');
const axios = require('axios');

// Constants
const pythonScript = './python/script.py';

// Initialize Discord Client
const discordClient = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// Utility functions
const clearChannel = async (channel) => {
    try {
        let fetched;
        do {
            fetched = await channel.messages.fetch({ limit: 100 });
            if (fetched.size > 0) {
                await channel.bulkDelete(fetched, true);
                console.log(`Deleted ${fetched.size} messages in channel: ${channel.name}`);
            }
        } while (fetched.size > 0);
    } catch (error) {
        console.error(`Error clearing messages in channel ${channel.name}:`, error);
    }
};

const fetchNews = async (query, maxArticles = 5) => {
    const apiKey = process.env.NEWS_API_KEY;
    const url = "https://newsapi.org/v2/everything";
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    try {
        const response = await axios.get(url, {
            params: {
                q: query,
                language: "fr",
                sortBy: "publishedAt",
                from: yesterday,
                to: today,
                apiKey,
                pageSize: maxArticles,
            },
        });

        if (response.status === 200) {
            return response.data.articles.map(article => ({
                title: article.title,
                url: article.url,
            }));
        }
        console.error(`NewsAPI error: ${response.status}`);
        return [];
    } catch (error) {
        console.error('Error fetching news:', error);
        return [];
    }
};

const fetchTweets = async (query) => {
    const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);

    try {
        const response = await client.v2.search(query, {
            "tweet.fields": "created_at",
            max_results: 10,
        });
        return response.data || [];
    } catch (error) {
        console.error('Error fetching tweets:', error);
        return [];
    }
};

const formatMessage = (symbol, rsi, result) => {
    let message = "";

    if (rsi < 41) {
        message = `${symbol} is oversold (RSI = ${rsi}). It might be a good time to buy.\n`;
    } else if (rsi > 70) {
        message = `${symbol} is overbought (RSI = ${rsi}). Consider securing profits.\n`;
    } else {
        return `${symbol} has a neutral RSI (${rsi}). No immediate action suggested.\n`;
    }

    if (result.news?.length) {
        message += "\n**Latest News:**\n";
        result.news.forEach((article, index) => {
            message += `${index + 1}. [${article.title}](${article.url})\n`;
        });
    }

    return message;
};

const sendSymbolAlert = async (channel, symbol, rsi, result) => {
    const message = formatMessage(symbol, rsi, result);
    await clearChannel(channel);
    await channel.send({
        content: message,
        files: result.chart ? [result.chart] : [],
    });
};

const sendSummaryAlert = async (generalChannel, symbolsBelow30, symbolsAbove70, allNews, tweets) => {
    let summaryMessage = "**RSI Alert Summary**\n\n";
    if (symbolsBelow30.length) summaryMessage += `**Oversold (RSI < 30):** ${symbolsBelow30.join(", ")}\n\n`;
    if (symbolsAbove70.length) summaryMessage += `**Overbought (RSI > 70):** ${symbolsAbove70.join(", ")}\n\n`;

    if (allNews.length) {
        summaryMessage += "**Relevant News Articles:**\n";
        allNews.forEach((article, index) => {
            summaryMessage += `${index + 1}. [${article.title}](${article.url})\n`;
        });
    }

    if (tweets.length) {
        summaryMessage += "\n**Relevant Tweets:**\n";
        tweets.forEach((tweet, index) => {
            summaryMessage += `${index + 1}. ${tweet.text} (Posted: ${tweet.created_at})\n`;
        });
    }

    await clearChannel(generalChannel);
    await generalChannel.send({ content: summaryMessage });
};

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
                const { symbol, rsi, chart, error: scriptError } = result;

                if (scriptError) {
                    console.error(`Error for ${symbol} in Python script: ${scriptError}`);
                    continue;
                }

                console.log(`Symbol: ${symbol}, RSI: ${rsi}`);

                if (rsi < 41) symbolsBelow30.push(symbol);
                if (rsi > 70) symbolsAbove70.push(symbol);

                const channelId = process.env[`DISCORD_${symbol.toUpperCase()}_CHANNEL_ID`];
                const channel = discordClient.channels.cache.get(channelId);

                if (channel && (rsi < 41 || rsi > 70)) {
                    await sendSymbolAlert(channel, symbol, rsi, result);
                } else {
                    console.warn(
                        channel
                            ? `RSI for ${symbol} is not in alert range.`
                            : `Discord channel not found for ${symbol}.`
                    );
                }
            }

            const alertSymbols = [...symbolsBelow30, ...symbolsAbove70];
            if (alertSymbols.length > 0) {
                const newsQuery = alertSymbols.join(" OR ");
                const allNews = await fetchNews(newsQuery, 2);
                const tweets = await fetchTweets(newsQuery);

                const generalChannelId = process.env.DISCORD_GENERAL_CHANNEL_ID;
                const generalChannel = discordClient.channels.cache.get(generalChannelId);

                if (generalChannel) {
                    await sendSummaryAlert(generalChannel, symbolsBelow30, symbolsAbove70, allNews, tweets);
                } else {
                    console.error("General Discord channel not found.");
                }
            }
        } catch (err) {
            console.error('Error parsing Python script output:', err);
        }
    });
};

// Schedule RSI checks
setInterval(checkRSI, 20000);

// Discord bot ready event
discordClient.once('ready', () => {
    console.log(`Logged in as ${discordClient.user.tag}!`);
});

// Start Discord bot
discordClient.login(process.env.DISCORD_BOT_TOKEN);
