import config from "../config.js"
import command from "../command.js"

export default async message => {
	if (message.content.startsWith(config.commands.prefix)) await command(message)
}