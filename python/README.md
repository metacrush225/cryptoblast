# cryptozap

Vous devez mettre les différents parametres dans le fichier .env afin que le script fonctionne...
Ensuite taper la commande suivante :

py main.py

# création du fichier .env à mettre à la racine

EMAILS=toto@mail.fr
SYMBOLS=BTCUSDT,XRPUSDT
INTERVAL=1h
DAYS=7
DAYS_CANDLE=3

EMAIL_HOST=""
EMAIL_APP_PASSWORD=""

# création virtual environment

python -m venv myenv
.\myenv\Scripts\activate
