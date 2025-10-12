from flask import Flask, request, jsonify
import time
import json
import os

app = Flask(__name__)

# Fake in-memory user data (replace later with a database)
users = {}

# Constants
DAILY_MINING_REWARD = 500
AIR_DROP_REWARD = 150_000_000
REFERRAL_REWARD = 100
COOLDOWN_TIME = 86400  # 24 hours in seconds

@app.route('/')
def index():
    return "Aureum Bot Backend Running ✅"

@app.route('/connect_wallet', methods=['POST'])
def connect_wallet():
    data = request.json
    user_id = data.get("user_id")
    wallet_address = data.get("wallet_address")

    if not user_id or not wallet_address:
        return jsonify({"status": "error", "message": "Missing user_id or wallet_address"})

    if user_id not in users:
        users[user_id] = {
            "wallet": wallet_address,
            "balance": 0,
            "last_mine": 0,
            "invites": 0,
            "joined": time.time(),
            "airdrop": True
        }
        # Give Airdrop on first join
        users[user_id]["balance"] += AIR_DROP_REWARD

    return jsonify({"status": "success", "message": "Wallet connected successfully!"})

@app.route('/mine', methods=['POST'])
def mine():
    data = request.json
    user_id = data.get("user_id")

    if not user_id or user_id not in users:
        return jsonify({"status": "error", "message": "User not found"})

    current_time = time.time()
    last_mine = users[user_id].get("last_mine", 0)

    if current_time - last_mine < COOLDOWN_TIME:
        remaining = int(COOLDOWN_TIME - (current_time - last_mine))
        return jsonify({
            "status": "cooldown",
            "message": f"Wait {remaining // 3600} hours and {(remaining % 3600) // 60} minutes before mining again."
        })

    users[user_id]["balance"] += DAILY_MINING_REWARD
    users[user_id]["last_mine"] = current_time

    return jsonify({
        "status": "success",
        "message": f"You mined {DAILY_MINING_REWARD} AUR successfully!"
    })

@app.route('/invite', methods=['POST'])
def invite():
    data = request.json
    inviter_id = data.get("inviter_id")
    new_user_id = data.get("new_user_id")

    if not inviter_id or not new_user_id:
        return jsonify({"status": "error", "message": "Missing inviter_id or new_user_id"})

    if inviter_id not in users:
        return jsonify({"status": "error", "message": "Inviter not found"})

    users[inviter_id]["invites"] += 1
    users[inviter_id]["balance"] += REFERRAL_REWARD

    # Reward the new user slightly too
    if new_user_id not in users:
        users[new_user_id] = {
            "wallet": None,
            "balance": REFERRAL_REWARD // 2,
            "last_mine": 0,
            "invites": 0,
            "joined": time.time(),
            "airdrop": False
        }

    return jsonify({"status": "success", "message": "Referral reward added!"})

@app.route('/wallet', methods=['GET'])
def wallet():
    user_id = request.args.get("user_id")

    if not user_id or user_id not in users:
        return jsonify({"status": "error", "message": "User not found"})

    data = users[user_id]
    return jsonify({
        "status": "success",
        "wallet": data.get("wallet"),
        "balance": data.get("balance"),
        "invites": data.get("invites"),
        "joined": time.ctime(data.get("joined")),
        "airdrop_received": data.get("airdrop")
    })

@app.route('/verify_action', methods=['POST'])
def verify_action():
    data = request.json
    user_id = data.get("user_id")
    action_type = data.get("action_type")

    if not user_id or user_id not in users:
        return jsonify({"status": "error", "message": "User not found"})

    reward_map = {
        "follow_twitter": 50,
        "join_channel": 25,
        "promo_task": 200
    }

    if action_type not in reward_map:
        return jsonify({"status": "error", "message": "Invalid task"})

    users[user_id]["balance"] += reward_map[action_type]
    return jsonify({"status": "success", "message": f"Task '{action_type}' completed, +{reward_map[action_type]} AUR!"})


@app.route('/data', methods=['GET'])
def get_all_data():
    """ Debug route (for testing only) """
    return jsonify(users)


if __name__ == '__main__':
    PORT = int(os.environ.get("PORT", 5000))
    print(f"Starting Flask on port {PORT}")
    print("Aureum Bot backend running...")
    app.run(host='0.0.0.0', port=PORT)
