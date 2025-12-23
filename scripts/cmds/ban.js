module.exports = {
  name: "ban",
  aliases: ["banish"],
  category: "moderation",
  description: "Ban or Unban a user",
  usage: "ban @user reason | ban unban userID",

  async execute(message, args) {
    // Permission check
    if (!message.member.permissions.has("BanMembers")) {
      return message.reply("❌ তোর Ban permission নাই!");
    }

    if (!message.guild.members.me.permissions.has("BanMembers")) {
      return message.reply("❌ Bot এর Ban permission নাই!");
    }

    // ===== UNBAN PART =====
    if (args[0] === "unban") {
      const userId = args[1];
      if (!userId) {
        return message.reply("❌ User ID দে! (ban unban userID)");
      }

      try {
        await message.guild.members.unban(userId);
        return message.channel.send(
          `♻️ **UNBAN SUCCESS**\n🆔 User ID: ${userId}`
        );
      } catch (err) {
        return message.reply("❌ Invalid User ID অথবা user ban করা নেই!");
      }
    }

    // ===== BAN PART =====
    const member =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]);

    if (!member) {
      return message.reply("❌ Ekta user mention কর বা ID দে!");
    }

    if (member.id === message.author.id) {
      return message.reply("😂 নিজেকে নিজে ban করতে পারবি না!");
    }

    if (member.roles.highest.position >= message.member.roles.highest.position) {
      return message.reply("❌ তোর role এর উপরে role আছে, ban করা যাবে না!");
    }

    if (!member.bannable) {
      return message.reply("❌ এই user কে ban করা যাবে না!");
    }

    const reason = args.slice(1).join(" ") || "No reason provided";

    try {
      await member.ban({ reason });
      message.channel.send(
        `🔨 **BAN SUCCESS**\n👤 User: ${member.user.tag}\n📄 Reason: ${reason}`
      );
    } catch (err) {
      message.reply("❌ User কে ban করা যায়নি!");
    }
  },
};
