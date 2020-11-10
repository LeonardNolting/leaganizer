import Syntax from "../../model/syntax.js";
import {Message, TextChannel, User} from "discord.js";
import config from "../../config.js";
import {database} from "../../bot.js";
import {playerById, playerByIgn} from "../../helpers/players.js";
import {PlayerRow} from "../../model/player.js";
import notifications from "../../config/notifications.js";
import api from "../../config/api.js";

export const syntax: Syntax = {
	"ign": {type: "Minecraft in game name", description: "e.g. Munkel_"}
}

const apply = async (user: User, ign: string) => {
	const player: PlayerRow = await playerById(user.id)
	if (player !== null) {
		if (player.verified) throw new Error(config.players.verified_already)
		else throw new Error(config.players.applied_again)
	}

	if ((await playerByIgn(ign)) !== null) throw new Error(config.players.exists_already(ign))

	const hypixel = await api.list.hypixel.call(ign)
	if (!("socialMedia" in hypixel && "links" in hypixel.socialMedia && "DISCORD" in hypixel.socialMedia.links))
		throw new Error(config.players.not_linked)

	const linkedTag = hypixel.socialMedia.links.DISCORD
	if (linkedTag !== user.tag) throw new Error(config.players.wrong_link(linkedTag))

	const mojang = await api.list.mojang.ign.call(ign)

	await database.query("insert into player (id, ign, minecraft_id) values ($1, $2, $3)", [
		user.id,
		ign,
		mojang.id
	])

	await (config.channels.list.admin as TextChannel).send(await config.players.please_verify(user, ign))
	return notifications.success(config.players.applied)
}

export const command = (message: Message, parameters: string[]) => apply(message.author, parameters[0])
export default apply
