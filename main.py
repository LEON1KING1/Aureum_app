import os
import json
import time
import threading
from flask import Flask, send_from_directory
from telegram import Update, MenuButtonWebApp, WebAppInfo
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

# Security: BOT token must be provided via environment variable (Replit Secrets).
TOKEN = os.getenv("BOT_TOKEN")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://leon1king1.github.io/Aureum_app/")

DB_FILE = "db.json"
MINING_REWARD = 500
COOLDOWN = 24 * 3600  # 24 hours

def load_db():
    if not os.path.exists(DB_FILE):
        return {}
    with open(DB_FILE, "r") as f:
        try:
            return json.load(f)
        except Exception:
            return {}

def save_db(db):
    with open(DB_FILE, "w") as f:
        json.dump(db, f, indent=2)

db = load_db()

def ensure_user(user):
    username = user.username or f"id{user.id}"
    if username not in db:
        db[username] = {
            "tg_id": user.id,
            "first_name": user.first_name or "",
            "created_at": int(time.time()),
            "balance": 0,
            "wallet": None,
            "last_mine": 0,
            "tasks_done": [],
            "invite_count": 0,
            "referrer": None,
            "airdrops_received": False
        }
        save_db(db)
    return username, db[username]

def signup_bonus_by_age(rec):
    age_days = (int(time.time()) - rec.get("created_at", int(time.time()))) // 86400
    if age_days < 7:
        return 1000
    if age_days < 30:
        return 700
    if age_days < 365:
        return 500
    return 300

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    username, rec = ensure_user(user)
    try:
        await context.bot.set_chat_menu_button(
            chat_id=update.effective_chat.id,
            menu_button=MenuButtonWebApp(text="Open Aureum App", web_app=WebAppInfo(url=WEBAPP_URL))
        )
    except Exception:
        pass
    if rec.get("balance", 0) == 0:
        bonus = signup_bonus_by_age(rec)
        rec["balance"] += bonus
        save_db(db)
    await update.message.reply_text(
        f"Welcome {user.first_name}!\nBalance: {rec.get('balance',0)} AUR\nOpen the Aureum App from the menu."
    )

async def info(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Aureum Bot backend is running.")

async def leaderboard_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    arr = [(u, r.get("balance", 0)) for u, r in db.items()]
    arr.sort(key=lambda x: x[1], reverse=True)
    lines = ["Top holders:"]
    for i, (u, b) in enumerate(arr[:20], start=1):
        lines.append(f"{i}. {u} — {b} AUR")
    await update.message.reply_text("\n".join(lines))

async def handle_messages(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message = update.message
    if not message:
        return
    wad = getattr(message, "web_app_data", None)
    if not wad:
        return
    try:
        payload = json.loads(wad.data)
    except Exception:
        await message.reply_text("Invalid payload.")
        return
    user = update.effective_user
    username, rec = ensure_user(user)
    action = payload.get("action")

    if action == "connect_wallet":
        wallet = payload.get("wallet", "").strip()
        if not wallet:
            await message.reply_text("No wallet provided.")
            return
        if len(wallet) < 8 or len(wallet) > 200:
            await message.reply_text("Invalid wallet address.")
            return
        rec["wallet"] = wallet
        if not rec.get("airdrops_received", False):
            bonus = signup_bonus_by_age(rec)
            rec["balance"] += bonus
            rec["airdrops_received"] = True
        save_db(db)
        await message.reply_text(f"Wallet saved: `{wallet}`", parse_mode="Markdown")
        return

    if action == "mine":
        now = int(time.time())
        last = rec.get("last_mine", 0)
        if now - last < COOLDOWN:
            remaining = COOLDOWN - (now - last)
            hrs = remaining // 3600
            mins = (remaining % 3600) // 60
            await message.reply_text(f"Mining cooldown — try again in {hrs}h {mins}m.")
            return
        if not rec.get("wallet"):
            await message.reply_text("Please connect your wallet first.")
            return
        rec["balance"] = rec.get("balance", 0) + MINING_REWARD
        rec["last_mine"] = now
        save_db(db)
        await message.reply_text(f"⛏ You mined {MINING_REWARD} AUR! New balance: {rec['balance']} AUR")
        return

    if action == "task":
        task_id = payload.get("task_id")
        rewards = {"subscribe": 700, "follow": 1200, "join_channel": 1000, "add_tag": 500, "invite5": 500}
        reward = rewards.get(task_id, 0)
        if reward == 0:
            await message.reply_text("Unknown task.")
            return
        if task_id in rec.get("tasks_done", []):
            await message.reply_text("Task already completed.")
            return
        rec.setdefault("tasks_done", []).append(task_id)
        rec["balance"] = rec.get("balance", 0) + reward
        save_db(db)
        await message.reply_text(f"Task '{task_id}' rewarded +{reward} AUR. Balance: {rec['balance']} AUR")
        return

    if action == "invite":
        ref = payload.get("ref")
        if ref and not rec.get("referrer"):
            rec["referrer"] = ref
            ref_rec = db.get(ref)
            if ref_rec:
                ref_rec["invite_count"] = ref_rec.get("invite_count", 0) + 1
                ref_rec["balance"] = ref_rec.get("balance", 0) + 100
                rec["balance"] = rec.get("balance", 0) + 100
                save_db(db)
                await message.reply_text("Invite connected — both received 100 AUR!")
                return
        await message.reply_text("Invite processed.")
        return

    await message.reply_text("Unknown action.")

def run_flask():
    app = Flask(__name__, static_folder="webapp", static_url_path="")
    @app.route("/")
    def index():
        return send_from_directory("webapp", "index.html")
    @app.route("/<path:path>")
    def static_files(path):
        return send_from_directory("webapp", path)
    port = int(os.getenv("PORT", "5000"))
    print("Starting Flask on port", port)
    app.run(host="0.0.0.0", port=port)

def main():
    if not TOKEN:
        print("ERROR: BOT_TOKEN environment variable not set. Please add it in Replit Secrets.")
        return
    t = threading.Thread(target=run_flask, daemon=True)
    t.start()
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("info", info))
    app.add_handler(CommandHandler("leaderboard", leaderboard_cmd))
    app.add_handler(MessageHandler(filters.ALL, handle_messages))
    print("Aureum Bot started. WEBAPP_URL =", WEBAPP_URL)
    app.run_polling()

if __name__ == "__main__":
    main()
