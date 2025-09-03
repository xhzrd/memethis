import { Component, type RefObject } from 'react';
import { Image } from 'react-feather';
import { LoadingSpinnerComponent } from '../components/LoadingSpinner';
import { merge } from '../merge';

type UploadLayoutProps = {
	uploadedImageSource: string | null;
	isProcessing: boolean;
	fileInputRef: RefObject<HTMLInputElement | null>;
	onFileInputClick: () => void;
	onFileChange: (src: string) => void;
};

/**
 * UploadLayout
 *
 * Presentational component that contains the upload controls and the small
 * status UI for when an image is being prepared/processed.
 *
 * This keeps the MainLayout focused on state/logic while this file focuses
 * on rendering the upload surface and input wiring.
 */
export class UploadLayout extends Component<UploadLayoutProps> {
	constructor(props: UploadLayoutProps) {
		super(props);
	}

	render() {
		const {
			uploadedImageSource,
			isProcessing,
			fileInputRef,
			onFileInputClick,
			onFileChange,
		} = this.props;

		return (
			<>
				{/* Hidden native file input used by the upload button */}
				<input
					ref={fileInputRef}
					className='invisible fixed -top-full -left-full opacity-0'
					type='file'
					accept='image/*'
					onChange={(e) => {
						const file = e.target.files?.[0];
						if (file) {
							const reader = new FileReader();
							reader.onload = (event) => {
								const src = event.target?.result as string;
								onFileChange(src);
							};
							reader.readAsDataURL(file);
						}
					}}
				/>

				{/* Upload surface / initial call-to-action */}
				{!uploadedImageSource ? (
					<div
						onClick={onFileInputClick}
						className={merge(
							'inline-flex justify-center items-center p-6 w-max gap-2 min-h-max rounded-2xl text-3xl border-2 bg-neutral-200 transition-all border-neutral-300 hover:border-fuchsia-600 select-none cursor-pointer',
							'max-w-[90vw]'
						)}
					>
						<p className='text-center w-max break-words inline-flex gap-3'>
							<Image size={32} className='min-w-6 min-h-6' />
							Start by uploading, pasting an image, or dragging it
							here.
						</p>
					</div>
				) : isProcessing ? (
					<span className='inline-flex justify-center items-center gap-5 rounded-2xl bg-neutral-200 p-4 px-6 border-2 border-neutral-300'>
						<LoadingSpinnerComponent size={18} />
						<p className='text-center text-3xl min-w-max'>
							Generating your meme...
						</p>
					</span>
				) : !uploadedImageSource && !isProcessing && (
					<span className='inline-flex justify-center items-center gap-5 rounded-2xl bg-neutral-200 p-4 px-6 border-2 border-neutral-300'>
						<p className='text-center text-3xl min-w-max'>
							Loading backend services...
						</p>
					</span>
				)}
			</>
		);
	}
}
