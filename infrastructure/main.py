from flask import Flask, request, jsonify, send_from_directory, send_file, abort
import os, sqlite3, threading, time, secrets, json
from datetime import datetime, timezone

BASE = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(BASE, "aureum_prod.db")

app = Flask(__name__, static_folder='../webapp', static_url_path='')

def get_conn():
    conn = sqlite3.connect(DB, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

# initialize db and seed tasks
def init_db():
    conn = get_conn(); cur = conn.cursor()
    cur.execute("CREATE TABLE IF NOT EXISTS users (user_id TEXT PRIMARY KEY, username TEXT, wallet TEXT UNIQUE, ref TEXT UNIQUE, ref_by TEXT, ref_count INTEGER DEFAULT 0, balance REAL DEFAULT 0, created_at TEXT, last_claim TEXT)")
    cur.execute("CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, user_id TEXT, type TEXT, amount REAL, note TEXT, time TEXT)")
    cur.execute("CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, title TEXT, desc TEXT, reward REAL)")
    cur.execute("CREATE TABLE IF NOT EXISTS task_done (user_id TEXT, task_id TEXT, time TEXT, PRIMARY KEY(user_id,task_id))")
    cur.execute("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT)")
    conn.commit()
    # seed meta and tasks if empty
    cur.execute("INSERT OR IGNORE INTO meta(key,value) VALUES(?,?)", ("airdrop_status","closed"))
    cur.execute("INSERT OR IGNORE INTO meta(key,value) VALUES(?,?)", ("airdrop_opens_at",""))
    # seed example tasks
    cur.execute("INSERT OR IGNORE INTO tasks(id,title,desc,reward) VALUES(?,?,?,?)", ("t_follow","تابع قناتنا على تيليجرام","اشترك في قناة المشروع على تيليجرام",5))
    cur.execute("INSERT OR IGNORE INTO tasks(id,title,desc,reward) VALUES(?,?,?,?)", ("t_join","انضم للمجتمع","انضم لمجموعة المشروع وشارك",3))
    cur.execute("INSERT OR IGNORE INTO tasks(id,title,desc,reward) VALUES(?,?,?,?)", ("t_visit","زيارة الموقع","قم بزيارة الموقع الرسمي",2))
    conn.commit()
    conn.close()

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def generate_ref():
    return secrets.token_hex(4)

def user_exists(user_id):
    conn = get_conn(); cur = conn.cursor(); cur.execute("SELECT user_id FROM users WHERE user_id=?", (str(user_id),)); res = cur.fetchone(); conn.close(); return res is not None

def wallet_used(wallet):
    if not wallet: return False
    conn = get_conn(); cur = conn.cursor(); cur.execute("SELECT user_id FROM users WHERE wallet=?", (wallet,)); res = cur.fetchone(); conn.close(); return res is not None

def create_user(user_id, username="", wallet="", ref_by=""):
    conn = get_conn(); cur = conn.cursor()
    ref = generate_ref()
    created_at = now_iso()
    cur.execute("INSERT OR IGNORE INTO users(user_id,username,wallet,ref,ref_by,ref_count,balance,created_at) VALUES(?,?,?,?,?,?,?,?)",
                (str(user_id), username, wallet, ref, ref_by, 0, 0.0, created_at))
    # if ref_by provided, increment ref_count and give small reward
    if ref_by:
        cur.execute("UPDATE users SET ref_count = ref_count + 1, balance = balance + 1 WHERE ref = ?", (ref_by,))
    conn.commit()
    cur.execute("SELECT user_id,username,wallet,ref,ref_count,balance,created_at,last_claim FROM users WHERE user_id=?", (str(user_id),))
    row = cur.fetchone(); conn.close()
    if row:
        return dict(row)
    return None

def get_user(user_id):
    conn = get_conn(); cur = conn.cursor(); cur.execute("SELECT user_id,username,wallet,ref,ref_by,ref_count,balance,created_at,last_claim FROM users WHERE user_id=?", (str(user_id),)); r=cur.fetchone()
    if not r: return None
    cur.execute("SELECT id,type,amount,note,time FROM transactions WHERE user_id=? ORDER BY time DESC LIMIT 200", (str(user_id),))
    txs = [dict(x) for x in cur.fetchall()]
    conn.close(); u = dict(r); u["transactions"] = txs; return u

def add_tx(user_id, ttype, amount, note=""):
    conn = get_conn(); cur = conn.cursor(); tid = secrets.token_hex(8); ttime = now_iso()
    cur.execute("INSERT INTO transactions(id,user_id,type,amount,note,time) VALUES(?,?,?,?,?,?)", (tid, str(user_id), ttype, float(amount), note, ttime))
    if ttype == "credit": cur.execute("UPDATE users SET balance = balance + ? WHERE user_id=?", (float(amount), str(user_id)))
    else: cur.execute("UPDATE users SET balance = balance - ? WHERE user_id=?", (float(amount), str(user_id)))
    conn.commit(); conn.close(); return tid

@app.route('/status', methods=['GET'])
def status():
    conn = get_conn(); cur = conn.cursor(); cur.execute("SELECT value FROM meta WHERE key='airdrop_status'"); r=cur.fetchone(); status = r[0] if r else 'closed'
    cur.execute("SELECT value FROM meta WHERE key='airdrop_opens_at'"); r2=cur.fetchone(); opens = r2[0] if r2 else ''
    conn.close(); return jsonify({"ok":True,"status":status,"opens_at":opens})

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json(force=True, silent=True) or {}
    telegram_id = data.get("telegram_id") or data.get("user_id")
    username = data.get("username","")
    wallet = data.get("wallet","")
    ref = data.get("ref","") or request.args.get("ref","")
    if not telegram_id:
        return jsonify({"ok":False,"error":"missing_telegram_id"}),400
    if user_exists(telegram_id):
        u = get_user(telegram_id); return jsonify({"ok":True,"user":u})
    if wallet and wallet_used(wallet):
        return jsonify({"ok":False,"error":"wallet_already_used"}),400
    u = create_user(telegram_id, username, wallet, ref)
    return jsonify({"ok":True,"user":u})

@app.route('/user/<user_id>', methods=['GET'])
def user_get(user_id):
    u = get_user(user_id)
    if not u: return jsonify({"ok":False,"error":"not_found"}),404
    return jsonify({"ok":True,"user":u})

@app.route('/claim', methods=['POST'])
def claim():
    data = request.get_json(force=True, silent=True) or {}
    user_id = data.get("user_id"); amount = float(data.get("amount",0) or 0)
    if not user_id: return jsonify({"ok":False,"error":"missing_user_id"}),400
    conn = get_conn(); cur = conn.cursor(); cur.execute("SELECT value FROM meta WHERE key='airdrop_status'"); r=cur.fetchone(); status = r[0] if r else 'closed'
    if status != 'open': return jsonify({"ok":False,"error":"airdrop_closed"}),403
    u = get_user(user_id)
    if not u: return jsonify({"ok":False,"error":"not_found"}),404
    last = u.get("last_claim")
    if last:
        try:
            last_dt = datetime.fromisoformat(last); diff = datetime.now(timezone.utc)-last_dt
            if diff.total_seconds() < 24*3600: return jsonify({"ok":False,"error":"claim_too_soon"}),400
        except: pass
    add_tx(user_id, "credit", amount, note="airdrop_claim"); conn = get_conn(); cur = conn.cursor(); cur.execute("UPDATE users SET last_claim=? WHERE user_id=?", (now_iso(), str(user_id))); conn.commit(); conn.close()
    u2 = get_user(user_id); return jsonify({"ok":True,"balance":u2.get("balance",0)})

@app.route('/tasks', methods=['GET'])
def tasks_list():
    conn = get_conn(); cur = conn.cursor(); cur.execute("SELECT id,title,desc,reward FROM tasks"); tasks = [dict(x) for x in cur.fetchall()]; conn.close(); return jsonify({"ok":True,"tasks":tasks})

@app.route('/task/complete', methods=['POST'])
def task_complete():
    data = request.get_json(force=True, silent=True) or {}
    user_id = data.get("user_id"); task_id = data.get("task_id")
    if not user_id or not task_id: return jsonify({"ok":False,"error":"missing_fields"}),400
    conn = get_conn(); cur = conn.cursor(); cur.execute("SELECT 1 FROM task_done WHERE user_id=? AND task_id=?", (str(user_id), task_id))
    if cur.fetchone(): conn.close(); return jsonify({"ok":False,"error":"already_done"}),400
    cur.execute("INSERT INTO task_done(user_id,task_id,time) VALUES(?,?,?)", (str(user_id), task_id, now_iso()))
    # reward from tasks table
    cur.execute("SELECT reward FROM tasks WHERE id=?", (task_id,)); r=cur.fetchone(); reward = float(r[0]) if r else 0
    if reward>0:
        cur.execute("UPDATE users SET balance = balance + ? WHERE user_id=?", (reward, str(user_id)))
        tid = secrets.token_hex(8); ttime = now_iso(); cur.execute("INSERT INTO transactions(id,user_id,type,amount,note,time) VALUES(?,?,?,?,?,?)", (tid, str(user_id), "credit", reward, f"task:{task_id}", ttime))
    conn.commit(); conn.close()
    u = get_user(user_id); return jsonify({"ok":True,"balance":u.get("balance",0)})

@app.route('/admin/export', methods=['GET'])
def admin_export():
    key = request.args.get("key",""); admin_key = os.getenv("ADMIN_KEY","")
    if not admin_key or key != admin_key: return "Forbidden",403
    conn = get_conn(); cur = conn.cursor(); cur.execute("SELECT user_id,username,wallet,ref,ref_by,ref_count,balance,created_at,last_claim FROM users"); users = [dict(x) for x in cur.fetchall()]
    cur.execute("SELECT id,user_id,type,amount,note,time FROM transactions"); txs = [dict(x) for x in cur.fetchall()]; conn.close(); return jsonify({"ok":True,"users":users,"transactions":txs})

# serve webapp static
@app.route('/webapp/<path:path>')
def static_files(path): return send_from_directory(os.path.join(BASE,'../webapp'), path)

def keep_alive():
    url = os.getenv("WEB_APP_URL",""); 
    if not url: return
    import requests
    def run():
        while True:
            try:
                requests.get(url, timeout=10)
            except: pass
            time.sleep(300)
    t = threading.Thread(target=run, daemon=True); t.start()

if __name__ == '__main__':
    init_db()
    keep_alive()
    port = int(os.getenv("PORT","8080"))
    app.run(host='0.0.0.0', port=port)
