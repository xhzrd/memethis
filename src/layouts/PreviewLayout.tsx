import { Component } from 'react';
import { Star } from 'react-feather';
import { Button } from '../components/Button';

type PreviewLayoutProps = {
	resultUrl: string | null;
	onReset: () => void;
};

/**
 * PreviewLayout
 *
 * Responsible for displaying the generated meme result and primary actions
 * such as resetting to create another meme. Keeps MainLayout free from
 * presentational markup related to the final preview.
 */
export class PreviewLayout extends Component<PreviewLayoutProps> {
	constructor(props: PreviewLayoutProps) {
		super(props);
	}

	render() {
		const { resultUrl, onReset } = this.props;

		if (!resultUrl) return null;

		return (
			<>
				<img
					src={resultUrl}
					className='max-w-[80vw] rounded-xl border-4 border-neutral-300'
				/>
				<Button onClick={onReset}>
					<Star size={18} color='currentColor' fill='currentColor' />
					Generate more memes
				</Button>
			</>
		);
	}
}
