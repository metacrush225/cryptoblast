const NewsFetcher = require('./newsFetcher');

class AlertManager {
    constructor(discordClient, newsApiKey, twitterBearerToken) {
        this.discordClient = discordClient;
        this.newsFetcher = new NewsFetcher(newsApiKey, twitterBearerToken);
        this.channelCache = new Map(); // Cache for dynamically created channels
    }

    async sendGraph(symbolsBelow30, symbolsAbove70) {

        const channelName = `RSI`;
        const channel = await this.getOrCreateChannel(channelName);
    
        if (!channel) {
            console.error(`Failed to fetch or create the channel: ${channelName}`);
            return;
        }
    
        console.info(`Sending RSI alerts to channel: ${channelName}`);
    
        // Loop through symbolsBelow30 and send embeds with charts
        for (const { symbol, chart } of symbolsBelow30) {
            const embed = {
                color: 0xff0000, // Red for oversold
                title: `⚠️ Oversold Alert: ${symbol}`,
                description: `The RSI for **${symbol}** is below 30, indicating an oversold condition.`,
                image: {
                    url: `attachment://${symbol}-chart.png`, // Reference the attached chart
                },
                timestamp: new Date(),
                footer: { text: 'RSI Alert System' },
            };
    
            // Send the embed with the chart as an attachment
            await channel.send({
                embeds: [embed],
                files: [{ attachment: chart, name: `${symbol}-chart.png` }], // Attach the chart file
            });
        }
    
        // Loop through symbolsAbove70 and send embeds with charts
        for (const { symbol, chart } of symbolsAbove70) {
            const embed = {
                color: 0x00ff00, // Green for overbought
                title: `⚠️ Overbought Alert: ${symbol}`,
                description: `The RSI for **${symbol}** is above 70, indicating an overbought condition.`,
                image: {
                    url: `attachment://${symbol}-chart.png`, // Reference the attached chart
                },
                timestamp: new Date(),
                footer: { text: 'RSI Alert System' },
            };
    
            // Send the embed with the chart as an attachment
            await channel.send({
                embeds: [embed],
                files: [{ attachment: chart, name: `${symbol}-chart.png` }], // Attach the chart file
            });
        }
    }
    //`⚠️ **${symbol}** is overbought! (RSI > 70)`;

    async getOrCreateChannel(channelName) {
        console.info("getOrCreateChannel reached");
    
        if (this.channelCache.has(channelName)) {
            console.warn(`channelCache already has : ${channelName}`);
            return this.channelCache.get(channelName);
        }
    
        try {
            const guild = this.discordClient.guilds.cache.first(); // Assuming the bot is in one guild
            if (!guild) {
                console.error('Bot is not in any guilds.');
                return null;
            }
    
            // Check if the channel already exists
            let channel = guild.channels.cache.find(
                ch => ch.name === channelName && ch.type === 'GUILD_TEXT'
            );
    
            if (!channel) {
                console.info(`Creating new channel: ${channelName}`);
                channel = await guild.channels.create({
                    name: channelName, // Explicitly set the name
                    type: 0, // Use `0` for a text channel in older Discord.js or `GUILD_TEXT` in newer versions
                    reason: 'RSI alerts',
                });
            } else {
                console.info(`Channel already exists: ${channelName}`);
            }
    
            this.channelCache.set(channelName, channel); // Cache the found or created channel
            return channel;
        } catch (error) {
            console.error(`Error creating or fetching channel ${channelName}:`, error);
            return null;
        }
    }
    
    
    

    // Utility function for clearing messages (unchanged from original)
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
