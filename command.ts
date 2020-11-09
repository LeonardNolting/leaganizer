import {Message, MessageEmbed} from "discord.js";
import config from "./config.js";
import Syntax from "./model/syntax.js";
import {isStaff} from "./helpers/permissions.js";

export const getCommand = async (path: string[]) => await import("./commands/" + path.join("/") + ".js")

export default async function command(message: Message): Promise<void> {
	const feedback = await message.channel.send(config.commands.processing)

	let rest = message.content.substr(1).trimStart(),
		path = [],
		list = config.commands.list,
		command

	do {
		let index = rest.indexOf(config.commands.command_separator);
		if (index == -1) {
			command = rest
			rest = ""
		} else {
			command = rest.substring(0, index)
			rest = rest.substring(index + config.commands.command_separator.length)
		}

		if (list[command] === undefined) {
			await feedback.edit(config.commands.possible(path, list))
			return
		}

		path.push(command)
		list = list[command]
	} while (Object.keys(list).length !== 0)

	const parameters = rest
			.split(config.commands.parameter_separator)
			.map(parameter => config.commands.parameter_map(parameter))
			.filter(parameter => config.commands.parameter_filter(parameter)), script = await getCommand(path),
		requiresStaff = script.requiresStaff === undefined ? false : script.requiresStaff,
		expectedParameters: Syntax = script.syntax || {},
		expectedParametersMin = Object.keys(expectedParameters).filter(name => expectedParameters[name].optional !== true).length,
		expectedParametersMax = Object.keys(expectedParameters).length,
		automatic_parameter_length_check = script.automatic_parameter_length_check === undefined ? true : script.automatic_parameter_length_check

	if (requiresStaff && !isStaff(message.member)) await feedback.edit(config.permissions.requiresStaff)
	else if (parameters.length == 1 && parameters[0] === config.commands.flags.get("help"))
		await feedback.edit(await config.commands.syntax(path, expectedParameters))
	else if (
		automatic_parameter_length_check &&
		(parameters.length > expectedParametersMax || parameters.length < expectedParametersMin)
	) await feedback.edit(config.commands.wrong_amount(expectedParametersMin, expectedParametersMax, parameters.length))
	else try {
			const reply = await script.default(message, parameters)
			if (reply instanceof MessageEmbed) await feedback.edit("", reply)
			else await feedback.edit(reply)
		} catch (e) {
			if (e instanceof SyntaxError)
				await feedback.edit(config.commands.parameter_not_parsable(e.message, expectedParameters))
			else await feedback.edit(config.commands.error(e.message))
			throw e
		}
}