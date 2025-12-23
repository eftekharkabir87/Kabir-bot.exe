module.exports = {
  name: "ban",
  aliases: ["banish"],
  category: "moderation",
  description: "Ban or Unban a user",
  usage: "ban @user reason | ban unban userI

const fs = require("fs");
const path = "./banData.json";

// Load ban data
function loadBanData() {
    if (!fs.existsSync(path)) return {};
    try {
        return JSON.parse(fs.readFileSync(path, "utf-8"));
    } catch {
        return {};
    }
}

// Save ban data
function saveBanData(data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 4));
}

// List of admin IDs
const admins = ["1234567890", "0987654321"]; // <-- Add your admin IDs here

module.exports = {
    config: {
        name: "ban",
        aliases: ["unban"],
        description: "Admin-only Ban/Unban command for Goat Bot",
        usage: "!ban <userID> [reason] or !unban <userID>",
        author: "Arijit (Styled by GPT-5)",
    },

    run: async (bot, message, args) => {
        // Check admin
        if (!admins.includes(message.senderID)) {
            return message.reply("❌ You are not authorized to use this command.");
        }

        if (!args[0] || !args[1]) {
            return message.reply("Usage: `!ban <userID> [reason]` or `!unban <userID>`");
        }

        const action = args[0].toLowerCase();
        const userID = args[1];
        const reason = args.slice(2).join(" ") || "No reason provided";

        let banData = loadBanData();

        // Ban
        if (action === "ban") {
            if (banData[userID]) return message.reply(`⚠️ User ${userID} is already banned.`);
            banData[userID] = {
                reason: reason,
                bannedBy: message.senderID,
                bannedAt: new Date().toISOString(),
            };
            saveBanData(banData);
            return message.reply(`✅ User ${userID} has been banned.\nReason: ${reason}`);
        }

        // Unban
        else if (action === "unban") {
            if (!banData[userID]) return message.reply(`⚠️ User ${userID} is not banned.`);
            delete banData[userID];
            saveBanData(banData);
            return message.reply(`✅ User ${userID} has been unbanned.`);
        }

        // Invalid action
        else {
            return message.reply("❌ Invalid action. Use `ban` or `unban`.");
        }
    },
};
