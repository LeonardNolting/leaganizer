import config from "../../config.js"
import {Message} from "discord.js"
import {database} from "../../bot.js"
import Syntax from "../../model/syntax.js"
import {TournamentRow} from "../../model/tournament.js"
import zonedTimeToUtc from "date-fns-tz/zonedTimeToUtc/index.js"
import {times, updateAnnouncement} from "../../helpers/tournament.js";
import {playerById} from "../../helpers/players.js";
import TournamentState from "../../model/tournament_state.js";
import notifications from "../../config/notifications.js";

export const info = "If the tournament "
export const syntax: Syntax = {
	"time": {type: "Time", description: "e.g. 5:00 PM", optional: true},
	"timezone": {type: "IANA Time Zone Name", description: "e.g. America/New_York", optional: true}
}

export default async (message: Message, parameters: string[]) => {
	// Exists? Verified?
	let player = await playerById(message.author.id);
	if (player === null) throw new Error(await config.players.doesnt_exist())
	else if (!player.verified) throw new Error(config.players.not_verified)

	const result = await database.query("select * from tournament where not(state=$1)",
		[TournamentState[TournamentState.Ended]])

	// Open tournament?
	if (result.rows.length === 0)
		throw new Error(config.tournament.no_tournament)
	const tournament: TournamentRow = result.rows[0]

	// Participates already?
	if (await database.query(
		"select count(id) from participant where tournament=$1 and player=$2 and quit=to_timestamp(0)",
		[
			tournament.id,
			message.author.id
		]).then(result => result.rows[0]["count"])
	) throw new Error(config.tournament.participates_already)

	// Preferred start time
	let timeOption = null // Time already chosen -> no preferred time needed
	if (tournament.state === TournamentState.Registered) {
		// Time not yet chosen -> preferred time will be considered
		const time = zonedTimeToUtc(new Date(tournament.start.toLocaleDateString('en-US') + " " + parameters[0]), parameters[1])
		if (isNaN(time.getTime()))
			throw new SyntaxError("time")

		const tournamentTimes = times(tournament)
		if (!tournamentTimes.some(tournamentTime => tournamentTime.getTime() === time.getTime()))
			throw new Error(config.tournament.wrong_time(tournamentTimes))

		timeOption = tournamentTimes.indexOf(time) + 1
	}

	// Create participant
	return await database.query("insert into participant (tournament, player, preferred_time_option) values ($1, $2, $3)", [
		tournament.id,
		message.author.id,
		timeOption
	]).then(async () => {
		await updateAnnouncement(tournament)

		return notifications.success(config.tournament.participated)
	}).catch(e => notifications.failure(config.tournament.participate_failed))
}