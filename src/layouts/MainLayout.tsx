import { FFmpeg } from '@ffmpeg/ffmpeg';
import {
	Component,
	createRef,
	type PropsWithChildren,
	type ReactNode,
	type RefObject,
} from 'react';
import { merge } from '../merge';
import type { DeepKeys, DeepValue } from '../safestate';

import { DragOverlayComponent as DragOverlay } from '../components/DragOverlay';
import { BuildMainLayoutLogic } from './LogicHelper';
import { PreviewLayout } from './PreviewLayout';
import { UploadLayout } from './UploadLayout';

/**
 * MainLayout
 *
 * This component encapsulates the app's UI and the FFmpeg handling logic.
 * Responsibilities:
 * - Manage local UI state (uploads, dragging, processing, results).
 * - Initialize and use the FFmpeg instance for image processing.
 * - Render a small, clear UI using the project's presentational components.
 */
export class MainLayout extends Component<
	PropsWithChildren & { children?: ReactNode }
> {
	state = {
		userInput: {
			uploadedImageSource: null as string | null,
			isDragging: false,
		},
		ffmpeg: {
			isProcessing: false,
			commandFileResult: null as string | null,
		},
	};

	// FFmpeg runtime instance and the current output filename.
	ffmpegInstance: FFmpeg | null = null;
	ffmpegFileOutputName = '';

	// File input ref used by the upload button.
	FileInputRef: RefObject<HTMLInputElement | null> | null = createRef();

	// Encapsulated imperative logic created from `mainLogic`.
	logic: ReturnType<typeof BuildMainLayoutLogic> | null = null;

	// Small typed-state helper used across this repo. Keeps updates immutable.
	// Use `updateStateAtPath` to set deep values like 'ffmpeg.isProcessing'.
	updateStateAtPath<K extends DeepKeys<typeof this.state>>(
		key: K,
		value: Partial<DeepValue<typeof this.state, K>>
	) {
		this.setState((prevState) => {
			const keys = (typeof key === 'string' ? key : '').split(
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

	componentDidMount() {
		// create and wire the logic module that manages ffmpeg and drag/paste
		this.logic = BuildMainLayoutLogic(this);
		this.logic.loadFFmpegInstance();
		window.addEventListener(
			'paste',
			this.logic.onPasteImage as EventListener
		);
	}

	componentWillUnmount(): void {
		window.removeEventListener(
			'paste',
			this.logic?.onPasteImage as EventListener
		);
		if (this.ffmpegInstance) {
			this.ffmpegInstance.deleteFile(this.ffmpegFileOutputName);
			this.ffmpegInstance = null;
		}
	}
	// Delegated to the logic module. Wrapper kept for compatibility.
	onPasteImage = (e: ClipboardEvent) =>
		this.logic?.onPasteImage(e as ClipboardEvent);

	// Delegated to the logic module.
	loadFFmpegInstance = async () => this.logic?.loadFFmpegInstance();

	// Delegated to the logic module.
	processImageWithFFmpeg = async (source?: string) =>
		this.logic?.processImageWithFFmpeg(source);

	// Delegated to logic module for clarity.
	reset = () => this.logic?.reset();

	// Delegate to the logic module.
	handleDrop = (e: React.DragEvent<HTMLDivElement>) =>
		this.logic?.handleDrop({
			preventDefault: () => e.preventDefault(),
			dataTransfer: e.dataTransfer,
		});

	handleDragOver = (e: React.DragEvent<HTMLDivElement>) =>
		this.logic?.handleDragOver({
			preventDefault: () => e.preventDefault(),
		});

	render() {
		const { isDragging, uploadedImageSource } = this.state.userInput;
		const { isProcessing, commandFileResult } = this.state.ffmpeg;

		return (
			<div
				onDrop={this.handleDrop}
				onDragOver={this.handleDragOver}
				onDragEnter={() =>
					this.updateStateAtPath('userInput.isDragging', true)
				}
				onDragExit={() =>
					this.updateStateAtPath('userInput.isDragging', false)
				}
				className={merge(
					'flex flex-col justify-center items-center gap-2',
					'w-screen h-screen overflow-auto transition-all'
				)}
			>
				<p className='text-5xl font-semibold text-fuchsia-600'>
					MemeThis
				</p>
				<p className='text-4xl italic lg:max-w-[70vw] md:max-w-[60vw] max-w-[90vw] text-center'>
					Make your screenshots like an <b>instagram-meme</b>, with
					all of that blurry and pixelated result.
				</p>

				<span className='my-2' />

				<UploadLayout
					uploadedImageSource={uploadedImageSource}
					isProcessing={isProcessing}
					fileInputRef={
						this.FileInputRef as RefObject<HTMLInputElement | null>
					}
					onFileInputClick={() => this.FileInputRef?.current?.click()}
					onFileChange={(src) => {
						this.updateStateAtPath(
							'userInput.uploadedImageSource',
							src
						);
						this.processImageWithFFmpeg(src);
					}}
				/>

				{commandFileResult ? (
					<PreviewLayout
						resultUrl={commandFileResult}
						onReset={this.reset}
					/>
				) : null}

				<span className='my-2' />

				<div className='flex flex-col justify-center items-center gap-0'>
					<p className='opacity-60 text-lg'>
						This site is not affiliated with Instagram or Meta.
					</p>
					<p className='opacity-80 text-xl'>
						&copy; {new Date().getFullYear()} xhzrd. All rights
						reserved.
					</p>
				</div>

				{/* The drag overlay is visually present only while dragging; it uses aria-hidden when not active. */}
				<DragOverlay isDragging={isDragging}>
					<p className='text-3xl'>We are receiving the signal!!</p>
					<p className='text-2xl'>
						You are safe to drop your image now so we can process
						it!
					</p>
				</DragOverlay>
			</div>
		);
	}
}
