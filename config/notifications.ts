import {MessageEmbed} from "discord.js";
import colors from "./colors.js";

export default {
	success: (text: String = "") => new MessageEmbed()
		.setColor(colors.green.main)
		.setDescription("Success! " + text),
	failure: (text: String = "") => new MessageEmbed()
		.setColor(colors.red.main)
		.setDescription("Something went wrong. " + text),
}