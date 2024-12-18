const axios = require('axios');
const { TwitterApi } = require('twitter-api-v2');

// NewsFetcher Class
class NewsFetcher {
    constructor(newsApiKey, twitterBearerToken) {
        this.newsApiKey = newsApiKey;
        this.twitterClient = new TwitterApi(twitterBearerToken);
    }

    // Fetch news articles
    async fetchNews(query, maxArticles = 2) {
        const url = "https://newsapi.org/v2/everything";
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        try {
            const response = await axios.get(url, {
                params: {
                    q: query,
                    sortBy: "publishedAt",
                    from: yesterday,
                    to: today,
                    apiKey: this.newsApiKey,
                    pageSize: maxArticles,
                },
            });

            if (response.status === 200) {
                console.info(`[newsFetcher.js] Response.status === ${response.status}`)
                console.info('[newsFetcher.js] Full API Response:', response.data);
                return response.data.articles.map(article => ({
                    title: article.title,
                    url: article.url,
                }));
            } else {
                console.error(`[newsFetcher.js] NewsAPI error: ${response.status}`);
                return [];
            }
        } catch (error) {
            console.error('[newsFetcher.js] Error fetching news:', error);
            return [];
        }
    }

    // Fetch tweets
    async fetchTweets(query, maxTweets = 2) {
        try {
            const response = await this.twitterClient.v2.search(query, {
                "tweet.fields": "created_at",
                max_results: maxTweets,
            });
            return response.data || [];
        } catch (error) {
            console.error('Error fetching tweets:', error);
            return [];
        }
    }
}

module.exports = NewsFetcher;