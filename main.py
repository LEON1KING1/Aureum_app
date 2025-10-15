from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os, json, re, time

app = Flask(__name__, static_folder='../webapp', static_url_path='')
CORS(app)

DB = 'users.json'
if not os.path.exists(DB):
    with open(DB,'w') as f:
        json.dump({}, f)

def load_db():
    try:
        with open(DB,'r') as f:
            return json.load(f)
    except Exception as e:
        print('load error', e)
        return {}

def save_db(d):
    try:
        with open(DB,'w') as f:
            json.dump(d,f,indent=2)
        return True
    except Exception as e:
        print('save error', e)
        return False

def sanitize_uid(uid):
    if not isinstance(uid,str): return None
    uid = uid.strip()
    if re.match(r'^[A-Za-z0-9_@\-]{1,64}$', uid):
        return uid
    return None

@app.route('/api/user/<uid>', methods=['GET','POST'])
def user(uid):
    uid_s = sanitize_uid(uid)
    if not uid_s:
        return jsonify({'ok':False,'error':'Invalid id'}),400
    db = load_db()
    if request.method == 'POST':
        info = request.get_json(silent=True)
        if not isinstance(info, dict):
            return jsonify({'ok':False,'error':'JSON object required'}),400
        allowed = {'balance','wallet','lastMine','tasks','invite_count'}
        clean = {k: info[k] for k in info if k in allowed}
        rec = db.get(uid_s, {})
        rec.update(clean)
        db[uid_s] = rec
        if save_db(db): return jsonify({'ok':True,'data':rec})
        return jsonify({'ok':False,'error':'save failed'}),500
    return jsonify(db.get(uid_s, {'balance':0,'invite_count':0}))

@app.route('/webapp/<path:p>')
def webapp_files(p):
    return send_from_directory(os.path.join(os.getcwd(),'webapp'), p)

@app.route('/')
def root():
    return jsonify({'status':'Aureum backend active','time':int(time.time())})

if __name__ == '__main__':
    port = int(os.environ.get('PORT','8080'))
    app.run(host='0.0.0.0', port=port)
