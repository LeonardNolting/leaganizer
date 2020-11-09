export default interface Player {
	id: string
}

export interface PlayerRow extends Player {
	ign: string
	tier: number
	verified: boolean
	verified_at: Date | null
	minecraft_id: string
}