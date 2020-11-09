import config from "../config.js";
import colors from "../config/colors.js";

enum TournamentState {
	Registered = colors.blue.light,
	Prepared = colors.yellow.main,
	Started = colors.green.main,
	Ended = colors.grey.main
}

export default TournamentState