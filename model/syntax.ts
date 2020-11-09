// type Syntax = { [T: string]: string[] };
type Syntax = {[T: string]: SyntaxProperties}
export default Syntax

export type SyntaxProperties = {
	type: string,
	description: string,
	optional?: boolean
}