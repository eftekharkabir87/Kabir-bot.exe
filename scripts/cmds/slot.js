 module.exports = {
  config: {
    name: "slot",
    version: "2.0",
    author: "Kabir",
    shortDescription: { en: "Play a slot game" },
    longDescription: { en: "Spin the slots and try your luck to win big!" },
    category: "game",
  },

  langs: {
    en: {
      invalid_amount: "Enter a valid amount to bet 🌝.",
      not_enough_money: "You don't have enough money 🌝🤣. Check your balance!",
      spin_message: "Spinning... 🎰\n[ %1$ | %2$ | %3$ ]",
      final_spin_message: "Final Spin! 🎰\n[ %1$ | %2$ | %3$ ]",
      win_message: "You won %1$💗! Your luck is shining today!",
      lose_message: "You lost %1$🥲. Better luck next time!",
      jackpot_message: "JACKPOT!!! 🎉 You won %1$💎! You're unstoppable!",
    },
  },

  onStart: async function ({ args, message, event, usersData, getLang, api }) {
    const { senderID, threadID } = event;
    const userData = await usersData.get(senderID) || { money: 500, data: {} };
    const amount = parseInt(args[0]);

    if (isNaN(amount) || amount <= 0) return message.reply(getLang("invalid_amount"));
    if (amount > userData.money) return message.reply(getLang("not_enough_money"));

    const slots = ["🍒","🍇","🍊","🍉","🍋","🍎","🍓","🍑","🥝"];
    const randomSlot = () => slots[Math.floor(Math.random() * slots.length)];

    // Initial placeholder
    let slot1 = "❓", slot2 = "❓", slot3 = "❓";
    const animationMsg = await message.reply(getLang("spin_message", slot1, slot2, slot3));

    // ---------------- Emoji Reel Spin Animation ----------------
    const spinReels = async () => {
      let finalSlots = [randomSlot(), randomSlot(), randomSlot()];
      let currentSlots = ["💎❓","🌹❓","🦥❓"];

      for (let i = 0; i < 25; i++) { // total frames
        // Reel 1 spins faster, Reel 2 medium, Reel 3 slower
        currentSlots[0] = i < 20 ? slots[Math.floor(Math.random() * slots.length)] : finalSlots[0];
        currentSlots[1] = i < 22 ? slots[Math.floor(Math.random() * slots.length)] : finalSlots[1];
        currentSlots[2] = i < 25 ? slots[Math.floor(Math.random() * slots.length)] : finalSlots[2];

        await new Promise(res => setTimeout(res, 150)); // 150ms per frame

        // Update the same message
        await api.editMessage(
          getLang("spin_message", currentSlots[0], currentSlots[1], currentSlots[2]),
          threadID,
          animationMsg.messageID
        );
      }
      return finalSlots;
    };

    // Run the animation and get final slots
    const [slot1Final, slot2Final, slot3Final] = await spinReels();

    // Show final spin message
    await api.editMessage(
      getLang("final_spin_message", slot1Final, slot2Final, slot3Final),
      threadID,
      animationMsg.messageID
    );

    // ---------------- Calculate Winnings ----------------
    const winnings = calculateWinnings(slot1Final, slot2Final, slot3Final, amount);

    // Update user money safely
    await usersData.set(senderID, {
      money: userData.money + winnings,
      data: userData.data
    });

    // Send final result message
    const finalMessage = getSpinResultMessage(slot1Final, slot2Final, slot3Final, winnings, getLang);
    return message.reply(finalMessage);
  },
};

// ======================= FUNCTIONS =======================

function calculateWinnings(slot1, slot2, slot3, betAmount) {
  if (slot1 === "🍒" && slot2 === "🍒" && slot3 === "🍒") return betAmount * 10;
  if (slot1 === "🍇" && slot2 === "🍇" && slot3 === "🍇") return betAmount * 5;
  if (slot1 === slot2 && slot2 === slot3) return betAmount * 3;
  if (slot1 === slot2 || slot1 === slot3 || slot2 === slot3) return betAmount * 2;
  return -betAmount;
}

function getSpinResultMessage(slot1, slot2, slot3, winnings, getLang) {
  if (winnings > 0) {
    if (slot1 === "🍒" && slot2 === "🍒" && slot3 === "🍒") return getLang("jackpot_message", winnings);
    return getLang("win_message", winnings) + `\n[ ${slot1} | ${slot2} | ${slot3} ]`;
  } else {
    return getLang("lose_message", -winnings) + `\n[ ${slot1} | ${slot2} | ${slot3} ]`;
  }
    }
