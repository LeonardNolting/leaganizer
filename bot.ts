const config = require("./config"),
	Discord = require("discord.js"),
	client = new Discord.Client()

client.on("message", async msg => {
	if (msg.content.startsWith("~") && msg.content.length > 1) msg.reply("You executed the command " + msg.content.substr(1))
})

client.on("ready", async () => {
	console.log("ready")
})

client.login(config.BOT_TOKEN)