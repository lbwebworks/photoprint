# L&K Printing Service

A client-side photo print layout tool built with React and Konva.js. Arrange photos on A4/A5 paper at 300 DPI, adjust layout, and export print-ready PNG or PDF — no backend required.

## Features

- **Paper sizes** — A4 and A5, portrait or landscape
- **Grid layout** — 1 to 144 slots (1×1 up to 12×12), fills the page exactly
- **Free Size layout** — set custom slot dimensions in mm, slots pack and center automatically
- **5mm paper margin** — maintained on all sides for both paper sizes
- **Image upload** — multi-file, loaded via `URL.createObjectURL` (no server)
- **Auto-fill** — 1 image fills all slots; multiple images assign sequentially, last repeats
- **Slot interaction** — drag to reposition crop, scroll to zoom (fill scale enforced, no empty space)
- **Export PNG** — full resolution (e.g. 2480×3508 for A4 portrait)
- **Export PDF** — print-ready A4/A5 PDF via jsPDF

## Stack

- [React](https://react.dev/) — functional components
- [react-konva](https://konvajs.org/docs/react/) — canvas rendering
- [jsPDF](https://github.com/parallax/jsPDF) — PDF export
- [Tailwind CSS v4](https://tailwindcss.com/) — styling
- [Vite](https://vite.dev/) — build tool

## Getting Started

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
```

Output goes to `dist/` — ready to deploy as a static site.

## Project Structure

```
src/
├── components/
│   ├── MenuBar.jsx       # Top bar — title, upload, export buttons
│   ├── Toolbar.jsx       # Left sidebar — paper, orientation, layout controls
│   ├── CanvasEditor.jsx  # Konva Stage — renders the print layout
│   └── Slot.jsx          # Individual photo slot — clipped, draggable, zoomable
└── utils/
    ├── layoutEngine.js   # Paper sizes, slot computation, auto-fill logic
    ├── imageUtils.js     # Fill scale and clamp offset helpers
    └── exportUtils.js    # PNG and PDF export
```

## License

MIT
