import config from "../config.js";
import fetch from "node-fetch"

const api = {
	fail: (name: string) => "The request to " + name + " failed. Please try again later. If this keeps happening, please message Munkel.",
	list: {
		hypixel: {
			fail: () => api.fail("hypixel"),
			call: async (ign: string) =>
				await fetch("https://api.hypixel.net/player?key=" + config.env.HYPIXEL_API_KEY + "&name=" + encodeURI(ign))
					.then(r => r.json())
					.then(r => r.success ? r.player : Promise.reject(api.list.hypixel.fail))
					.catch(e => Promise.reject(e || api.list.hypixel.fail))
		},
		mojang: {
			uid: {
				fail: () => api.fail("mojang"),
				call: async (uid: string) =>
					await fetch("https://api.mojang.com/user/profiles/" + encodeURI(uid) + "/names")
						.then(r => r.json())
			},
			ign: {
				fail: () => api.fail("mojang"),
				call: async (ign: string) =>
					await fetch("https://api.mojang.com/users/profiles/minecraft/" + encodeURI(ign))
						.then(r => r.json())
			}
		}
	}
}

export default api