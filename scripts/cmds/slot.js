const { EmbedBuilder } = require("discord.js");
const fs = require("fs");

const dbPath = "./slotData.json";

module.exports = {
  name: "slot",
  aliases: ["spin"],
  description: "🎰 50/50 Slot Machine",
  cooldown: 5,

  async execute(message) {
    const icons = ["🍒", "🍋", "🍉", "🍇", "💎", "🔔"];

    // ---- load db ----
    if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, "{}");
    const db = JSON.parse(fs.readFileSync(dbPath));

    if (!db[message.author.id]) {
      db[message.author.id] = {
        wins: 0,
        jackpots: 0,
        losses: 0,
        plays: 0
      };
    }

    // ---- anti spam ----
    if (!message.client.slotRunning) message.client.slotRunning = new Set();
    if (message.client.slotRunning.has(message.author.id)) return;
    message.client.slotRunning.add(message.author.id);

    // ---- spin logic 50/50 ----
    const isWin = Math.random() < 0.5; // 50% chance
    const isJackpot = isWin && Math.random() < 0.2; // 20% of wins = jackpot

    const roll = () => icons[Math.floor(Math.random() * icons.length)];
    const finalRolls = [roll(), roll(), roll()];

    if (isWin) {
      if (isJackpot) {
        finalRolls[0] = finalRolls[1] = finalRolls[2]; // all same for jackpot
      } else {
        // 2 same for almost win
        finalRolls[0] = finalRolls[1];
      }
    }

    db[message.author.id].plays++;
    if (isWin) db[message.author.id].wins++;
    if (!isWin) db[message.author.id].losses++;
    if (isJackpot) db[message.author.id].jackpots++;

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    // ---- embed + animation ----
    const spinSounds = [
      "🔊 *trrrr*",
      "🔊 *trrrr trrrr*",
      "🔊 *rrrrrr*",
      "🔊 *click*"
    ];

    const baseEmbed = new EmbedBuilder()
      .setAuthor({
        name: "🎰 SLOT MACHINE",
        iconURL: message.author.displayAvatarURL({ dynamic: true })
      })
      .setColor("#5865F2")
      .setDescription("🔊 *starting...*\n\n`⏳ | ⏳ | ⏳`")
      .setFooter({ text: "Spinning..." });

    const slotMsg = await message.reply({ embeds: [baseEmbed] });

    let step = 0;
    const frames = 4;

    const interval = setInterval(() => {
      step++;
      const sound = spinSounds[Math.min(step - 1, spinSounds.length - 1)];
      const display = `\`${roll()} | ${roll()} | ${roll()}\``;

      const animEmbed = EmbedBuilder.from(baseEmbed)
        .setDescription(`${sound}\n\n${display}`)
        .setColor(step % 2 === 0 ? "#00ffee" : "#ff00ff");

      slotMsg.edit({ embeds: [animEmbed] });

      if (step >= frames) {
        clearInterval(interval);

        let resultText = `\`${finalRolls.join(" | ")}\`\n\n`;
        let color = "#ff5555";

        if (isJackpot) {
          resultText += "💥 **JACKPOT! BIG WIN!** 💎🔥\n🔔 *DING DING DING!*";
          color = "#00ff99";
        } else if (isWin) {
          resultText += "✨ **Nice! You Won!**";
          color = "#ffaa00";
        } else {
          resultText += "❌ **You Lost! Try again.**";
        }

        const finalEmbed = new EmbedBuilder()
          .setAuthor({
            name: "🎰 SLOT RESULT",
            iconURL: message.author.displayAvatarURL({ dynamic: true })
          })
          .setDescription(resultText)
          .setColor(color)
          .setFooter({
            text: `Plays: ${db[message.author.id].plays} | Wins: ${db[message.author.id].wins} | Losses: ${db[message.author.id].losses} | Jackpots: ${db[message.author.id].jackpots}`
          });

        slotMsg.edit({ embeds: [finalEmbed] });
        message.client.slotRunning.delete(message.author.id);
      }
    }, 650);
  }
};
