const cooldowns = new Map();
const fs = require("fs");

module.exports = {
  config: {
    name: "slot",
    version: "5.2",
    author: "Kabir (Messenger Premium)",
    shortDescription: "🎰 Premium Slot Machine for Messenger",
    longDescription: "Spin the slot machine with dynamic fake animation ✨",
    category: "game",
  },

  langs: {
    en: {
      invalid_amount: "⚠️ Please enter a valid bet amount 💵",
      not_enough_money: "💸 You don't have enough balance!",
      max_limit: "🚫 Max bet is 200M",
      limit_reached: "🕒 Slot limit reached. Retry in %1",
      jackpot_message: "🎉 JACKPOT 🎉\nYou hit 3x ❤ and won $%1!\n[ %2 | %3 | %4 ]",
      win_message: "🥳 WINNER 🥳\nYou won $%1!\n[ %2 | %3 | %4 ]",
      lose_message: "😿 LOSER 😿\nYou lost $%1\n[ %2 | %3 | %4 ]",
      spinning_message: "⏳ Spinning the reels..."
    }
  },

  onStart: async function({ args, event, usersData, getLang, sendMessage, isPremium }) {
    const senderID = event.senderID;
    let amount = parseInt(args[0]);

    // Validate amount
    if (isNaN(amount) || amount <= 0) return sendMessage(senderID, getLang("invalid_amount"));
    if (amount > 100000000) return sendMessage(senderID, getLang("max_limit"));

    const userData = await usersData.get(senderID);
    if (amount > userData.money) return sendMessage(senderID, getLang("not_enough_money"));

    // Cooldown
    const now = Date.now();
    const limit = isPremium ? 50 : 20;
    const interval = 60 * 60 * 1000;
    if (!cooldowns.has(senderID)) cooldowns.set(senderID, []);
    const timestamps = cooldowns.get(senderID).filter(ts => now - ts < interval);
    if (timestamps.length >= limit) {
      const nextUse = new Date(Math.min(...timestamps) + interval);
      const diff = nextUse - now;
      const hours = Math.floor(diff / (60 * 60 * 1000));
      const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
      return sendMessage(senderID, getLang("limit_reached", `${hours}h ${minutes}m`));
    }
    cooldowns.set(senderID, [...timestamps, now]);

    const finalResult = generateResult(isPremium);
    const winnings = calculateWinnings(finalResult, amount, isPremium);

    // Update balance
    await usersData.set(senderID, {
      money: userData.money + winnings,
      data: userData.data
    });

    // Fake Spin Animation (Messenger-friendly)
    const slots = ["💚","💛","💙","💜","🤎","🤍","❤"];
    let spinReels = [];
    for (let i=0;i<3;i++) spinReels.push(slots[Math.floor(Math.random()*slots.length)]);

    // Send spinning message first
    let spinMessageID = await sendMessage(senderID, getLang("spinning_message"));

    // Animate 8 cycles
    for (let spinCount=0; spinCount<8; spinCount++){
      spinReels = spinReels.map(()=>slots[Math.floor(Math.random()*slots.length)]);
      await new Promise(res => setTimeout(res, 300)); // 0.3s delay
      await sendMessage(senderID, `[ ${spinReels.join(" | ")} ]`);
    }

    // Final result
    if (finalResult[0] === finalResult[1] && finalResult[1] === finalResult[2] && finalResult[0]==="❤")
      await sendMessage(senderID, getLang("jackpot_message", formatMoney(Math.abs(winnings)), ...finalResult));
    else if (winnings>0)
      await sendMessage(senderID, getLang("win_message", formatMoney(Math.abs(winnings)), ...finalResult));
    else
      await sendMessage(senderID, getLang("lose_message", formatMoney(Math.abs(winnings)), ...finalResult));

  }
};

// Functions
function generateResult(isPremium){
  const slots = ["💚","💛","💙","💜","🤎","🤍","❤"];
  const r = Math.random()*100;
  if (r < (isPremium?10:5)) return ["❤","❤","❤"];
  if (r < (isPremium?25:20)){
    const symbol = slots.filter(e=>e!=="❤")[Math.floor(Math.random()*6)];
    return [symbol,symbol,symbol];
  }
  if (r<65){
    const s = slots[Math.floor(Math.random()*slots.length)];
    const r2 = slots[Math.floor(Math.random()*slots.length)];
    return [s,s,r2];
  }
  while(true){
    const [a,b,c] = [randomEmoji(slots),randomEmoji(slots),randomEmoji(slots)];
    if(!(a===b && b===c)) return [a,b,c];
  }
}

function calculateWinnings([a,b,c],bet,isPremium){
  const multiplier = isPremium?1.5:1;
  if(a===b && b===c){
    if(a==="❤") return bet*10*multiplier;
    return bet*5*multiplier;
  }
  if(a===b || b===c || a===c) return bet*3*multiplier;
  return -bet;
}

function randomEmoji(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function formatMoney(amount){
  if(amount>=1e12) return (amount/1e12).toFixed(2)+"T";
  if(amount>=1e9) return (amount/1e9).toFixed(2)+"B";
  if(amount>=1e6) return (amount/1e6).toFixed(2)+"M";
  if(amount>=1e3) return (amount/1e3).toFixed(2)+"K";
  return amount.toString();
}
