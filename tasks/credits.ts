import {Message, MessageEmbed} from "discord.js";
import creditsList from "../credits.js";

const credits = () => new MessageEmbed().setDescription(creditsList.join("\n"))
export const command = async (message: Message, parameters: string[]) => credits()

export default credits