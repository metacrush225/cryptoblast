import os
import platform
import requests
import pandas as pd
import matplotlib.dates as mdates
import matplotlib.pyplot as plt
import mplfinance as mpf
from datetime import datetime, timedelta
from dotenv import load_dotenv
import json
import logging
import sys

class CryptoAnalyzer:
    def __init__(self):
        # Load environment variables
        env_path = os.path.join(os.path.dirname(__file__), "../.env")
        load_dotenv(env_path)
        self.symbols = os.getenv("SYMBOLS", "BTCUSDT").split(",")
        self.interval = os.getenv("INTERVAL", "1h")
        self.days = int(os.getenv("DAYS", 14))

        logging.info(f"SYMBOLS: {self.symbols}")
        logging.info(f"DAYS: {self.days}")

    @staticmethod
    def get_img_prefix():
        """Ensures the 'imgs' folder exists."""
        imgs_folder = "imgs"
        if not os.path.exists(imgs_folder):
            os.makedirs(imgs_folder)
            logging.info(f"Created missing folder: {imgs_folder}")
        script_dir = os.path.dirname(os.path.abspath(__file__))

        """Returns the base path for saving images based on the operating system."""
        if platform.system() == "Linux":
            return os.path.join(script_dir, "imgs") + "/"
        elif platform.system() == "Windows":
            return os.path.join(script_dir, "imgs") + "\\"
        else:
            raise Exception(f"Unsupported operating system: {platform.system()}")

    def get_historical_klines(self, symbol, start_date, end_date):
        """Fetch historical data from Binance API."""
        base_url = "https://api.binance.com/api/v3/klines"
        params = {
            "symbol": symbol,
            "interval": self.interval,
            "startTime": int(start_date.timestamp() * 1000),
            "endTime": int(end_date.timestamp() * 1000),
            "limit": 1000
        }
        response = requests.get(base_url, params=params)
        if response.status_code == 200:
            data = response.json()
            if not data:
                logging.warning(f"No data fetched for symbol {symbol}. Skipping.")
                return pd.DataFrame()

            df = pd.DataFrame(data, columns=[
                'time', 'open', 'high', 'low', 'close', 'volume',
                'close_time', 'quote_asset_volume', 'number_of_trades',
                'taker_buy_base_asset_volume', 'taker_buy_quote_asset_volume', 'ignore'
            ])
            df = df[['time', 'open', 'high', 'low', 'close']]
            df['time'] = pd.to_datetime(df['time'], unit='ms').dt.tz_localize('UTC').dt.tz_convert('Europe/Paris')
            df[['open', 'high', 'low', 'close']] = df[['open', 'high', 'low', 'close']].astype(float)
            return df
        else:
            raise Exception(f"Binance API Error: {response.json()}")

    def calculate_rsi(self, data, window=14):
        """Calculate RSI."""
        delta = data['close'].diff()
        gain = delta.where(delta > 0, 0).rolling(window=window).mean()
        loss = -delta.where(delta < 0, 0).rolling(window=window).mean()
        rs = gain / loss
        data['RSI'] = 100 - (100 / (1 + rs))
        return data

    def generate_chart(self, data, symbol):
        """Generate a chart with price and RSI."""
        data['SMA10'] = data['close'].rolling(window=10).mean()
        data['SMA30'] = data['close'].rolling(window=30).mean()

        fig, axs = plt.subplots(2, 1, figsize=(12, 8), sharex=True)
        axs[0].plot(data['time'], data['close'], label='Close Price', color='blue', linewidth=1.5)
        axs[0].plot(data['time'], data['SMA10'], label='SMA 10', color='orange', linestyle='--', linewidth=1.5)
        axs[0].plot(data['time'], data['SMA30'], label='SMA 30', color='green', linestyle='--', linewidth=1.5)
        axs[0].set_title(f"{symbol.upper()} Price Chart")
        axs[0].set_ylabel("Price (USDT)")
        axs[0].grid(True)
        axs[0].legend(loc='upper left')

        axs[1].plot(data['time'], data['RSI'], label='RSI', color='purple', linestyle='--', linewidth=1.5)
        axs[1].axhline(70, color='red', linestyle='--', linewidth=0.8, label='Overbought (70)')
        axs[1].axhline(30, color='green', linestyle='--', linewidth=0.8, label='Oversold (30)')
        axs[1].set_title("Relative Strength Index (RSI)")
        axs[1].set_ylabel("RSI Value")
        axs[1].set_xlabel("Time")
        axs[1].grid(True)
        axs[1].legend(loc='upper left')

        fig.tight_layout()
        plt.gcf().autofmt_xdate()
        axs[0].xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d %H:%M'))
        axs[0].xaxis.set_major_locator(mdates.HourLocator(interval=12))

        chart_file = os.path.join(self.get_img_prefix(), f"{symbol}_chart.png")
        plt.savefig(chart_file)
        plt.close()
        logging.info(f"Chart saved as {chart_file}")
        return chart_file

    def analyse_data(self, data, symbol):
        """Analyse data and return JSON with RSI and chart path."""
        chart_file = self.generate_chart(data, symbol)
        if not data['RSI'].empty:
            latest_rsi = data['RSI'].iloc[-1]
            result = {
                "symbol": symbol,
                "rsi": latest_rsi,
                "chart": chart_file
            }
            print(json.dumps(result))
        else:
            print(json.dumps({"symbol": symbol, "error": "No RSI data available"}))

        
    def fetch_crypto_news(self, keyword, max_articles=5):
        """Fetches top news articles about a specific cryptocurrency using NewsAPI."""
        
        url = "https://newsapi.org/v2/everything"
        # Use UTC for consistency with NewsAPI
        today = datetime.utcnow().strftime('%Y-%m-%d')
        yesterday = (datetime.utcnow() - timedelta(days=1)).strftime('%Y-%m-%d')  # Include yesterday

        params = {
            "q": keyword,  # Search keyword
            "language": "fr",  # French articles
            "sortBy": "publishedAt",
            "from": yesterday,  # Articles from yesterday onward
            "apiKey": os.getenv("NEWSAPI_KEY"),
            "pageSize": max_articles
        }
        try:
            response = requests.get(url, params=params)
            if response.status_code == 200:
                articles = response.json().get("articles", [])
                news = [{"title": article["title"], "url": article["url"]} for article in articles]
                return news
            else:
                logging.error(f"NewsAPI Error for {keyword}: {response.status_code} - {response.text}")
                return []
        except Exception as e:
            logging.error(f"Error fetching news for {keyword}: {e}")
            return []
        
    def load_symbol_keywords(self):
        """Load symbol keywords mapping from environment variables."""
        symbol_keywords = {}
        for symbol in self.symbols:
            keyword = os.getenv(symbol.strip())  # Fetch the keyword from .env
            if keyword:
                symbol_keywords[symbol] = keyword
        return symbol_keywords

    def main(self):
        """Main method to process cryptocurrency data."""
        
        # Charger le mapping des symboles depuis .env
        symbol_keywords = self.load_symbol_keywords()

        end_date = datetime.now()
        start_date = end_date - timedelta(days=self.days)
        logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s", stream=sys.stderr)
        
        results = []
        for symbol in self.symbols:
            try:
                logging.info(f"Processing symbol {symbol}")
                data = self.get_historical_klines(symbol.strip(), start_date, end_date)
                data = self.calculate_rsi(data)
                chart_file = self.generate_chart(data, symbol)

                # Utiliser le mot-clé pertinent pour les actualités
                news_keyword = symbol_keywords.get(symbol, symbol)  # Utilise le mapping ou le symbole par défaut
                news = self.fetch_crypto_news(keyword=news_keyword)

                if not data['RSI'].empty:
                    latest_rsi = data['RSI'].iloc[-1]
                    results.append({
                        "symbol": symbol,
                        "rsi": latest_rsi,
                        "chart": chart_file,
                        "news": news
                    })
                else:
                    results.append({
                        "symbol": symbol,
                        "error": "No RSI data available"
                    })
            except Exception as e:
                logging.error(f"Error processing {symbol}: {e}", exc_info=True)
                results.append({
                    "symbol": symbol,
                    "error": str(e)
                })

        # Only print JSON output to stdout
        print(json.dumps(results))



if __name__ == "__main__":
    analyzer = CryptoAnalyzer()
    analyzer.main()
