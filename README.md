---

```markdown
---

<p align="center">
  <img src="webapp/assets/aureum_logo.png" width="160" alt="Aureum Logo">
</p>

<h1 align="center">✨ Aureum App ✨</h1>

<p align="center">
  A modern Telegram WebApp & Bot system for rewards, mining, and referral management.  
  Built using <b>Flask + HTML/CSS/JS</b> — featuring a luxurious dark–gold interface and full backend integration.
</p>

---

## ⚡ Features
- 🪙 **Real-time user balance tracking**
- ⛏️ **Mining button (every 24 hours)**
- 🤝 **Invite & referral rewards system**
- 🎯 **Daily and social tasks with real rewards**
- 🔒 **Airdrop system (locked until activation)**
- 💾 **Automatic user registration & data saving**
- 💎 **Golden modern UI with animation and protection**
- 🔧 **Ready for Replit and GitHub Pages hosting**

---

## 🌐 Live Demo
[🚀 Open the Aureum WebApp](https://leon1king1.github.io/Aureum_app/)  
> (Update this link if your GitHub Pages or Replit URL changes)

---

## 🧱 Project Structure
```

Aureum_App/
│
├── infrastructure/
│   └── main.py              # Flask backend (bot logic, users, tasks, mining, security)
│
├── webapp/
│   ├── index.html           # Main interface
│   ├── style.css            # Design, colors, and animation
│   ├── script.js            # Frontend logic, countdown, wallet linking
│   └── assets/
│       └── aureum_logo.png  # App logo
│
├── requirements.txt         # Dependencies
├── .replit                  # Replit configuration file
└── README.md                # This documentation

````

---

## 🚀 Run Locally

```bash
# 1️⃣ Clone the repository
git clone https://github.com/LEON1KING1/Aureum_App.git
cd Aureum_App/infrastructure

# 2️⃣ Install dependencies
pip install -r ../requirements.txt

# 3️⃣ Run the app
python main.py
````

> Then open **[http://localhost:8080](http://localhost:8080)** in your browser or your Replit link.

---

## ⚙ Environment Variables

Create a `.env` file or add Secrets in
