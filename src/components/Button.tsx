import { Component, type MouseEvent, type ReactNode } from 'react';
import { merge } from '../merge';

/**
 * ButtonProps - public contract for the `Button` component.
 *
 * Inputs:
 * - onClick: optional click handler passed the native MouseEvent for the button.
 * - children: any React nodes (text, icons, fragments) rendered inside the button.
 * - isDisabled: when true the button becomes inert and communicates the state to assistive tech.
 * - className: optional extra Tailwind (or other) classes to append to the default styling.
 *
 * Notes:
 * - All props are optional to keep the component ergonomic for small UIs.
 * - We intentionally keep this component small and presentational. Any analytics
 *   or side effects should be wired upstream (where `onClick` is provided).
 */
interface ButtonProps {
	onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
	children?: ReactNode;
	isDisabled?: boolean | null;
	className?: string | null;
}

/**
 * Button
 *
 * A small, well-documented presentational Button component styled with Tailwind CSS.
 * This is implemented as a class component here to match the repo's existing patterns.
 *
 * Production-focused improvements added:
 * - JSDoc and inline comments for maintainability.
 * - `disabled` support + `aria-disabled` for accessibility.
 * - Avoid recreating the click handler on every render (class field bound once).
 * - `className` passthrough so consumers can tweak spacing, size, or color.
 */
export class Button extends Component<ButtonProps> {
	// Default props for backwards compatibility and explicit contract.
	static defaultProps: Partial<ButtonProps> = {
		isDisabled: false,
		className: undefined,
	};

	/**
	 * Class-field bound handler avoids creating a new function on every render.
	 * This is a small performance tweak for frequently re-rendered lists.
	 */
	private handleClick = (e: MouseEvent<HTMLButtonElement>) => {
		// Don't call through if disabled — keep the button inert.
		if (this.props.isDisabled) return;
		this.props.onClick?.(e);
	};

	render() {
		const { children, isDisabled, className } = this.props;

		// Tailwind classes are composed with a small utility (`merge`) that de-duplicates
		// and concatenates strings. Keep the default look in one place so it's easy to
		// reason about and override with `className` if needed.
		const baseClasses = merge(
			// Layout
			'inline-flex items-center justify-center gap-3',

			// Visuals
			'bg-neutral-800 text-white text-3xl rounded-3xl',
			'border-2 border-transparent',
			'px-8 py-5',

			// Interaction states (hover / active)
			'hover:rounded-[100px] hover:bg-fuchsia-600 hover:border-transparent hover:text-black',
			'transition-all duration-300 active:scale-95',

			// Allow callers to append/override styles without losing defaults
			className ?? ''
		);

		return (
			// Use the native <button> element (semantically correct) and mirror the
			// disabled state to both the `disabled` attribute and `aria-disabled` so
			// assistive technologies get the right hint.
			<button
				type='button'
				className={baseClasses}
				onClick={this.handleClick}
				disabled={isDisabled || false}
				aria-disabled={isDisabled ? 'true' : 'false'}
			>
				{children}
			</button>
		);
	}
}

// End of Button.tsx — small, documented, and accessible presentational button.