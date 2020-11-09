import Syntax from "../../model/syntax.js";
import {Message} from "discord.js";
import config from "../../config.js";
import {database} from "../../bot.js";
import notifications from "../../config/notifications.js";

export const requiresStaff = true
export const syntax: Syntax = {
	"tier": {type: "Tier", description: "e.g. 1"},
	"name": {
		type: "Mention",
		description: "Mention the user you want to verify with @."
	}
}

export default async (message: Message, parameters: string[]) => {
	const tier = Number.parseInt(parameters[0]),
		user = message.mentions.users.first()

	if (isNaN(tier)) throw new SyntaxError("tier")
	else if (tier < config.tournament.tiers.min.value) throw new Error(config.tournament.tiers.min.error(tier))
	else if (tier > config.tournament.tiers.max.value) throw new Error(config.tournament.tiers.max.error(tier))

	if (parameters[1].length !== config.mentions.munkel.length || message.mentions.users.size !== 1 || user.bot === true)
		throw new SyntaxError("name")

	const count = await database.query("select count(id) from player where id=$1", [user.id]).then(result => result.rows[0].count)
	if (count === 0) throw new Error(config.players.hasnt_applied(user)) //* Feature coming soon

	await database.query("UPDATE player SET verified=true, verified_at=$1, tier=$2 WHERE id=$3", [
		new Date(),
		tier,
		user.id
	])

	await user.send(notifications.success(config.players.verified_dm))
	return notifications.success(config.players.verified)
}