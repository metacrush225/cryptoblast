const axios = require('axios');

const fetchNewCoins = async () => {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/list');
        return response.data.slice(-10); // Return the last 10 coins
    } catch (error) {
        console.error('Error fetching new coins:', error);
        return [];
    }
};

module.exports = {
    name: 'lastcrypto',
    description: 'Fetch the last 10 added cryptocurrencies from CoinGecko',
    execute: async (interaction, discordClient, newsChannelId) => {
        await interaction.deferReply(); // Respond immediately to avoid timeouts
        const newCoins = await fetchNewCoins();

        if (newCoins.length === 0) {
            await interaction.editReply('No new coins were found. Please try again later.');
            return;
        }

        const newsChannel = discordClient.channels.cache.get(newsChannelId);
        if (!newsChannel) {
            console.error(`News channel with ID ${newsChannelId} not found.`);
            await interaction.editReply('Error: News channel not found.');
            return;
        }

        // Format and send the new coin list
        const coinList = newCoins
            .map((coin, index) => `${index + 1}. **${coin.name}** (ID: \`${coin.id}\`)`)
            .join('\n');

        const responseMessage = `**Here are the 10 latest added cryptocurrencies:**\n${coinList}`;
        await interaction.editReply('The list of the latest coins has been sent to the news channel.');

        await newsChannel.send(responseMessage);
    },
};