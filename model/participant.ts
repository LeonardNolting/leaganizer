export default interface Participant {
	player: string
}

export interface ParticipantRow extends Participant {
	tournament: number
	team: number | null
	goals: number
	assists: number
	clean_sheets: number
	quit: Date
	preferred_start: Date
	joined: Date
}