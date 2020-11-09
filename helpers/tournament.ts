import Tournament, {TournamentRow} from "../model/tournament.js";
import {dateToTimeString} from "./utils.js";
import {ParticipantRow} from "../model/participant.js";
import {database} from "../bot.js";
import config from "../config.js";
import {Message, Snowflake, TextChannel} from "discord.js";
import {TeamRow} from "../model/team.js";
import TournamentState from "../model/tournament_state.js";

export function times(tournament: Tournament): Date[] {
	const start = tournament.start, minutes = start.getMinutes(), times: Date[] = [];
	let date
	for (let i = 0; i < tournament.time_options; i++) {
		date = new Date(start.getTime())
		date.setMinutes(minutes + (i * tournament.time_interval))
		times.push(date)
	}
	return times
}

export const timesFormat = (times: Date[]) => ["", ...times.map(time => dateToTimeString(time))].join("\n- ")

export const getParticipants = (tournamentId: number): Promise<ParticipantRow[]> =>
	database.query("select * from participant where tournament=$1 and quit=to_timestamp(0)", [
		tournamentId
	]).then(result => result.rows)

export const getTeams = (tournamentId: number): Promise<TeamRow[]> =>
	database.query("select * from team where tournament=$1", [
		tournamentId
	]).then(result => result.rows)

export async function prepare(tournament: TournamentRow) {
	let participants = await getParticipants(tournament.id)
	const teams: ParticipantRow[][] = []

	console.log(tournament.team_size, typeof tournament.team_size)
	let team = [], index
	while (
		// Remaining participants won't fit into the last team
	participants.length > (tournament.team_size - team.length) &&
	// Remaining participants not enough to fill another team
	participants.length < (tournament.team_size - (tournament.team_size - team.length))) {
		if (team.length === tournament.team_size) {
			teams.push(team)
			team = []
		}
		index = Math.floor(Math.random() * participants.length)
		team.push(teams[index])
		teams.splice(index, 1)
	}

	for (const [index, team] of teams.entries()) {
		const id = await database.query("insert into team (name, tournament) values ($1) returning id", [
			"Team " + index,
			tournament.id
		]).then(result => Number.parseInt(result.rows[0].id))

		await database.query("insert into winner (match, team) values (null, $1)", [id])

		for (const participant of team)
			await database.query("update participant set team=$1 where player=$2", [id, participant.player])
	}

	// Matchmaking


	await database.query("update tournament set state=$1 where id=$2", [
		TournamentState[TournamentState.Prepared],
		tournament.id
	])

	await updateAnnouncement(tournament)
}

export const updateAnnouncement = async (
	tournament: TournamentRow,
	participants?: ParticipantRow[],
	teams?: TeamRow[],
	announcement?: Message,
): Promise<Snowflake> => {
	const channel = config.channels.list.announcement as TextChannel,
		embed = await config.tournament.announcement.generate(tournament, participants, teams)

	if (tournament.announcement) await (announcement || await channel.messages.fetch(tournament.announcement)).edit(embed)
	else {
		announcement = await channel.send(embed)
		await database.query("update tournament set announcement=$1 where id=$2", [
			announcement.id,
			tournament.id
		])
	}

	return announcement.id
}