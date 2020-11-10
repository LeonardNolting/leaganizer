import Syntax from "../../model/syntax.js";
import {Message, User} from "discord.js";
import config from "../../config.js";
import {database} from "../../bot.js";
import notifications from "../../config/notifications.js";

export const requiresStaff = true
export const syntax: Syntax = {
	"name": {
		type: "Mention",
		description: "Mention the user you want to verify with @."
	},
	"tier": {type: "Tier", description: "e.g. 1"},
}

const verify = async (user: User, tier: number) => {
	if (isNaN(tier)) throw new SyntaxError("tier")
	else if (tier < config.tournament.tiers.min.value) throw new Error(config.tournament.tiers.min.error(tier))
	else if (tier > config.tournament.tiers.max.value) throw new Error(config.tournament.tiers.max.error(tier))

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

export const command = (message: Message, parameters: string[]) => {
	const user = message.mentions.users.first()
	if (parameters[0].length !== config.mentions.munkel.length || message.mentions.users.size !== 1 || user.bot === true)
		throw new SyntaxError("name")
	return verify(user, Number.parseInt(parameters[1]))
}
export default verify