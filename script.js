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
  const box = document.getElementById("ai-message");
  if (box) box.innerText = message;
}

/* ===============================
   AI ENGINE
================================ */
const AIEngine = {
  analyzeUser(user) {
    if (user.points >= 1500) return "elite";
    if (user.referrals >= 5) return "influencer";
    if (user.visits >= 5) return "active";
    return "new_user";
  },

  decideAction(user) {
    const role = this.analyzeUser(user);
    user.role = role;

    const actions = {
      elite: { reward: 100, message: "Elite user detected" },
      influencer: { reward: 60, message: "Influencer detected" },
      active: { reward: 30, message: "Active user detected" },
      new_user: { reward: 15, message: "Welcome new user" }
    };

    return actions[role];
  },

  learn(user, action) {
    user.history.push({
      time: Date.now(),
      role: user.role,
      reward: action.reward
    });

    if (user.history.length > 50) {
      user.history.shift();
    }
  }
};

/* ===============================
   LEADERBOARD LOGIC
================================ */
function getRank(user) {
  if (user.points >= 2000) return "Top 1%";
  if (user.points >= 1000) return "Top 10%";
  if (user.points >= 500) return "Top 30%";
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
  const bonus = user.role === "influencer" ? 60 : 30;
  user.referrals++;
  user.points += bonus;

  UserState.save(user);
  updateUI();
}

/* ===============================
   BOT READY EVENTS
================================ */
function onBotEvent(eventType) {
  if (eventType === "daily_login") {
    onUserVisit();
  }

  if (eventType === "referral_success") {
    addReferral();
  }
}

/* ===============================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", () => {
  onUserVisit();
});
