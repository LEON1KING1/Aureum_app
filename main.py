import os
import json
import time
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
from telegram import Update, WebAppInfo, MenuButtonWebApp
from telegram.ext import Application, CommandHandler, ContextTypes

# ----------------------------
TOKEN = "YOUR_TELEGRAM_BOT_TOKEN"
WEBAPP_URL = "https://leon1king1.github.io/Aureum_app/webapp/index.html"
DATA_FILE = "user_data.json"
# ----------------------------


def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    return {}


def save_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=4)

# ----------------------------
user_data = load_data()

class MyHTTPRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        SimpleHTTPRequestHandler.end_headers(self)

def run_server():
    os.chdir("webapp")
    server = HTTPServer(("0.0.0.0", 5000), MyHTTPRequestHandler)
    print("✅ Local WebApp server running on port 5000...")
    server.serve_forever()


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    uid = str(user.id)

    
    if uid not in user_data:
        user_data[uid] = {
            "username": user.username,
            "balance": 100,
            "wallet": None,
            "last_mine": 0,
            "verified": False,
            "airdrop_claimed": False,
            "referrals": [],
        }
        save_data(user_data)

    await context.bot.set_chat_menu_button(
        chat_id=update.effective_chat.id,
        menu_button=MenuButtonWebApp(
            text="💎 Open Aureum App",
            web_app=WebAppInfo(url=WEBAPP_URL)
        )
    )

    await update.message.reply_text(
        f"👋 Welcome {user.first_name}!\n\n"
        f"💰 Your current balance: {user_data[uid]['balance']} Aureum\n\n"
        f"Click the button below to open Aureum App 👇"
    )

async def mine(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    uid = str(user.id)

    if uid not in user_data:
        await update.message.reply_text("⚠️ Please start first using /start")
        return

    current_time = time.time()
    last_mine = user_data[uid]["last_mine"]

    if current_time - last_mine < 86400:
        remaining = int(86400 - (current_time - last_mine))
        hours = remaining // 3600
        mins = (remaining % 3600) // 60
        await update.message.reply_text(f"⛏️ You can mine again after {hours}h {mins}m.")
        return

    reward = 500
    user_data[uid]["balance"] += reward
    user_data[uid]["last_mine"] = current_time
    save_data(user_data)

    await update.message.reply_text(f"✅ You mined {reward} Aureum successfully!")

# ----------------------------
def main():
    
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("mine", mine))

    print("✅ Aureum Bot is running...")
    print(f"🌐 WebApp URL: {WEBAPP_URL}")
    app.run_polling()

if __name__ == "__main__":
    main()

