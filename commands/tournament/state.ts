import {Message} from "discord.js";
import {database} from "../../bot.js";
import config from "../../config.js";
import TournamentState from "../../model/tournament_state";

export default async (message: Message, parameters: string[]) => {
	const result = await database.query("select state from tournament where not(state=$1)",
		[TournamentState[TournamentState.Ended]])
	return result.rows.length === 0 ? config.tournament.no_tournament : config.tournament.state(result.rows[0].state)
}