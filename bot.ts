const config = require("./config"),
	Discord = require("discord.js"),
	client = new Discord.Client()

client.on("ready", async () => {
	console.log("ready")
})

client.login(config.BOT_TOKEN)