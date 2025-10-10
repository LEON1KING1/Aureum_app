import os
from telegram import Update, MenuButtonWebApp, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes

TOKEN = "8347270277:AAEVAsSjrAZeIGe7v5mUOVhLV3oPmTD8QGM"
WEBAPP_URL = "https://leon1king1.github.io/Aureum_app/index.html"
user_balances = {}

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if user.username not in user_balances:
        user_balances[user.username] = 100
    await context.bot.set_chat_menu_button(
        chat_id=update.effective_chat.id,
        menu_button=MenuButtonWebApp(
            text="🚀 Open Aureum App",
            web_app=WebAppInfo(url=WEBAPP_URL)
        )
    )
    await update.message.reply_text(
        f"✨ Welcome {user.first_name}!\n\n"
        f"💎 Your starting balance: {user_balances[user.username]} AUR\n\n"
        f"👇 Click the 'Open Aureum App' button below to access the web app."
    )

def main():
    print("✅ Aureum Bot is running...")
    print(f"🌐 WebApp URL: {WEBAPP_URL}")
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.run_polling()

if __name__ == "__main__":
    main()
