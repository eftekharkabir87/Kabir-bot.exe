module.exports = {
  config: {
    name: "slot",
    version: "1.4",
    author: "NIROB + Improved Spin",
    shortDescription: {
      en: "Play slot machine game"
    },
    longDescription: {
      en: "Spin the slot machine, watch fruits spin and stop one by one!"
    },
    category: "game"
  },

  langs: {
    en: {
      invalid_amount: "Enter a valid amount to bet 🌝.",
      not_enough_money: "You don't have enough money 🌝🤣. Check your balance!",
      spin_message: "Spinning... 🎰\n[ %1$ | %2$ | %3$ ]",
      final_spin_message: "Final Result 🎰\n[ %1$ | %2$ | %3$ ]",
      win_message: "You won %1$💗! Your luck is shining today!",
      lose_message: "You lost %1$🥲. Better luck next time!",
      jackpot_message: "JACKPOT!!! 🎉 You won %1$💎! You're unstoppable!"
    }
  },

  onStart: async function ({ args, message, event, usersData, getLang, api }) {
    const { senderID, threadID } = event;
    const userData = await usersData.get(senderID);
    const bet = parseInt(args[0]);

    if (isNaN(bet) || bet <= 0)
      return message.reply(getLang("invalid_amount"));

    if (bet > userData.money)
      return message.reply(getLang("not_enough_money"));

    const fruits = ["🍒", "🍇", "🍊", "🍉", "🍋", "🍎", "🍓", "🍑", "🥝"];
    const rand = () => fruits[Math.floor(Math.random() * fruits.length)];

    let f1 = "❓", f2 = "❓", f3 = "❓";

    const spinMsg = await message.reply(
      getLang("spin_message", f1, f2, f3)
    );

    // 🔄 Spin animation
    const spinInterval = setInterval(async () => {
      f1 = rand();
      f2 = rand();
      f3 = rand();

      await api.editMessageText(
        getLang("spin_message", f1, f2, f3),
        threadID,
        spinMsg.messageID
      );
    }, 200);

    // 🛑 Stop first fruit
    setTimeout(() => {
      f1 = rand();
    }, 2000);

    // 🛑 Stop second fruit
    setTimeout(() => {
      f2 = rand();
    }, 2600);

    // 🛑 Stop third fruit + result
    setTimeout(async () => {
      clearInterval(spinInterval);
      f3 = rand();

      await api.editMessageText(
        getLang("final_spin_message", f1, f2, f3),
        threadID,
        spinMsg.messageID
      );

      const winAmount = calculateWinnings(f1, f2, f3, bet);

      await usersData.set(senderID, {
        money: userData.money + winAmount,
        data: userData.data
      });

      const resultText = getSpinResultMessage(
        f1, f2, f3, winAmount, getLang
      );

      message.reply(resultText);
    }, 3200);
  }
};

// ================= FUNCTIONS =================

function calculateWinnings(a, b, c, bet) {
  if (a === "🍒" && b === "🍒" && c === "🍒")
    return bet * 10; // JACKPOT

  if (a === b && b === c)
    return bet * 3;

  if (a === b || a === c || b === c)
    return bet * 2;

  return -bet;
}

function getSpinResultMessage(a, b, c, win, getLang) {
  if (win > 0) {
    if (a === "🍒" && b === "🍒" && c === "🍒")
      return getLang("jackpot_message", win);

    return getLang("win_message", win) + `\n[ ${a} | ${b} | ${c} ]`;
  }

  return getLang("lose_message", Math.abs(win)) + `\n[ ${a} | ${b} | ${c} ]`;
     }
