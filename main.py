import os
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
from telegram import Update, MenuButtonWebApp, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes


TOKEN = "8347270277:AAEVAsSjrAZeIGe7v5mUOVhLV3oPmTD8QGM"


REPLIT_DOMAIN = os.getenv("REPLIT_DEV_DOMAIN", "")


WEBAPP_URL = f"https://{REPLIT_DOMAIN}/index.html" if REPLIT_DOMAIN else "http://localhost:5000/index.html"


user_balances = {}



class MyHTTPRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        SimpleHTTPRequestHandler.end_headers(self)


def run_server():
    os.chdir('webapp')
    server = HTTPServer(('0.0.0.0', 5000), MyHTTPRequestHandler)
    print("✅ WebApp server running on port 5000...")
    server.serve_forever()



async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if user.username not in user_balances:
        user_balances[user.username] = 100

    
    await context.bot.set_chat_menu_button(
        chat_id=update.effective_chat.id,
        menu_button=MenuButtonWebApp(text="Open Aureum App", web_app=WebAppInfo(url=WEBAPP_URL))
    )

    await update.message.reply_text(
        f"✨ Welcome {user.first_name}!\n\n"
        f"Your starting balance: {user_balances[user.username]} Aureum 💎\n\n"
        f"Click the 'Open' button below to access the Aureum App! 👇"
    )



def main():
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))

    print("✅ Aureum Bot is running...")
    print(f"🌍 WebApp URL: {WEBAPP_URL}")
    app.run_polling()


if __name__ == "__main__":
    main()
