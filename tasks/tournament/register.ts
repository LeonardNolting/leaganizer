import config from "../../config.js"
import {Message, Snowflake, TextChannel} from "discord.js"
import {database} from "../../bot.js"
import Syntax from "../../model/syntax.js"
import Tournament from "../../model/tournament.js"
import zonedTimeToUtc from "date-fns-tz/zonedTimeToUtc/index.js"
import {playerById} from "../../helpers/players.js";
import {updateAnnouncement} from "../../helpers/tournament.js";
import TournamentState from "../../model/tournament_state.js";
import notifications from "../../config/notifications.js";

export const requiresStaff = true
export const syntax: Syntax = {
	"start": {type: "Datetime", description: "e.g. 2020-12-31 5:00 PM"},
	"timezone": {type: "IANA Time Zone Name", description: "e.g. America/New_York"},
	"time_options": {type: "Number", description: "will add x options for times"},
	"time_interval": {type: "Minutes", description: "will add options for times every x minutes"},
	"team_size": {
		type: "Number",
		description: "[" + config.tournament.team_size.min.value + ", " + config.tournament.team_size.max.value + "]"
	},
}

const register = async (
	userId: Snowflake,
	start: Date,
	time_options: number,
	time_interval: number,
	team_size: number,
) => {
	// Parse parameters
	let tournament: Tournament = {
		start,
		time_options,
		time_interval,
		team_size,
		state: TournamentState.Registered
	}

	// Check start
	if (isNaN(tournament.start.getTime())) throw new SyntaxError("start")
	if (new Date() > tournament.start) throw new Error(config.tournament.start_in_past(tournament.start))

	// Check time options
	if (isNaN(tournament.time_options)) throw new SyntaxError("time_options")
	else if (tournament.time_options < config.tournament.time_options.min.value)
		throw new Error(config.tournament.time_options.min.error(tournament.time_options))
	else if (tournament.time_options > config.tournament.time_options.max.value)
		throw new Error(config.tournament.time_options.max.error(tournament.time_options))

	// Check time interval
	if (isNaN(tournament.time_interval)) throw new SyntaxError("time_interval")
	else if (tournament.time_interval < config.tournament.time_interval.min.value)
		throw new Error(config.tournament.time_interval.min.error(tournament.time_interval))
	else if (tournament.time_interval > config.tournament.time_interval.max.value)
		throw new Error(config.tournament.time_interval.max.error(tournament.time_interval))

	// Check team size
	if (isNaN(tournament.team_size)) throw new SyntaxError("team_size")
	else if (tournament.team_size < config.tournament.team_size.min.value)
		throw new Error(config.tournament.team_size.min.error(tournament.team_size))
	else if (tournament.team_size > config.tournament.team_size.max.value)
		throw new Error(config.tournament.team_size.max.error(tournament.team_size))

	// Open tournament already/still?
	if (await database.query("select count(id) from tournament where not(state=$1)",
		[TournamentState[TournamentState.Ended]])
		.then(result => result.rows[0]["count"]) > 0
	) throw Error(config.tournament.already_exists_error)

	// Exists? Verified?
	const player = await playerById(userId);
	if (player === null) throw new Error(await config.players.doesnt_exist())
	else if (!player.verified) throw new Error(config.players.not_verified)

	// Create message first, to keep a reference in the database
	// const announcement = await (config.channels.list.announcement as TextChannel)
	// 	.send(config.tournament.registering)
	const tournamentRow = await database.query("insert into tournament (start, team_size, state, time_options, time_interval, created_by) values ($1, $2, $3, $4, $5, $6) returning *", [
		tournament.start,
		tournament.team_size,
		TournamentState[tournament.state],
		tournament.time_options,
		tournament.time_interval,
		userId
	]).then(result => result.rows[0])

	await updateAnnouncement(tournamentRow, [], [])

	return notifications.success()
}

export const command = (message: Message, parameters: string[]) => register(
	message.author.id,
	zonedTimeToUtc(new Date(parameters[0]), parameters[1]),
	Number.parseInt(parameters[2]),
	Number.parseInt(parameters[3]),
	Number.parseInt(parameters[4])
)
export default register