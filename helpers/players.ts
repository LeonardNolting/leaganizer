import {database} from "../bot.js";
import {PlayerRow} from "../model/player.js";

const player = (value: string, property: string = "id"): Promise<PlayerRow | null> => database
	.query("select * from player where " + property + "=$1", [value])
	.then(result => result.rows.length === 0 ? null : result.rows[0])

export const playerById = (id: string) => player(id)
export const playerByIgn = (ign: string) => player(ign, "ign")