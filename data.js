const USER_STORAGE_KEY = "aur_users_data";

function getAllUsers() {
    const data = localStorage.getItem(USER_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
}

function saveAllUsers(users) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
}

function getUser(uuid) {
    const users = getAllUsers();
    return users[uuid] || null;
}

function saveUser(uuid, userData) {
    const users = getAllUsers();
    users[uuid] = userData;
    saveAllUsers(users);
}

function createUserIfNotExist(uuid, walletAddress = "", telegramAgeYears = 0) {
    let user = getUser(uuid);
    if (!user) {
        user = {
            wallet: walletAddress,
            balance: 0,
            tasks: {
                subscribe: false,
                follow: false,
                join_channel: false,
                invite: false
            },
            referrals: [],
            joinedAt: Date.now(),
            telegramAgeYears: telegramAgeYears
        };
        saveUser(uuid, user);
    }
    return user;
}
