import pg from "pg"
import TournamentState from "../../model/tournament_state.js";
import config from "../../config.js";
import {capitalize} from "../../helpers/utils.js";

// Temporarily in ../database.ts
/*pg.types.setTypeParser(config.database.types.tournament_state, (value: string) => {
	console.log(value)
	return TournamentState[capitalize(value)];
})*/
