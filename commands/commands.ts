import {Message} from "discord.js";
import config from "../config.js";

export default async (message: Message, parameters: string[]) =>
	config.commands.possible([], config.commands.list)