const NewsFetcher = require('./newsFetcher');

class AlertManager {
    constructor(discordClient, newsApiKey, twitterBearerToken) {
        this.discordClient = discordClient;
        this.newsFetcher = new NewsFetcher(newsApiKey, twitterBearerToken);
    }

    async sendTwitterAlert(symbolsBelow30, symbolsAbove70, newsQuery, twitterChannelId) {
        const tweets = await this.newsFetcher.fetchTweets(newsQuery, 2);
        const twitterChannel = await this.getChannel(twitterChannelId);

        if (twitterChannel) {
            let summaryMessage = "**RSI Alert Summary**\n\n";
            if (symbolsBelow30.length) summaryMessage += `**Oversold (RSI < 30):** ${symbolsBelow30.join(", ")}\n\n`;
            if (symbolsAbove70.length) summaryMessage += `**Overbought (RSI > 70):** ${symbolsAbove70.join(", ")}\n\n`;

            if (tweets.length) {
                summaryMessage += "\n**Relevant Tweets:**\n";
                tweets.forEach((tweet, index) => {
                    summaryMessage += `${index + 1}. ${tweet.text} (Posted: ${tweet.created_at})\n`;
                });
            }

            await twitterChannel.send({ content: summaryMessage });
        } else {
            console.error("Twitter channel not found.");
        }
    }

    async sendApiNewsAlert(symbolsBelow30, symbolsAbove70, newsQuery, newsChannelId) {
        const allNews = await this.newsFetcher.fetchNews(newsQuery, 2);
        const newsChannel = await this.getChannel(newsChannelId);

        if (newsChannel) {
            console.info(`Sending to channel ${newsChannelId}`);
            console.info(`newsQuery = ${newsQuery}`);

            let summaryMessage = "**RSI Alert Summary**\n\n";
            if (symbolsBelow30.length) summaryMessage += `**Oversold (RSI < 30):** ${symbolsBelow30.join(", ")}\n\n`;
            if (symbolsAbove70.length) summaryMessage += `**Overbought (RSI > 70):** ${symbolsAbove70.join(", ")}\n\n`;

            if (allNews.length) {
                summaryMessage += "**Relevant News Articles:**\n";
                allNews.forEach((article, index) => {
                    summaryMessage += `${index + 1}. [${article.title}](${article.url})\n`;
                });
            }

            await newsChannel.send({ content: summaryMessage });
        } else {
            console.error("News channel not found.");
        }
    }

    // Fetch or get Discord channel
    async getChannel(channelId) {
        try {
            return this.discordClient.channels.cache.get(channelId) ||
                   await this.discordClient.channels.fetch(channelId);
        } catch (error) {
            console.error(`Error fetching channel with ID ${channelId}:`, error);
            return null;
        }
    }

    // Utility functions
    async clearChannel(channel) {
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
    }

}

module.exports = AlertManager;