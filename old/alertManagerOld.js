// const NewsFetcher = require('../newsFetcher');

// class AlertManager {
//     constructor(discordClient, newsApiKey, twitterBearerToken) {
//         this.discordClient = discordClient;
//         this.newsFetcher = new NewsFetcher(newsApiKey, twitterBearerToken);
//     }

//     async sendTwitterAlert(symbolsBelow30, symbolsAbove70, newsQuery, twitterChannelId) {
//         const tweets = await this.newsFetcher.fetchTweets(newsQuery, 2);
//         const twitterChannel = await this.getChannel(twitterChannelId);

//         if (twitterChannel) {
//             let summaryMessage = "**RSI Alert Summary**\n\n";
//             if (symbolsBelow30.length) summaryMessage += `**Oversold (RSI < 30):** ${symbolsBelow30.join(", ")}\n\n`;
//             if (symbolsAbove70.length) summaryMessage += `**Overbought (RSI > 70):** ${symbolsAbove70.join(", ")}\n\n`;

//             if (tweets.length) {
//                 summaryMessage += "\n**Relevant Tweets:**\n";
//                 tweets.forEach((tweet, index) => {
//                     summaryMessage += `${index + 1}. ${tweet.text} (Posted: ${tweet.created_at})\n`;
//                 });
//             }

//             await twitterChannel.send({ content: summaryMessage });
//         } else {
//             console.error("Twitter channel not found.");
//         }
//     }


//     async sendGraph(symbolsBelow30, symbolsAbove70) {
//         // Utility function to send a message with optional chart to a specific channel using its ID from .env
//         const sendToChannel = async (symbol, message, chart = null) => {
//             const envVariableName = `DISCORD_${symbol}_CHANNEL_ID`;
//             const channelId = process.env[envVariableName];
    
//             if (!channelId) {
//                 console.warn(`Environment variable ${envVariableName} not found.`);
//                 return;
//             }
    
//             const targetChannel = await this.getChannel(channelId);
//             if (targetChannel) {
//                 console.info(`Sending message to channel with ID ${channelId} for symbol ${symbol}`);
    
//                 // If a chart is provided, send it as an attachment
//                 if (chart) {
//                     await targetChannel.send({
//                         content: message,
//                         files: [chart] // Discord supports file attachments here
//                     });
//                 } else {
//                     await targetChannel.send({ content: message });
//                 }
//             } else {
//                 console.warn(`Channel with ID ${channelId} not found.`);
//             }
//         };
    
//         // Send individual messages to symbol-specific channels
//         for (const { symbol, chart } of symbolsBelow30) {
//             const message = `⚠️ **${symbol}** is oversold! (RSI < 30)`;
//             await sendToChannel(symbol, message, chart);
//         }
    
//         for (const { symbol, chart } of symbolsAbove70) {
//             const message = `⚠️ **${symbol}** is overbought! (RSI > 70)`;
//             await sendToChannel(symbol, message, chart);
//         }
//     }
    
    



//     async sendApiNewsAlert(newsQuery, newsChannelId) {
//         const allNews = await this.newsFetcher.fetchNews(newsQuery, 2);
//         const newsChannel = await this.getChannel(newsChannelId);

//         if (newsChannel) {
//             console.info(`Sending to channel ${newsChannelId}`);
//             console.info(`newsQuery = ${newsQuery}`);

//             let summaryMessage = "**RSI Alert Summary**\n\n";

//             if (allNews.length) {
//                 summaryMessage += "**Relevant News Articles:**\n";
//                 allNews.forEach((article, index) => {
//                     summaryMessage += `${index + 1}. [${article.title}](${article.url})\n`;
//                 });
//             }

//             await newsChannel.send({ content: summaryMessage });
//         } else {
//             console.error("News channel not found.");
//         }
//     }


//     // Utility to get channel by name
//     async getChannelByName(channelName) {
//         const channels = await this.client.channels.fetch();
//         const targetChannel = channels.find(channel => channel.name === channelName);
//         return targetChannel;
//     }

//     // Fetch or get Discord channel
//     async getChannel(channelId) {
//         try {
//             return this.discordClient.channels.cache.get(channelId) ||
//                     await this.discordClient.channels.fetch(channelId);
//         } catch (error) {
//             console.error(`Error fetching channel with ID ${channelId}:`, error);
//             return null;
//         }
//     }


//     // Utility functions
//     async clearChannel(channel) {
//         try {
//             let fetched;
//             do {
//                 fetched = await channel.messages.fetch({ limit: 100 });
//                 if (fetched.size > 0) {
//                     await channel.bulkDelete(fetched, true);
//                     console.log(`Deleted ${fetched.size} messages in channel: ${channel.name}`);
//                 }
//             } while (fetched.size > 0);
//         } catch (error) {
//             console.error(`Error clearing messages in channel ${channel.name}:`, error);
//         }
//     }

// }

// module.exports = AlertManager;