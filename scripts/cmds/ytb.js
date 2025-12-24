const axios = require("axios");
const fs = require("fs");

const baseApiUrl = async () => {
	const base = await axios.get(
		"https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json"
	);
	return base.data.api;
};

module.exports = {
	config: {
		name: "ytb",
		version: "1.1.4",
		aliases: ["youtube"],
		author: "dipto+fixed by kabir",
		countDown: 5,
		role: 0,
		description: {
			en: "Download video, audio, and info from YouTube"
		},
		category: "media"
	},

	onStart: async ({ api, args, event, commandName }) => {
		if (!args[0]) {
			return api.sendMessage("❌ Please use -v / -a / -i", event.threadID, event.messageID);
		}

		const action = args[0].toLowerCase();

		const checkurl =
			/^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})/;

		/* ================= URL DIRECT DOWNLOAD ================= */
		if (args[1] && checkurl.test(args[1])) {
			const match = args[1].match(checkurl);
			const videoID = match ? match[1] : null;

			if (!videoID) {
				return api.sendMessage("❌ Invalid YouTube link.", event.threadID, event.messageID);
			}

			if (action === "-v" || action === "-a") {
				try {
					const format = action === "-a" ? "mp3" : "mp4";
					const path = `ytb_${format}_${videoID}.${format}`;

					const { data } = await axios.get(
						`${await baseApiUrl()}/ytDl3?link=${videoID}&format=${format}&quality=3`
					);

					await api.sendMessage(
						{
							body: `• Title: ${data.title}\n• Quality: ${data.quality}`,
							attachment: await dipto(data.downloadLink, path)
						},
						event.threadID,
						() => fs.unlinkSync(path),
						event.messageID
					);
				} catch (e) {
					console.error(e);
					return api.sendMessage("❌ Download failed.", event.threadID, event.messageID);
				}
			}
			return;
		}

		/* ================= SEARCH FLOW ================= */
		args.shift();
		const keyWord = args.join(" ");
		if (!keyWord) {
			return api.sendMessage("❌ Please enter video name.", event.threadID, event.messageID);
		}

		let result;
		try {
			result = (await axios.get(
				`${await baseApiUrl()}/ytFullSearch?songName=${encodeURIComponent(keyWord)}`
			)).data.slice(0, 6);
		} catch (err) {
			return api.sendMessage("❌ Search error.", event.threadID, event.messageID);
		}

		if (!result.length) {
			return api.sendMessage("⭕ No results found.", event.threadID, event.messageID);
		}

		let msg = "";
		let i = 1;
		const thumbs = [];

		for (const info of result) {
			msg += `${i++}. ${info.title}\n⏱ ${info.time}\n📺 ${info.channel.name}\n\n`;
			thumbs.push(diptoSt(info.thumbnail, "thumb.jpg"));
		}

		api.sendMessage(
			{
				body: msg + "Reply with number",
				attachment: await Promise.all(thumbs)
			},
			event.threadID,
			(err, info) => {
				global.GoatBot.onReply.set(info.messageID, {
					commandName,
					author: event.senderID,
					result,
					action
				});
			},
			event.messageID
		);
	},

	onReply: async ({ event, api, Reply }) => {
		const { result, action } = Reply;
		const choice = parseInt(event.body);

		if (isNaN(choice) || choice < 1 || choice > result.length) {
			return api.sendMessage("❌ Invalid choice.", event.threadID, event.messageID);
		}

		const videoID = result[choice - 1].id;

		try {
			if (["-v", "video", "mp4", "-a", "audio", "mp3", "music"].includes(action)) {
				const format = ["-a", "audio", "mp3", "music"].includes(action) ? "mp3" : "mp4";
				const path = `ytb_${format}_${videoID}.${format}`;

				const { data } = await axios.get(
					`${await baseApiUrl()}/ytDl3?link=${videoID}&format=${format}&quality=3`
				);

				api.unsendMessage(Reply.messageID);

				await api.sendMessage(
					{
						body: `• Title: ${data.title}\n• Quality: ${data.quality}`,
						attachment: await dipto(data.downloadLink, path)
					},
					event.threadID,
					() => fs.unlinkSync(path),
					event.messageID
				);
			}

			if (action === "-i" || action === "info") {
				const { data } = await axios.get(
					`${await baseApiUrl()}/ytfullinfo?videoID=${videoID}`
				);

				api.unsendMessage(Reply.messageID);
				await api.sendMessage(
					{
						body:
							`✨ Title: ${data.title}\n` +
							`⏳ Duration: ${Math.floor(data.duration / 60)} min\n` +
							`👀 Views: ${data.view_count}\n` +
							`👍 Likes: ${data.like_count}\n` +
							`📺 Channel: ${data.channel}`,
						attachment: await diptoSt(data.thumbnail, "info.jpg")
					},
					event.threadID,
					event.messageID
				);
			}
		} catch (e) {
			console.error(e);
			api.sendMessage("❌ Operation failed.", event.threadID, event.messageID);
		}
	}
};

/* ================= HELPERS ================= */
async function dipto(url, pathName) {
	const res = await axios.get(url, { responseType: "arraybuffer" });
	fs.writeFileSync(pathName, res.data);
	return fs.createReadStream(pathName);
}

async function diptoSt(url, pathName) {
	const res = await axios.get(url, { responseType: "stream" });
	res.data.path = pathName;
	return res.data;
	}
