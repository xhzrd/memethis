export function merge(
	...args: (string | null | undefined | number | (() => string)[])[]
): string {
	const classes: string[] = [];

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const flatten = (item: any) => {
		if (!item) return;
		if (typeof item === "string" || typeof item === "number") {
			classes.push(String(item));
		} else if (Array.isArray(item)) {
			item.forEach(flatten);
		} else if (typeof item === "function") {
			flatten(item());
		}
	};

	args.forEach(flatten);

	// naive conflict resolution for tailwind: keep last occurrence

	return classes
		.join(" ");
}
