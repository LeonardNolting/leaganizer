import {capitalize, dateToMonthDayString, dateToTimeString} from "./helpers/utils.js";
import Syntax, {SyntaxProperties} from "./model/syntax.js";
import Tournament, {TournamentRow} from "./model/tournament.js";
import {getParticipants, getTeams, times, timesFormat} from "./helpers/tournament.js";
import {getCommand} from "./command.js";
import {
	Channel,
	ChannelManager,
	FileOptions,
	Guild,
	GuildManager,
	MessageAttachment,
	MessageEmbed,
	Role,
	RoleManager,
	Snowflake,
	User
} from "discord.js";
import {ParticipantRow} from "./model/participant.js";
import {client} from "./bot.js";
import {TeamRow} from "./model/team.js";
import TournamentState from "./model/tournament_state.js";
import nodeHtmlToImage from "node-html-to-image";

if (process.env.NODE_ENV !== "production") (await import("dotenv")).config()

const config: {
	[T: string]: any,
	guilds: {
		get: (id: Snowflake, manager?: GuildManager) => Guild | undefined,
		list: {
			[T: string]: Guild | Snowflake
		}
	},
	channels: {
		get: (id: Snowflake, manager?: ChannelManager) => Channel | undefined,
		list: {
			[T: string]: Channel | Snowflake
		}
	},
	roles: {
		get: (id: Snowflake, manager?: RoleManager) => Role | undefined,
		list: {
			[T: string]: Role | Snowflake
		}
	},
} = {
	env: process.env,
	permissions: {
		requiresStaff: "Sorry, to use this command, you need to be a staff member.",
	},
	prime_numbers: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97],
	commands: {
		processing: "Processing your request...",
		prefix: "~",
		command_separator: " ",
		parameter_separator: ",",
		parameter_map: (parameter: string) => parameter.trim(), //! Do not change without thinking carefully about it.
		parameter_filter: (parameter: string) => parameter !== "",
		flags: {
			prefix: "--",
			get: name => config.commands.flags.prefix + config.commands.flags.list[name],
			list: {
				help: "help"
			}
		},
		possible: (path, list) => "Possible commands" + (path.length !== 0 ? " for " + path.join(" ") : "") + " are:" +
			["", ...Object.keys(list)].join("\n- "),
		syntax: async (path: string[], expectedParameters: Syntax = {}, givenParameters: { [T: string]: string } = {}, short: Boolean = false) => {
			if (expectedParameters === null) expectedParameters = (await getCommand(path)).syntax
			let string = short ? "" : "**Syntax:**\n"
			string += "`~" +
				[...path, ""].join(config.commands.command_separator) +
				Object.keys(expectedParameters)
					.map(expectedParameter =>
						(givenParameters[expectedParameter] ||
							"[" + expectedParameter + "]" +
							(expectedParameters[expectedParameter].optional === true ? "?" : "")))
					.join(config.commands.parameter_separator) + "`"

			if (!short) {
				for (const [name, properties] of Object.entries(expectedParameters))
					string += "\n" + config.commands.syntaxParameter(name, properties)
			}
			return string
		},
		syntaxParameter: (name: string, properties: SyntaxProperties) =>
			"- " + (properties.optional === true ? "*optional* " : "") +
			"__" + name + "__: " + properties.type + " (" + properties.description + ")",
		wrong_amount: (expectedLengthMin: number, expectedLengthMax: number, length: number) => "Wrong number of parameters given. Expected " + (expectedLengthMin === expectedLengthMax ? expectedLengthMin : expectedLengthMin + "-" + expectedLengthMax) + " but got " + length + ". For help add " + config.commands.flags.get("help") + " to the command.",
		parameter_not_parsable: (name: string, expectedParameters: Syntax) => "Parameter " + name + " couldn't be parsed. Syntax: \n" + config.commands.syntaxParameter(name, expectedParameters[name]),
		error: (message: string) => "Something went wrong: " + message + "\nIf you think this behaviour is unwanted, please message a staff member.",
		list: {
			"tournament": {
				"register": {},
				"participate": {},
				"state": {},
			},
			"players": {
				"apply": {},
				"verify": {},
			},
			"help": {},
			"commands": {},
			"credits": {},
		}
	},
	guilds: {
		get: (id: Snowflake, guildManager: GuildManager = client.guilds): Guild | undefined =>
			guildManager.cache.get(id),
		list: {
			main: "772844585751805972"
		}
	},
	mentions: {
		munkel: "<@!344125170937626625>"
	},
	channels: {
		get: (id: Snowflake, channelManager: ChannelManager = client.channels): Channel | undefined =>
			channelManager.cache.get(id),
		list: {
			log: "773554662149586975",
			announcement: "773167535490859028",
			admin: "773554599554449419",
		},
	},
	roles: {
		get: (id: Snowflake, rolesManager: RoleManager = (config.guilds.list.main as Guild).roles): Role | undefined =>
			rolesManager.cache.get(id),
		list: {
			staff: "773881546431528981"
		}
	},
	doesnt_exist: (what: string, name: string, id: Snowflake) =>
		capitalize(what) + " `" + name + "` with id `" + id + "` doesn't exist. Please fix this in the config.",
	tournament: {
		registering: "Registering a new tournament...",
		prepare_days_before_start: 7,
		min_days_to_participate: 2,
		announcement: {
			generate: async (tournament: TournamentRow, participants?: ParticipantRow[], teams?: TeamRow[]): Promise<MessageEmbed> => {
				if (!participants) participants = await getParticipants(tournament.id)
				if (!teams) teams = await getTeams(tournament.id)

				function participantsList (participants: ParticipantRow[], addEmptyElement = false): string {
					let array = participants.map(participant => "<@" + participant.player + ">")
					if (addEmptyElement) array = ["", ...array]
					return array.join("\n") || "No players found."
				}

				const html = `<html>
	<head>
		<style>
			body {
				height: 100%;
				width: 100%;
				display: flex;
				flex-direction: row;
				align-items: center;
				justify-content: center;
			}
		</style>
	</head>
	<body>
		Hello World!<br>This will show a tournament plan.
		<!--{rows}-->
	</body>
</html>`

				const files: FileOptions[] = ["football.png", "trophy.png"]
					.map(name => ({name, attachment: "./assets/images/" + name }))
				files.push(new MessageAttachment(
					(await nodeHtmlToImage({html}) as Buffer), "plan.png"
				))
				const embed: MessageEmbed = new MessageEmbed()
					.setColor(tournament.state)
					.setTitle(config.tournament.announcement.title(tournament))
					.attachFiles(files)
					.setAuthor("State: " + TournamentState[tournament.state].toUpperCase(),
						"attachment://football.png")
					.setThumbnail("attachment://trophy.png")
					.setImage("attachment://plan.png")
					.setDescription(Object.entries({
						date: dateToMonthDayString(tournament.start),
						time: tournament.state === TournamentState.Prepared ?
							dateToTimeString(tournament.start) :
							"Will be chosen " + config.tournament.prepare_days_before_start + " days before the start.",
						"team size": tournament.team_size,
					}).reduce((acc, [key, value]) =>
						acc + "*" + capitalize(key) + "*: " + value + "\n", ""))
					.setTimestamp()
					.setFooter("If you find a mistake on the list, please contact the hosts.")

				// Participate
				if (tournament.state !== TournamentState.Ended) embed.addField(
					"Participate",
					await config.commands.syntax(["tournament", "participate"], null, {}, true) +
					(tournament.state === TournamentState.Registered ?
						"\n*Possible times*:" + timesFormat(times(tournament)) : "")
				)

				// Participants
				if (tournament.state === TournamentState.Registered) embed.addField("Participants", participantsList(participants))
				else {
					const teams_list = teams.map(team => ({
						name: team.name,
						value: participantsList(participants.filter(participant => participant.tournament === team.id)),
						inline: true
					}))
					embed.addFields(teams_list)
					embed.addField("Reserve players", participantsList(participants.filter(participant => participant.team === null)))
				}

				return embed
			},
			title: (tournament: Tournament) => "Tournament " + tournament.start.toLocaleDateString("en-US"),
		},
		team_size: {
			min: {
				value: 2,
				error: (number: number) => "Team size needs to be greater than or equal " + config.tournament.team_size.min.value + "!",
			},
			max: {
				value: 4,
				error: (number: number) => "Team size needs to be smaller than or equal " + config.tournament.team_size.max.value + "!",
			},
		},
		time_options: {
			min: {
				value: 2,
				error: (number: number) => "There need to be at least " + config.tournament.time_options.min.value + " time options."
			},
			max: {
				value: 10,
				error: (number: number) => "There can't be more than " + config.tournament.time_options.max.value + " time options."
			}
		},
		time_interval: {
			min: {
				value: 5,
				error: (number: number) => "There need to be at least " + config.tournament.time_interval.min.value + " minutes between each time option."
			},
			max: {
				value: 240,
				error: (number: number) => "There can't be more than " + config.tournament.time_interval.max.value + " minutes between each time option."
			}
		},
		tiers: {
			min: {
				value: 1,
				error: (number: number) => "Tier needs to be at least " + config.tournament.time_interval.min.value + "."
			},
			max: {
				value: 3,
				error: (number: number) => "Tier can't be more than " + config.tournament.time_interval.max.value + "."
			}
		},
		already_exists_error: "There still is a tournament which has not ended yet.",
		start_in_past: (start: Date) => "The tournament start must not be in the past.",
		no_tournament: "At the moment, there is no tournament which hasn't ended.",
		wrong_time: (times: Date[]) => "Time needs to match one of the following:" + timesFormat(times),
		participates_already: "We already know you want to participate :smile:",
		participated: "You were put on the list. Good luck and have fun!",
		state: (state: string) => "State is: " + state,
		participate_failed: "The database reported an error while putting you on the list."
	},
	players: {
		doesnt_exist: async () => "To use this command, please apply to get verified first. Use this command:\n" +
			await config.commands.syntax(["players", "apply"], null, {}, true),
		verified_already: "Good news! You have already been verified. :grinning:",

		// Similiar
		applied_again: "You have already applied. Please be patient, the hosts will be reminded of unchecked applications.",
		not_verified: "To use this command, you need to be verified. Please be patient, the hosts will be reminded of unchecked applications.",

		exists_already: (ign: string) => "This ign is already used by a player. Please check the name for typos.",
		hasnt_applied: (user: User) => "The player you mentioned hasn't applied for verification. If you want to apply them anyway, please message Munkel_.",
		not_linked: "Please link your discord account on hypixel.",
		wrong_link: (discordTag: string) => "The linked Discord account is not yours. Please make sure you link the correct Discord account and check the minecraft username for typos.",
		please_verify: async (user: User, ign: string) => "User " + user.toString() + " with verified ign " + ign + " asks for verification. To verify, please use this command:\n" +
			await config.commands.syntax(["players", "verify"], null, {"name": user.toString()}, true),
		applied: "The hosts were asked to verify you and set your current tier according to your skill. Usually, this doesn't take longer than one day!",
		verified: "Verified player.",
		verified_dm: "You've been verified and can now participate in tournaments. Have fun!",
	},
	help: () => "*Help:*\nFor a list of commands, type `~commands`.\nThis bot helps with organizing the football league. It is responsible for team management, statistics and more.\nIt is used via commands, which can be nested (for example `~tournament participate`) and take parameters (for example `~tournament participate 23:00, UTC`).\nCommands are separated by space characters, parameters with commas.\nIf you encounter issues with this bot, please message " + config.mentions.munkel + ".",

	database: {
		sql: {},
		types: {
			tournament_state: 9105750
		}
	},
}

export default config