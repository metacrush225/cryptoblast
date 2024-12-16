import requests
import logging
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from datetime import datetime, timezone


class CryptoNewsFetcher:
    """Handles fetching news and Twitter information for cryptocurrencies."""

    def __init__(self):
        # Load API keys from environment variables

        self.news_api_key = os.getenv("NEWS_API_KEY")


    def fetch_crypto_news(self, keyword, max_articles=5):
        """Fetches top news articles about a specific cryptocurrency using NewsAPI."""
        url = "https://newsapi.org/v2/everything"
        today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
        yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime('%Y-%m-%d')

        params = {
            "q": keyword,
            "language": "fr",  # French articles
            "sortBy": "publishedAt",
            "from": yesterday,  # Articles from yesterday onward
            "apiKey": self.news_api_key,
            "pageSize": max_articles
        }
        try:
            response = requests.get(url, params=params)
            logging.info(f"NewsAPI Response... = {response.status_code == 200}");
            if response.status_code == 200:
                logging.info(f"NewsAPI for {keyword}");
                articles = response.json().get("articles", [])
                news = [{"title": article["title"], "url": article["url"]} for article in articles]
                return news
            else:
                logging.error(f"NewsAPI Error for {keyword}: {response.status_code} - {response.text}")
                return []
        except Exception as e:
            logging.error(f"Error fetching news for {keyword}: {e}")
            return []



if __name__ == "__main__":
    analyzer = CryptoNewsFetcher()
    analyzer.fetch_crypto_news(keyword="Bitcoin", max_articles=1)
