import {Message} from "discord.js";
import config from "../config.js";

const commands = () => config.commands.possible([], config.commands.list)
export const command = (message: Message, parameters: string[]) => commands()

export default commands