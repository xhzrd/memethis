import { Component, type PropsWithChildren } from 'react';
import type { DeepKeys, DeepValue } from '../safestate';

type SliderProps = PropsWithChildren & {
	min?: number;
	max?: number;
	step?: number;
	value?: number;
	onChange?: (value: number) => void;
};

export class SliderComponent extends Component<SliderProps> {
	state = {
		value: this.props.value ?? this.props.min ?? 0,
	};

	constructor(props: SliderProps) {
		super(props);
	}

	setTypedState<K extends DeepKeys<typeof this.state>>(
		key: K,
		value: Partial<DeepValue<typeof this.state, K>>
	) {
		this.setState((prevState) => {
			const keys = (typeof key == 'string' ? key : '').split(
				'.'
			) as string[];
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const newState: any = structuredClone(prevState);
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

	handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = Number(e.target.value);
		this.setTypedState('value', val);
		this.props.onChange?.(val);
	};

	renderTicks() {
		const { min = 0, max = 100, step = 10 } = this.props;
		const totalSteps = (max - min) / step;
		const ticks = [];

		for (let i = 0; i <= totalSteps; i++) {
			const position = (i / totalSteps) * 100;
			ticks.push(
				<div
					key={i}
					className='absolute top-0 h-full flex flex-col justify-center items-center'
					style={{
						left: `${position}%`,
						transform: 'translateX(-50%)',
					}}
				>
					<div className='w-[2px] h-3 bg-gray-400 rounded'></div>
				</div>
			);
		}

		return (
			<div className='absolute top-0 left-0 w-full h-full pointer-events-none'>
				{ticks}
			</div>
		);
	}

	render() {
		const { min = 0, max = 100, step = 1 } = this.props;
		const { value } = this.state;

		return (
			<div className='w-full max-w-md mx-auto'>
				<div className='flex items-center gap-4 relative'>
					<span className='text-gray-700'>{min}</span>
					<div className='relative w-full h-6 flex items-center'>
						{this.renderTicks()}
						<input
							type='range'
							min={min}
							max={max}
							step={step}
							value={value}
							onChange={this.handleChange}
							className='w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-500 relative z-10'
						/>
					</div>
					<span className='text-gray-700'>{max}</span>
				</div>
			</div>
		);
	}
}
