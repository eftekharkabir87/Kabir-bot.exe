const fs = require("fs");
const path = require("path");

const banFile = path.join(__dirname, "../../database/ban.json");

function loadBanData() {
  if (!fs.existsSync(banFile)) {
    fs.writeFileSync(banFile, JSON.stringify({ users: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(banFile));
}

function saveBanData(data) {
  fs.writeFileSync(banFile, JSON.stringify(data, null, 2));
}

module.exports = {
  config: {
    name: "ban",
    aliases: ["unban"],
    version: "1.0",
    author: "Kabir",
    role: 2,
    shortDescription: "Ban / Unban user",
    category: "admin",
    guide: {
      en: "{pn} <uid>"
    }
  },

  onCall: async ({ message, args, commandName }) => {
    const uid = args[0];
    if (!uid) return message.reply("❌ UID দাও\nExample: ban 1000xxxxxxxx");

    const data = loadBanData();

    // BAN
    if (commandName === "ban") {
      if (data.users.includes(uid))
        return message.reply("⚠️ User already banned");

      data.users.push(uid);
      saveBanData(data);
      return message.reply(`🚫 Successfully banned\nUID: ${uid}`);
    }

    // UNBAN
    if (commandName === "unban") {
      if (!data.users.includes(uid))
        return message.reply("⚠️ User is not banned");

      data.users = data.users.filter(id => id !== uid);
      saveBanData(data);
      return message.reply(`✅ Successfully unbanned\nUID: ${uid}`);
    }
  }
};
