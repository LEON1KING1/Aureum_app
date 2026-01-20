/* ===============================
   USER STATE
================================ */
const UserState = {
  load() {
    return JSON.parse(localStorage.getItem("aureum_user")) || {
      id: null,
      points: 0,
      referrals: 0,
      visits: 0,
      role: "new_user",
      history: []
    };
  },

  save(user) {
    localStorage.setItem("aureum_user", JSON.stringify(user));
  }
};

let user = UserState.load();

/* ===============================
   UI FUNCTIONS
================================ */
function updateUI() {
  document.getElementById("points")?.innerText = user.points;
  document.getElementById("referrals")?.innerText = user.referrals;
  document.getElementById("role")?.innerText = user.role;
  document.getElementById("rank")?.innerText = getRank(user);
}

function showMessage(message) {
  const el = document.getElementById("ai-message");
  if (el) el.innerText = message;
}

/* ===============================
   AI ENGINE
================================ */
const AIEngine = {
  analyzeUser(user) {
    if (user.points >= 2000) return "elite";
    if (user.referrals >= 5) return "influencer";
    if (user.visits >= 5) return "active";
    return "new_user";
  },

  decideAction(user) {
    const role = this.analyzeUser(user);
    user.role = role;

    const actions = {
      elite: { reward: 120, message: "Elite user status confirmed" },
      influencer: { reward: 70, message: "Influencer behavior detected" },
      active: { reward: 40, message: "Active user engagement detected" },
      new_user: { reward: 20, message: "Welcome to Aureum" }
    };

    return actions[role];
  },

  learn(user, action) {
    user.history.push({
      timestamp: Date.now(),
      role: user.role,
      reward: action.reward
    });

    if (user.history.length > 100) {
      user.history.shift();
    }
  }
};

/* ===============================
   LEADERBOARD LOGIC
================================ */
function getRank(user) {
  if (user.points >= 3000) return "Top 1%";
  if (user.points >= 1500) return "Top 10%";
  if (user.points >= 700) return "Top 30%";
  return "Rising";
}

/* ===============================
   CORE LOGIC
================================ */
function onUserVisit() {
  user.visits++;

  const action = AIEngine.decideAction(user);
  user.points += action.reward;

  AIEngine.learn(user, action);

  showMessage(action.message);
  UserState.save(user);
  updateUI();
}

function addReferral() {
  const bonus = user.role === "influencer" || user.role === "elite" ? 60 : 30;
  user.referrals++;
  user.points += bonus;

  UserState.save(user);
  updateUI();
}

/* ===============================
   BOT READY EVENTS
================================ */
function onBotEvent(event) {
  if (event === "daily_login") onUserVisit();
  if (event === "referral_success") addReferral();
}

/* ===============================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", () => {
  onUserVisit();
});
