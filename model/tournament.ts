import TournamentState from "./tournament_state";
import {Snowflake} from "discord.js";

export default interface Tournament {
	start: Date
	time_options: number
	time_interval: number
	team_size: number
	state: TournamentState
}

export interface TournamentRow extends Tournament {
	announcement: Snowflake
	id: number
	chosen_time_option: number | null
}