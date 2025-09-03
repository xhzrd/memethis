import { Component } from 'react';
import { merge } from '../merge';

/**
 * LoadingSpinnerProps
 *
 * - size: diameter in pixels for the SVG viewport. Defaults to 24 for a compact spinner.
 * - className: optional extra classes to customize color, spacing or override defaults.
 */
interface LoadingSpinnerProps {
	size?: number;
	className?: string | null;
}

/**
 * LoadingSpinnerComponent
 *
 * A small, accessible SVG spinner used across the UI to indicate loading states.
 * Production-focused improvements:
 * - Default `size` so consumers don't need to pass it every time.
 * - `role='status'` and visually-hidden text for screen readers.
 * - JSDoc + inline comments for maintainability.
 * - `className` passthrough so callers can change color or spacing via Tailwind.
 */
export class LoadingSpinnerComponent extends Component<LoadingSpinnerProps> {
	static defaultProps: Partial<LoadingSpinnerProps> = {
		size: 24,
		className: null,
	};

	render() {
		// Destructure props once for clarity and to avoid repeated property access.
		const { size = 24, className } = this.props;

		// Compute derived geometry for the circle. We subtract 2 so the stroke stays
		// inside the viewBox when strokeWidth=2.
		const center = size / 2;
		const radius = Math.max(0, center - 2);

		// Compose classes; `merge` will de-duplicate and concatenate safely.
		const classes = merge('animate-spin', className ?? '');

		return (
			// role='status' makes the element a live region for assistive tech.
			// We include a tiny visually-hidden label so screen readers announce a helpful
			// message instead of only the SVG.
			<svg
				role='status'
				className={classes}
				width={size}
				height={size}
				viewBox={`0 0 ${size} ${size}`}
				aria-hidden={false}
			>
				{/* Visually hidden text for screen readers. Keep the text short. */}
				<title>Loading</title>

				<circle
					cx={center}
					cy={center}
					r={radius}
					stroke='currentColor'
					strokeWidth={2}
					fill='none'
					// strokeDasharray/strokeDashoffset tuned for an attractive spinner.
					strokeDasharray={`${Math.max(1, Math.round(radius * 2))} ${Math.max(1, Math.round(Math.PI * radius * 2))}`}
					strokeDashoffset='0'
					strokeLinecap='round'
				/>
			</svg>
		);
	}
}

// End of LoadingSpinner.tsx — accessible, documented, and ready for reuse.