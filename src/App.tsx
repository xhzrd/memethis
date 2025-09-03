import { Component, type PropsWithChildren, type ReactNode } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { MainLayout } from "./layouts/MainLayout";
import type { DeepKeys, DeepValue } from "./safestate";

export class AppComponent extends Component<
	PropsWithChildren & { children?: ReactNode }
> {
	state = {};

	constructor(props: PropsWithChildren & { children: ReactNode }) {
		super(props);
	}

	setTypedState<K extends DeepKeys<typeof this.state>>(
		key: K,
		value: Partial<DeepValue<typeof this.state, K>>
	) {
		this.setState((prevState) => {
			const keys = (typeof key == "string" ? key : "").split(
				"."
			) as string[];
			// eslint-disable-next-line @typescript-eslint/no-explicit-any, prefer-const
			let newState: any = structuredClone(prevState);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			let current: any = newState;
			for (let i = 0; i < keys.length - 1; i++) {
				current[keys[i]] = { ...current[keys[i]] };
				current = current[keys[i]];
			}
			current[keys[keys.length - 1]] = value;

			return newState;
		});
	}

	render() {
		return (
			<>
				<BrowserRouter>
					<Routes>
						<Route path="/" element={<MainLayout />} />
					</Routes>
				</BrowserRouter>
			</>
		);
	}
}
