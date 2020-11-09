export default interface Team {
	name: string
}

export interface TeamRow extends Team {
	id: number
	tournament: number
}