import {Message, MessageEmbed} from "discord.js";
import credits from "../credits.js";

export default async (message: Message, parameters: string[]) => new MessageEmbed().setDescription(credits.join("\n"))