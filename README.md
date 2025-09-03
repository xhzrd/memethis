# MemeThis

<p align="center">
  <img src="public/memethis.png" alt="memethis logo" width="128"/>
</p>

---

MemeThis is a tiny, client-side web app that turns screenshots and images into that intentionally-blurry, low-quality "Instagram-style" meme look using FFmpeg compiled to WebAssembly, Like if the image was reposted more than 2000 times and then got compressed each time. It focuses on a very small surface: upload, drag, or paste an image, hit generate, and get a result, compressed PNG ready to share.

Live demo: https://memethis.netlify.app

Why this project exists

- Fun, experimental use of FFmpeg in the browser.
- Extremely small UI, built with Vite + TypeScript + React.
- Works offline once the FFmpeg wasm bundle is cached by the browser.

Key files

- `src/layouts/MainLayout.tsx` - top-level app UI (now slimmed down; logic moved out).
- `src/layouts/LogicHelper.ts` - FFmpeg, drag/paste, and image-processing logic.
- `src/layouts/UploadLayout.tsx` and `src/layouts/PreviewLayout.tsx` - presentational pieces.
- `public/memethis.png` - project logo used in this README and the app header.

## Getting started

This repo is set up to work nicely with Bun. From the project root:

```bash
bun install
bun run dev
```

Build for production with Bun:

```bash
bun run build
bun run preview
```

### Alternative package managers

If you prefer pnpm, yarn or npm the same scripts are available:

pnpm
```bash
pnpm install
pnpm dev
```

yarn
```bash
yarn
yarn dev
```

npm
```bash
npm install
npm run dev
```

Development notes

- The heavy lifting happens in `src/layouts/LogicHelper.ts` which initializes the FFmpeg WASM runtime and exposes functions for handling pasted or dropped images and generating the final PNG.
- The UI is intentionally small and presentational; `UploadLayout` and `PreviewLayout` keep `MainLayout` readable.
- During development open the browser devtools and check the console for FFmpeg logs (enabled in dev mode).

Contributing

Small PRs welcome. If adding features, try to:

- Keep the UI presentational vs logic-separated.
- Add a short test or manual verification steps in a PR description.

The project's license is under [Apache 2.0](LICENSE)

Enjoy!
