import config from "../config.js";
import {Channel, ChannelManager, Guild, GuildManager, Role, RoleManager, Snowflake} from "discord.js";

const replace = <T, M>(what: string, object: {
	get: (id: Snowflake, manager?: M) => T | undefined,
	list: {
		[T: string]: Snowflake | T
	}
}): { [T: string]: T } =>
	Object.entries(object.list).reduce((acc, [name, id]) => {
		const received = object.get((id as Snowflake))
		if (received === undefined) throw new Error(config.doesnt_exist(what, name, id))
		acc[name] = received
		return acc
	}, {})

export default async () => {
	config.guilds.list = replace<Guild, GuildManager>("guild", config.guilds)
	config.roles.list = replace<Role, RoleManager>("role", config.roles)
	config.channels.list = replace<Channel, ChannelManager>("channel", config.channels);

	/*const row = (teams: TeamRow[]) => {
		let columns = ""
		for (const team of teams) columns += `<div><span>${team.name}</span></div>`
		return columns
	}

	const rows = (levels: TeamRow[][]) => {
		const rows: string[] = []
		for (const level of levels) rows.push(row(level))
		rows.join()
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
		${rows}
	</body>
</html>`

	await (config.channels.list.announcement as TextChannel).send(new MessageEmbed()
		.setDescription("test tournament plan")
		.attachFiles([new MessageAttachment((await nodeHtmlToImage({html}) as Buffer), "plan.png")])
		.setImage("attachment://plan.png"))*/

	console.log("logged in")
}