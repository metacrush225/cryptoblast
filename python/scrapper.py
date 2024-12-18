import snscrape.modules.twitter as sntwitter
import pandas as pd

def scrape_tweets(query, limit=100):
    tweets = []
    for tweet in sntwitter.TwitterSearchScraper(query).get_items():
        if len(tweets) >= limit:
            break
        tweets.append({
            "date": tweet.date,
            "content": tweet.content,
            "username": tweet.user.username
        })
    return pd.DataFrame(tweets)

data = scrape_tweets('New crypto project', limit=50)
print(data.head())