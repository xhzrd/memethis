import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { Component, createRef, type PropsWithChildren, type ReactNode, type RefObject } from 'react';
import { Image, Star } from 'react-feather';
import { merge } from './merge';
import type { DeepKeys, DeepValue } from './safestate';

export class AppComponent extends Component<PropsWithChildren & { children?: ReactNode }> {
    state = {
        imageSource: null as string | null,
        finalResult: null as string | null,
        dragging: false,
        processing: false,
    };


	currentFILEName: string = '';
    fileInputRef: RefObject<HTMLInputElement | null> | null = createRef();
    ffmpeg: FFmpeg | null = null;

    constructor(props: PropsWithChildren & { children: ReactNode }) {
        super(props);
    }

    setTypedState<K extends DeepKeys<typeof this.state>>(key: K, value: Partial<DeepValue<typeof this.state, K>>) {
		this.setState((prevState) => {
			const keys = (typeof key == 'string' ? key : '').split('.') as string[];
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

    componentDidMount() {
        this.loadFFmpeg();
		// handle pasting images
		window.addEventListener('paste', this.handlePaste);
    }

	// paste handler
	handlePaste = (e: ClipboardEvent) => {
		const items = e.clipboardData?.items;
		if (!items) return;

		for (const item of items) {
			if (item.type.startsWith('image/')) {
				const file = item.getAsFile();
				if (!file) continue;

				const reader = new FileReader();
				reader.onload = (event) => {
					const src = event.target?.result as string;
					this.setTypedState('imageSource', '');
					this.setTypedState('finalResult', '');
					this.setTypedState('processing', false);
					this.setTypedState('imageSource', src);
					this.generateMeme(src);
				};
				reader.readAsDataURL(file);
				break; // handle only first image
			}
		}
	};

    loadFFmpeg = async () => {
        const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm';
		this.ffmpeg = null;
        this.ffmpeg = new FFmpeg();

        this.ffmpeg.on('log', ({ message }) => {
            console.log(message);
        });

        await this.ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
    };

	componentWillUnmount(): void {
		window.removeEventListener('paste', this.handlePaste);
		this.ffmpeg?.deleteFile(this.currentFILEName);
		this.ffmpeg = null;
	}

    // Accept an optional source to avoid racing with setState from FileReader
    generateMeme = async (source?: string) => {
        const imageSrc = source ?? this.state.imageSource;
        if (!imageSrc) return;

        console.log('Generating meme...');

        this.currentFILEName = `${Date.now()}-FILE-IMAGE-MEME.png`;
        this.setTypedState('processing', true);
        const ffmpeg = this.ffmpeg;

        const res = await fetch(imageSrc);
        const blob = await res.blob();
        const uint8Array = new Uint8Array(await blob.arrayBuffer());

				await ffmpeg?.writeFile('input.png', uint8Array);

		// first pass: downscale to 1/3, then back to original
		await ffmpeg?.exec([
			'-i', 'input.png',
			'-vf', 'scale=iw/3:ih/3,scale=iw*3:ih*3,format=yuv420p',
			'-q:v', '40',
			'tmp1.jpg',
		]);

		// second pass: repeat lightly for extra artifacting
		await ffmpeg?.exec([
			'-i', 'tmp1.jpg',
			'-vf', 'scale=iw/3:ih/3,scale=iw*3:ih*3,format=yuv420p',
			'-q:v', '40',
			this.currentFILEName,
		]);

        // convert SharedArrayBuffer -> ArrayBuffer
        const data = await ffmpeg?.readFile(this.currentFILEName);

        // ensure it's a Uint8Array, not string
        const uint8 = typeof data === 'string' ? new TextEncoder().encode(data) : data;

        const arrayBuffer = uint8?.slice().buffer; // copy to normal ArrayBuffer
        if (!arrayBuffer) {
            console.error('No array buffer generated!');
            this.setTypedState('processing', false);
            return;
        }
        const url = URL.createObjectURL(new Blob([arrayBuffer], { type: 'image/png' }));

        await ffmpeg?.deleteFile('input.png');
        await ffmpeg?.deleteFile('tmp1.jpg');

        this.setTypedState('finalResult', url);
        this.setTypedState('processing', false);
    };

    reset = () => {
        this.setTypedState('imageSource', null);
        this.setTypedState('finalResult', null);
    };

    handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        this.setTypedState('dragging', false);
        const file = e.dataTransfer.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const src = event.target?.result as string;
            this.setTypedState('imageSource', '');
            this.setTypedState('finalResult', '');
            this.setTypedState('processing', false);
            this.setTypedState('imageSource', src);
            this.generateMeme(src);
        };
        reader.readAsDataURL(file);
    };

    handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

    render() {
        const { imageSource, finalResult, dragging, processing } = this.state;

        return (
            <div
                onDrop={this.handleDrop}
                onDragOver={this.handleDragOver}
                onDragEnter={() => this.setTypedState('dragging', true)}
                onDragExit={() => this.setTypedState('dragging', false)}
                className={merge('flex flex-col justify-center items-center gap-2', 'w-screen h-screen overflow-auto transition-all')}
            >
                <p className='text-5xl font-semibold text-fuchsia-600'>MemeThis</p>
                <p className='text-4xl italic lg:max-w-[70vw] md:max-w-[60vw] max-w-[90vw] text-center'>
                    Make your screenshots like an <b>instagram-meme</b>, with all of that blurry and pixelated result.
                </p>

                <span className='my-2'></span>

                <input
                    ref={this.fileInputRef}
                    className='invisible fixed -top-full -left-full opacity-0'
                    type='file'
                    accept='image/*'
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                                const src = event.target?.result as string;
                                this.setTypedState('imageSource', src);
                                this.generateMeme(src);
                            };
                            reader.readAsDataURL(file);
                        }
                    }}
                />

                {!imageSource ? (
                    <div
                        onClick={() => this.fileInputRef?.current?.click()}
                        className={merge(
                            'inline-flex justify-center items-center p-6 w-max gap-2 min-h-max rounded-2xl text-3xl border-2 bg-neutral-200 transition-all border-neutral-300 hover:border-fuchsia-600 select-none cursor-pointer',
							'max-w-[90vw]'
                        )}
                    >
                        <p className='text-center w-max break-words inline-flex gap-3'>
							<Image size={32} className='min-w-6 min-h-6'/>Start by uploading, pasting an image, or dragging it here.</p>
                    </div>
                ) : processing ? (
                    <span className='inline-flex justify-center items-center gap-5 rounded-2xl bg-neutral-200 p-4 px-6 border-2 border-neutral-300'>
                        <svg className="animate-spin" width="18" height="18" viewBox="0 0 18 18">
                            <circle
                                cx="9"
                                cy="9"
                                r="8"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="none"
                                strokeDasharray="20 62.8"
                                strokeDashoffset="0"
                                strokeLinecap="round"
                            />
                        </svg>
                        <p className='text-center text-3xl min-w-max'>Generating your meme...</p>
                    </span>
                ) : finalResult ? (
                    <>
                        <img src={finalResult} className="max-w-[80vw] rounded-xl border-4 border-neutral-300" />
                        <button
                            className={merge(
								'px-8 py-5 bg-neutral-800 text-white text-3xl rounded-3xl',
								'hover:rounded-[100px] hover:bg-fuchsia-600 border-2 border-transparent hover:border-transparent hover:text-black',
								'transition-all inline-flex gap-3 items-center justify-center duration-300 active:scale-95'
							)}
                            onClick={this.reset}
                        >
							<Star size={18} color='currentColor' fill='currentColor'/>
                            Generate more memes
                        </button>
                    </>
                ) : !finalResult && !processing && (
                    <span className='inline-flex justify-center items-center gap-5 rounded-2xl bg-neutral-200 p-4 px-6 border-2 border-neutral-300'>
                        <svg className="animate-spin" width="18" height="18" viewBox="0 0 18 18">
                            <circle
                                cx="9"
                                cy="9"
                                r="8"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="none"
                                strokeDasharray="20 62.8"
                                strokeDashoffset="0"
                                strokeLinecap="round"
                            />
                        </svg>
                        <p className='text-center text-3xl min-w-max'>Loading backend services...</p>
                    </span>
                )}

                <span className='my-2'></span>

                <div className='flex flex-col justify-center items-center gap-0'>
                    <p className='opacity-60 text-lg'>This website is not affiliated with Instagram nor Meta.</p>
                    <p className='opacity-80 text-xl'>&copy; {new Date().getFullYear()} All rights reserved.</p>
                </div>

                <div
                    className={merge(
                        'flex flex-col justify-center items-center gap-2 absolute w-screen h-screen overflow-auto transition-all',
                        dragging
                            ? merge('p-6 bg-gradient-to-tr from-neutral-950 to-neutral-800 z-50', 'border-8 border-dashed border-neutral-600 text-neutral-100 opacity-100')
                            : 'pointer-events-none opacity-0'
                    )}
                >
                    <p className='text-5xl'>Drop your attachment so we can get started!</p>
                </div>
            </div>
        );
    }
}
