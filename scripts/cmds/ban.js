


const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "banData.json");

// Load ban data
function loadData() {
  if (!fs.existsSync(dataPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(dataPath, "utf8"));
  } catch {
    return {};
  }
}

// Save ban data
function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// 🔐 Admin IDs (নিজের UID বসাও)
const ADMINS = [
  "61575161136678",
  "0987654321"
];

module.exports = {
  config: {
    name: "ban",
    aliases: ["unban"],
    version: "1.1",
    author: "Kabir (Styled by GPT-5)",
    countDown: 0,
    role: 2, // admin only
    shortDescription: {
      en: "Admin ban/unban command"
    },
    longDescription: {
      en: "Admin-only command to ban or unban users from using the bot"
    },
    category: "admin",
    guide: {
      en: "{pn} ban <uid> [reason]\n{pn} unban <uid>"
    }
  },

  onStart: async function ({ message, args, event }) {
    // Admin check
    if (!ADMINS.includes(event.senderID)) {
      return message.reply("❌ You are not allowed to use this command.");
    }

    if (!args[0] || !args[1]) {
      return message.reply(
        "❌ Usage:\n• ban <uid> [reason]\n• unban <uid>"
      );
    }

    const action = args[0].toLowerCase();
    const uid = args[1];
    const reason = args.slice(2).join(" ") || "No reason provided";

    const data = loadData();

    // 🔴 BAN
    if (action === "ban") {
      if (data[uid]) {
        return message.reply("⚠️ This user is already banned.");
      }

      data[uid] = {
        reason,
        bannedBy: event.senderID,
        time: new Date().toISOString()
      };

      saveData(data);
      return message.reply(
        `🚫 User Banned Successfully\n\nUID: ${uid}\nReason: ${reason}`
      );
    }

    // 🟢 UNBAN
    if (action === "unban") {
      if (!data[uid]) {
        return message.reply("⚠️ This user is not banned.");
      }

      delete data[uid];
      saveData(data);
      return message.reply(`✅ User Unbanned\n\nUID: ${uid}`);
    }

    return message.reply("❌ Invalid action. Use ban or unban.");
  }
};
