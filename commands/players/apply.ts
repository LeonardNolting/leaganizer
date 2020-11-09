import Syntax from "../../model/syntax.js";
import {Message, TextChannel} from "discord.js";
import config from "../../config.js";
import {database} from "../../bot.js";
import {playerById, playerByIgn} from "../../helpers/players.js";
import {PlayerRow} from "../../model/player.js";
import notifications from "../../config/notifications.js";

export const syntax: Syntax = {
	"ign": {type: "Minecraft in game name", description: "e.g. Munkel_"}
}

export default async (message: Message, parameters: string[]) => {
	const player: PlayerRow = await playerById(message.author.id)
	if (player !== null) {
		if (player.verified) throw new Error(config.players.verified_already)
		else throw new Error(config.players.applied_again)
	}

	const ign = parameters[0]
	if ((await playerByIgn(ign)) !== null) throw new Error(config.players.exists_already(ign))

	const hypixel = await config.api.list.hypixel.call(ign)
	if (!("socialMedia" in hypixel && "links" in hypixel.socialMedia && "DISCORD" in hypixel.socialMedia.links))
		throw new Error(config.players.not_linked)

	const tag = hypixel.socialMedia.links.DISCORD
	if (tag !== message.author.tag) throw new Error(config.players.wrong_link(tag))

	const mojang = await config.api.list.mojang.ign.call(ign)

	await database.query("insert into player (id, ign, minecraft_id) values ($1, $2, $3)", [
		message.author.id,
		ign,
		mojang.id
	])

	await (config.channels.list.admin as TextChannel).send(await config.players.please_verify(message.author, ign))
	return notifications.success(config.players.applied)
}