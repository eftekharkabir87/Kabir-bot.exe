module.exports = {
  config: {
    name: "slot",
    version: "2.0",
    author: "Nirob+Fahim+kabir",
    countDown: 10,
    role: 0,
    shortDescription: {
      en: "Slot game with bet"
    },
    longDescription: {
      en: "Fruit slot with win, loss and draw system"
    },
    category: "game",
    guide: {
      en: "{p}slot <bet>"
    }
  },

  onStart: async function ({ api, event, args }) {
    const bet = parseInt(args[0]);

    if (!bet || bet <= 0) {
      return api.sendMessage(
        "❗ Please enter a valid bet amount\nExample: !slot 100",
        event.threadID,
        event.messageID
      );
    }

    const fruits = ["🍒", "🍋", "🍉", "🍇", "🍎", "🍓"];
    const pick = () => fruits[Math.floor(Math.random() * fruits.length)];

    const sent = await api.sendMessage(
      `🎰 SLOT MACHINE 🎰\n\nBet: ${bet}\n\n🔄 Spinning...`,
      event.threadID
    );

    let spins = 0;

    const spin = setInterval(() => {
      spins++;

      api.editMessage(
        `🎰 SLOT MACHINE 🎰\n\n${pick()} | ${pick()} | ${pick()}\n\n🔄 Rolling...`,
        sent.messageID
      );

      if (spins >= 5) {
        clearInterval(spin);

        // ===== PROBABILITY SYSTEM =====
        const chance = Math.random() * 100;

        let result;
        let profit = 0;

        if (chance <= 3) {
          // WIN 3%
          result = "🎉 YOU WIN!";
          profit = bet * 2;
        } else if (chance <= 5.5) {
          // LOSS 2%
          result = "❌ YOU LOST!";
          profit = -bet;
        } else if (chance <= 5.7) {
          // DRAW 1%
          result = "⚖️ DRAW!";
          profit = 0;
        } else {
          // DEFAULT LOSS (to keep balance realistic)
          result = "❌ YOU LOST!";
          profit = -bet;
        }

        const f1 = pick();
        const f2 = pick();
        const f3 = pick();

        api.editMessage(
          `🎰 SLOT MACHINE 🎰

${f1} | ${f2} | ${f3}

📊 Result: ${result}
💰 Bet: ${bet}
💸 Outcome: ${profit > 0 ? "+" + profit : profit}`,
          sent.messageID
        );
      }
    }, 700);
  }
};
