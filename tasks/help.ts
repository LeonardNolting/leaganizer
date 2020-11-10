import {Message} from "discord.js";
import config from "../config.js";

const help = () => config.help()
export const command = async (message: Message, parameters: string[]) => help()

export default help