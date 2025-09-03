import { Component, type ReactNode } from 'react';
import { merge } from '../merge';

/**
 * DragOverlayProps
 *
 * - isDragging: controls visibility of the overlay. `null`/`undefined` are treated as false.
 * - children: any content rendered inside the overlay while dragging (typically a preview).
 * - className: optional additional classes to customize styling or override defaults.
 */
interface DragOverlayProps {
	isDragging?: boolean | null;
	children?: ReactNode;
	className?: string;
}

/**
 * DragOverlayComponent
 *
 * A presentational overlay used to render drag previews or similar UI while a drag
 * operation is in-flight. This component focuses on:
 * - Clear, typed public API for consumers.
 * - Accessibility hints (aria-hidden) so assistive tech ignores the overlay when hidden.
 *   other components in the project need that pattern.
 */
export class DragOverlayComponent extends Component<DragOverlayProps> {
	// Provide safe defaults so callers don't need to pass every prop.
	static defaultProps: Partial<DragOverlayProps> = {
		isDragging: false,
		className: undefined,
	};

	render() {
		const { isDragging, children, className } = this.props;

		// Compose visual classes and allow callers to append/override via `className`.
		const classes = merge(
			'w-screen h-screen overflow-auto transition-all',
			'flex flex-col justify-center items-center gap-2 absolute',
			isDragging
				? merge('p-6 bg-gradient-to-tr from-neutral-950 to-neutral-800 z-50', 'text-neutral-100 opacity-100')
				: 'pointer-events-none opacity-0',
			className ?? ''
		);

		return (
			// role='presentation' indicates this is visual-only. We also mirror the
			// visibility to `aria-hidden` so screen readers ignore the overlay when it's hidden.
			<div className={classes} role='presentation' aria-hidden={!isDragging}>
				{children}
			</div>
		);
	}
}

// End of DragOverlay.tsx — documented and slightly refactored for clarity.