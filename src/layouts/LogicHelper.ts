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
		processImageWithFFmpeg?: (
			amount?: number,
			source?: string
		) => Promise<void>;
		reset?: () => void;
		handleDrop?: (e: DragEvent, amount: number) => void;
		handleDragOver?: (e: DragEvent) => void;
		onPasteImage?: (e: ClipboardEvent, amount: number) => void;
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
	// Process an image source (data URL) using FFmpeg with dynamic rescaling & compression
	api.processImageWithFFmpeg = async (
		amount: number = 3,
		source?: string
	) => {
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

		// fetch and write input
		const response = await fetch(fileSrc);
		const fileBlob = await response.blob();
		await ffmpeg.writeFile(
			'input.png',
			new Uint8Array(await fileBlob.arrayBuffer())
		);

		// calculate scale factor and quality
		const scaleFactor = 1 / amount;
		const quality = Math.min(40 + (amount - 3) * 5, 50);

		let prevFile = 'input.png';
		const tmpFiles: string[] = [];

		// processing loop
		const output = owner.ffmpegFileOutputName;

		await ffmpeg.exec([
			'-i',
			prevFile,
			'-vf',
			`scale=iw*${scaleFactor}:ih*${scaleFactor},scale=iw/${scaleFactor}:ih/${scaleFactor},format=yuv420p`,
			'-q:v',
			quality.toString(),
			output,
		]);

		prevFile = output;

		// read final file
		const resultFileData = await ffmpeg.readFile(
			owner.ffmpegFileOutputName
		);
		const resultUint8Array =
			typeof resultFileData === 'string'
				? new TextEncoder().encode(resultFileData)
				: resultFileData;

		if (!resultUint8Array) {
			if (import.meta.env.DEV) console.error('FFmpeg processing failed.');
			else alert('Failed to get a result for your meme!');
			owner.updateStateAtPath('ffmpeg.isProcessing', false);
			return;
		}

		const arrayBuffer = resultUint8Array.slice().buffer;
		const url = URL.createObjectURL(
			new Blob([arrayBuffer], { type: 'image/png' })
		);

		// cleanup
		await ffmpeg.deleteFile('input.png');
		for (const tmp of tmpFiles) {
			await ffmpeg.deleteFile(tmp);
		}

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
	api.handleDrop = (e: DragLike, amount: number) => {
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
			api.processImageWithFFmpeg!(amount, src);
		};
		reader.readAsDataURL(file);
	};

	api.handleDragOver = (e: Event) => {
		const de = e as DragEvent;
		de.preventDefault?.();
	};

	// Paste handler — accept the first pasted image and process it.
	api.onPasteImage = (e: ClipboardEvent, amount: number) => {
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
					api.processImageWithFFmpeg!(amount, src);
				};
				reader.readAsDataURL(file);
				break;
			}
		}
	};

	return api as {
		loadFFmpegInstance: () => Promise<void>;
		processImageWithFFmpeg: (
			amount?: number,
			source?: string
		) => Promise<void>;
		reset: () => void;
		handleDrop: (
			e: {
				dataTransfer?: DataTransfer | null;
				preventDefault?: () => void;
			},
			amount: number
		) => void;
		handleDragOver: (e: { preventDefault?: () => void }) => void;
		onPasteImage: (e: ClipboardEvent, amount: number) => void;
	};
}
