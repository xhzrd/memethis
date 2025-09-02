export type DeepKeys<T, _P extends string = ''> = T extends object
	? {
		[K in keyof T]: K extends string
			? `${_P}${K}` | DeepKeys<T[K], `${_P}${K}.`>
			: never;
	}[keyof T]
	: never;

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint, @typescript-eslint/no-explicit-any
export type DeepValue<T, K extends any> = K extends `${infer P}.${infer R}`
	? P extends keyof T
		? DeepValue<T[P], R>
		: never
	: K extends keyof T
	? T[K]
	: never;