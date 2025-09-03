import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import type { MainLayout } from './MainLayout';

/**
 * MainLogic
 *
 * Encapsulates the imperative logic originally living inside MainLayout.
 * The functions here mutate small pieces of the owner component (a
 * MainLayout instance) so the presentational component can remain thin.
 *
 * The owner is expected to expose the following fields/methods:
 * - ffmpegInstance: FFmpeg | null
 * - ffmpegFileOutputName: string
 * - FileInputRef: React.RefObject<HTMLInputElement | null>
 * - updateStateAtPath(path, value): used to update deep state paths
 */
export function BuildMainLayoutLogic(owner: MainLayout) {
	// Build the api object first so internal helpers can call each other
	// without going through the owner (which would cause recursion).
	const api: {
		loadFFmpegInstance?: () => Promise<void>;
		processImageWithFFmpeg?: (source?: string) => Promise<void>;
		reset?: () => void;
		handleDrop?: (e: DragEvent) => void;
		handleDragOver?: (e: DragEvent) => void;
		onPasteImage?: (e: ClipboardEvent) => void;
	} = {};

	api.loadFFmpegInstance = async () => {
		const baseURL =
			'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm';
		owner.ffmpegInstance = new FFmpeg();
		if (import.meta.env.DEV)
			owner.ffmpegInstance.on('log', ({ message }: { message: string }) =>
				console.log(`FFMPEG: ${message}`)
			);
		await owner.ffmpegInstance.load({
			coreURL: await toBlobURL(
				`${baseURL}/ffmpeg-core.js`,
				'text/javascript'
			),
			wasmURL: await toBlobURL(
				`${baseURL}/ffmpeg-core.wasm`,
				'application/wasm'
			),
		});
	};

	// Process an image source (data URL) using the FFmpeg instance and set
	// the resulting blob URL on the owner's state under 'ffmpeg.commandFileResult'.
	api.processImageWithFFmpeg = async (source?: string) => {
		const fileSrc = source ?? owner.state.userInput.uploadedImageSource;
		if (!fileSrc) return;
		owner.ffmpegFileOutputName = `${Date.now()}-FILE-${Math.random()
			.toString(36)
			.substring(2, 15)}.png`;
		owner.updateStateAtPath('ffmpeg.isProcessing', true);
		const ffmpeg: FFmpeg | null = owner.ffmpegInstance;
		if (!ffmpeg) {
			if (import.meta.env.DEV)
				return console.error('FFmpeg is not initialized!');
			return alert(
				'FFmpeg is not ready yet! Please wait or reload the webpage.'
			);
		}

		const result = await fetch(fileSrc);
		const fileBlob = await result.blob();
		const ffmpegCompatiableArray = new Uint8Array(
			await fileBlob.arrayBuffer()
		);
		await ffmpeg.writeFile('input.png', ffmpegCompatiableArray);

		await ffmpeg.exec([
			'-i',
			'input.png',
			'-vf',
			'scale=iw/3:ih/3,scale=iw*3:ih*3,format=yuv420p',
			'-q:v',
			'40',
			'tmp1.jpg',
		]);
		await ffmpeg.exec([
			'-i',
			'tmp1.jpg',
			'-vf',
			'scale=iw/3:ih/3,scale=iw*3:ih*3,format=yuv420p',
			'-q:v',
			'40',
			'tmp2.jpg',
		]);
		await ffmpeg.exec([
			'-i',
			'tmp2.jpg',
			'-vf',
			'scale=iw/3:ih/3,scale=iw*3:ih*3,format=yuv420p',
			'-q:v',
			'40',
			owner.ffmpegFileOutputName,
		]);

		const resultFileData = await ffmpeg.readFile(
			owner.ffmpegFileOutputName
		);
		const resultUint8Array =
			typeof resultFileData === 'string'
				? new TextEncoder().encode(resultFileData)
				: resultFileData;
		if (!resultUint8Array) {
			if (import.meta.env.DEV)
				return console.error(
					'Could not get a result of the FFmpeg processing.'
				);
			return alert('Failed to get a result for your meme!');
		}

		const arrayBuffer = resultUint8Array.slice().buffer;
		if (!arrayBuffer) {
			if (import.meta.env.DEV)
				console.error(
					'Failed to copy the uint8array buffer to an array buffer!'
				);
			else alert('Failed to generate your meme!');
			owner.updateStateAtPath('ffmpeg.isProcessing', false);
			return;
		}

		const url = URL.createObjectURL(
			new Blob([arrayBuffer], { type: 'image/png' })
		);
		await ffmpeg.deleteFile('input.png');
		await ffmpeg.deleteFile('tmp1.jpg');
		await ffmpeg.deleteFile('tmp2.jpg');

		owner.updateStateAtPath('ffmpeg.commandFileResult', url);
		owner.updateStateAtPath('ffmpeg.isProcessing', false);
	};

	// Reset owner UI state to initial
	api.reset = () => {
		owner.updateStateAtPath('userInput.isDragging', false);
		owner.updateStateAtPath('userInput.uploadedImageSource', null);
		owner.updateStateAtPath('ffmpeg.commandFileResult', null);
	};

	// Drag/drop handlers: accept a minimal "drag-like" object so this module
	// works with both DOM DragEvent and React's SyntheticEvent which expose
	// a `dataTransfer` and `preventDefault`.
	type DragLike = {
		dataTransfer?: DataTransfer | null;
		preventDefault?: () => void;
	};
	api.handleDrop = (e: DragLike) => {
		e.preventDefault?.();
		owner.updateStateAtPath('userInput.isDragging', false);
		const file = e.dataTransfer?.files[0];
		if (!file) {
			if (import.meta.env.DEV) return console.error('Not a valid file!');
			return alert('Please drag a valid file.');
		}
		const reader = new FileReader();
		reader.onload = (event) => {
			const src = event.target?.result as string;
			owner.updateStateAtPath('userInput.uploadedImageSource', src);
			owner.updateStateAtPath('ffmpeg.commandFileResult', null);
			owner.updateStateAtPath('ffmpeg.isProcessing', false);
			api.processImageWithFFmpeg!(src);
		};
		reader.readAsDataURL(file);
	};

	api.handleDragOver = (e: Event) => {
		const de = e as DragEvent;
		de.preventDefault?.();
	};

	// Paste handler — accept the first pasted image and process it.
	api.onPasteImage = (e: ClipboardEvent) => {
		const items = e.clipboardData?.items;
		if (!items) return;
		for (const item of items) {
			if (item.type.startsWith('image/')) {
				const file = item.getAsFile();
				if (!file) continue;
				const reader = new FileReader();
				reader.onload = (event) => {
					const src = event.target?.result as string;
					owner.updateStateAtPath('ffmpeg.commandFileResult', '');
					owner.updateStateAtPath('ffmpeg.isProcessing', false);
					owner.updateStateAtPath(
						'userInput.uploadedImageSource',
						src
					);
					api.processImageWithFFmpeg!(src);
				};
				reader.readAsDataURL(file);
				break;
			}
		}
	};

	return api as {
		loadFFmpegInstance: () => Promise<void>;
		processImageWithFFmpeg: (source?: string) => Promise<void>;
		reset: () => void;
		handleDrop: (e: {
			dataTransfer?: DataTransfer | null;
			preventDefault?: () => void;
		}) => void;
		handleDragOver: (e: { preventDefault?: () => void }) => void;
		onPasteImage: (e: ClipboardEvent) => void;
	};
}
