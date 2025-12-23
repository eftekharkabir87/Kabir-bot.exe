/**
 * SLOT MACHINE FOR MESSENGER GOAT BOT
 * Author: kabir
 * Description: 50/50 slot machine with jackpot, animation, leaderboard, anti-spam
 */

const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "slotData.json"); // Database file

module.exports = {
  name: "slot",
  description: "🎰 50/50 Slot Machine",
  cooldown: 5,

  async execute(bot, event) {
    const senderID = event.sender.id;
    const icons = ["🍒", "🍋", "🍉", "🍇", "💎", "🔔"];

    // ---- load database ----
    if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, "{}");
    const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

    if (!db[senderID]) db[senderID] = { wins: 0, jackpots: 0, losses: 0, plays: 0 };

    // ---- anti-spam ----
    if (!bot.slotRunning) bot.slotRunning = new Set();
    if (bot.slotRunning.has(senderID)) {
      return bot.sendMessage(senderID, { text: "⏳ Wait! Your previous spin is still running." });
    }
    bot.slotRunning.add(senderID);

    // ---- spin logic 50/50 ----
    const isWin = Math.random() < 0.5;
    const isJackpot = isWin && Math.random() < 0.2;

    const roll = () => icons[Math.floor(Math.random() * icons.length)];
    const finalRolls = [roll(), roll(), roll()];

    if (isWin) {
      if (isJackpot) finalRolls[0] = finalRolls[1] = finalRolls[2];
      else finalRolls[0] = finalRolls[1];
    }

    db[senderID].plays++;
    if (isWin) db[senderID].wins++;
    if (!isWin) db[senderID].losses++;
    if (isJackpot) db[senderID].jackpots++;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    // ---- fake animation ----
    const spinSounds = ["🔊 trrrr", "🔊 trrrr trrrr", "🔊 rrrrrr", "🔊 click"];
    let step = 0;
    const frames = 4;

    const spinAnimation = async () => {
      if (step < frames) {
        step++;
        const display = `${roll()} | ${roll()} | ${roll()}`;
        const text = `${spinSounds[Math.min(step - 1, spinSounds.length - 1)]}\n\n${display}`;
        await bot.sendMessage(senderID, { text });
        setTimeout(spinAnimation, 650);
      } else {
        // ---- final result ----
        let resultText = `${finalRolls.join(" | ")}\n\n`;

        if (isJackpot) resultText += "💥 JACKPOT! BIG WIN! 💎🔥";
        else if (isWin) resultText += "✨ Nice! You Won!";
        else resultText += "❌ You Lost! Try again.";

        resultText += `\n\nPlays: ${db[senderID].plays} | Wins: ${db[senderID].wins} | Losses: ${db[senderID].losses} | Jackpots: ${db[senderID].jackpots}`;

        await bot.sendMessage(senderID, { text: resultText });
        bot.slotRunning.delete(senderID);
      }
    };

    spinAnimation();
  },
};
