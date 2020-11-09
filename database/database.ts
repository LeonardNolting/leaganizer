import pg from "pg";
import config from "../config.js";
import TournamentState from "../model/tournament_state.js";
import {capitalize} from "../helpers/utils.js";

export namespace Database {
	export async function connect() {
		pg.types.setTypeParser(config.database.types.tournament_state, (value: string) => TournamentState[capitalize(value)])

		const database = new pg.Client({
			connectionString: config.env.DATABASE_URL,
			ssl: {
				rejectUnauthorized: false
			}
		})

		await database.connect()

		return database
	}
}