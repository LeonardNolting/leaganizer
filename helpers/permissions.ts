import {PlayerRow} from "../model/player.js";
import {GuildMember, Role, Snowflake} from "discord.js";
import config from "../config.js";

export const isVerified = (player: PlayerRow | null | undefined) => player ? player.verified : false
export const hasApplied = (player: PlayerRow | null | undefined) => !!player
export const hasRole = (member: GuildMember, roleId: Snowflake) => member.roles.cache.has(roleId)
export const isStaff = (member: GuildMember) => hasRole(member, (config.roles.list.staff as Role).id)