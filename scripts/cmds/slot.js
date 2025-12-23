const cooldowns = new Map();

module.exports = {
  config: {
    name: "slot",
    version: "4.1",
    author: "kabir (Styled by GPT-5)",
    countDown: 12,
    shortDescription: {
      en: "🎰 Stylish Slot Machine",
    },
    longDescription: {
      en: "Spin the slot machine and test your luck with a fresh stylish design ✨",
    },
    category: "game",
  },

  langs: {
    en: {
      invalid_amount: "⚠️ | Please enter a **valid bet amount** 💵",
      not_enough_money: "💸 | Insufficient balance! Please check your wallet.",
      max_limit: "🚫 | The **maximum bet** allowed is `100M`.",
      limit_reached: "🕒 | You’ve reached your slot limit. Try again in **%1** ⏳",
      jackpot_message: 
        "🎉✨ 𝗝𝗔𝗖𝗞𝗣𝗢𝗧 ✨🎉\n" +
        "💖 You hit **3x ❤** and won `$%1`!\n\n" +
        "🎰 Result: [ %2 | %3 | %4 ]\n" +
        "💎 Enjoy your lucky moment!",

      win_message: 
        "🥳 𝗪𝗜𝗡𝗡𝗘𝗥 🥳\n" +
        "💰 You won `$%1`!\n\n" +
        "🎰 Result: [ %2 | %3 | %4 ]\n" +
        "🌟 Keep spinning, luck is on your side!",

      lose_message: 
        "😿 𝗟𝗢𝗦𝗘𝗥 😿\n" +
        "❌ You lost `$%1`...\n\n" +
        "🎰 Result: [ %2 | %3 | %4 ]\n" +
        "💡 Tip: Maybe next spin brings fortune ✨",

      spinning: "🎰 Spinning... %1",
    },
  },

  onStart: async function ({ args, message, event, usersData, getLang }) {
    const { senderID } = event;
    const amount = parseInt(args[0]);

    const now = Date.now();
    const limit = 20;
    const interval = 60 * 60 * 1000;

    if (!cooldowns.has(senderID)) cooldowns.set(senderID, []);
    const timestamps = cooldowns.get(senderID).filter(ts => now - ts < interval);

    if (timestamps.length >= limit) {
      const nextUse = new Date(Math.min(...timestamps) + interval);
      const diff = nextUse - now;
      const hours = Math.floor(diff / (60 * 60 * 1000));
      const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
      return message.reply(getLang("limit_reached", `${hours}h ${minutes}m`));
    }

    if (isNaN(amount) || amount <= 0) return message.reply(getLang("invalid_amount"));
    if (amount > 100000000) return message.reply(getLang("max_limit"));

    const userData = await usersData.get(senderID);
    if (amount > userData.money) return message.reply(getLang("not_enough_money"));

    // --- Spin Animation & Fake Sound ---
    const spinSymbols = ["💚", "💛", "💙", "💜", "🤎", "🤍", "❤"];
    const spinMessage = await message.reply(getLang("spinning", "🎵🔔"));

    for (let i = 0; i < 6; i++) { // 6 animation frames
      const frame = [
        spinSymbols[Math.floor(Math.random() * spinSymbols.length)],
        spinSymbols[Math.floor(Math.random() * spinSymbols.length)],
        spinSymbols[Math.floor(Math.random() * spinSymbols.length)]
      ];
      await delay(500); // half-second per frame
      await message.edit(spinMessage.messageID, getLang("spinning", frame.join(" | ")));
    }

    const result = generateResult();
    const winnings = calculateWinnings(result, amount);

    await usersData.set(senderID, {
      money: userData.money + winnings,
      data: userData.data,
    });

    cooldowns.set(senderID, [...timestamps, now]);
    return message.edit(spinMessage.messageID, formatResult(result, winnings, getLang));
  }
};

// --- Helper Functions ---

function generateResult() {
  const slots = ["💚", "💛", "💙", "💜", "🤎", "🤍", "❤"];
  const r = Math.random() * 100;

  if (r < 5) return ["❤", "❤", "❤"]; // Jackpot
  if (r < 20) {
    const symbol = slots.filter(e => e !== "❤")[Math.floor(Math.random() * 6)];
    return [symbol, symbol, symbol]; // 5x
  }
  if (r < 65) {
    const s = slots[Math.floor(Math.random() * slots.length)];
    const r2 = slots[Math.floor(Math.random() * slots.length)];
    return [s, s, r2]; // 3x
  }
  while (true) {
    const [a, b, c] = [randomEmoji(slots), randomEmoji(slots), randomEmoji(slots)];
    if (!(a === b && b === c)) return [a, b, c]; // Loss
  }
}

function calculateWinnings([a, b, c], bet) {
  if (a === b && b === c) {
    if (a === "❤") return bet * 10;
    return bet * 5;
  }
  if (a === b || b === c || a === c) return bet * 3;
  return -bet;
}

function formatResult([a, b, c], winnings, getLang) {
  const formatted = formatMoney(Math.abs(winnings));
  if (a === b && b === c && a === "❤")
    return getLang("jackpot_message", formatted, a, b, c);
  if (winnings > 0)
    return getLang("win_message", formatted, a, b, c);
  return getLang("lose_message", formatted, a, b, c);
}

function randomEmoji(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatMoney(amount) {
  if (amount >= 1e12) return (amount / 1e12).toFixed(2) + "T";
  if (amount >= 1e9) return (amount / 1e9).toFixed(2) + "B";
  if (amount >= 1e6) return (amount / 1e6).toFixed(2) + "M";
  if (amount >= 1e3) return (amount / 1e3).toFixed(2) + "K";
  return amount.toString();
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
            }
