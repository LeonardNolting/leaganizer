import {Client} from "discord.js"
import config from "./config.js"
import {Database} from "./database/database.js"
import boot from "./events/login.js";
import message from "./events/message.js"
import ready from "./events/ready.js"

export const client = new Client()
export const database = await Database.connect()

client.on("ready", ready)

await client.login(config.env.BOT_TOKEN).then()

// Awful fix for the client sometimes not being ready, despite awaiting the login
await new Promise(resolve => setTimeout(resolve, 1000))

await boot()

client.on("message", message)