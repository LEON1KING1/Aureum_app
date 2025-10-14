from flask import Flask, jsonify, request
from flask_cors import CORS
import os, json

app = Flask(__name__)
CORS(app)

DB = 'users.json'
if not os.path.exists(DB):
    with open(DB, 'w') as f: json.dump({}, f)

def load_db():
    with open(DB, 'r') as f: return json.load(f)

def save_db(data):
    with open(DB, 'w') as f: json.dump(data, f, indent=2)

@app.route('/api/user/<uid>', methods=['GET','POST'])
def user(uid):
    data = load_db()
    if request.method == 'POST':
        info = request.json or {}
        data[uid] = info
        save_db(data)
        return jsonify({'ok': True, 'data': info})
    return jsonify(data.get(uid, {'balance': 0, 'invites': 0}))

@app.route('/')
def home():
    return jsonify({'status':'Aureum backend active'})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080)
