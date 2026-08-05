# Lab Terminal Studio

Lab Terminal Studio is a powerful web-based tool designed to generate custom terminal mockup snapshots and embed them directly into PDF documents or a blank canvas. It provides an intuitive interface for customizing terminal aesthetics, commands, and outputs, alongside a robust PDF editor for arranging and exporting your final compositions.

## Features

- **Terminal Mockup Generator**:
  - Customize terminal appearance (themes, fonts, font size, padding).
  - Add, edit, duplicate, and reorder terminal interactions (commands and outputs).
  - Configurable prompt details (username, hostname, current directory).
  - Export terminal snapshots as PNG or copy directly to clipboard.
- **PDF Editor**:
  - Upload existing PDF documents or start with a blank multi-page canvas.
  - Insert generated terminal snapshots onto PDF pages.
  - Interactive canvas: drag, resize, rotate, crop, lock, and manage layers (bring to front/send to back) of your inserted snapshots.
  - Fine-tune opacity for placed elements.
- **Export & Compilation**:
  - Compile the final document with embedded high-quality terminal snapshots.
  - Export the edited document as a new PDF file.

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS, Framer Motion
- **Icons**: Lucide React
- **State Management**: Zustand
- **Canvas & PDF Handling**: 
  - `konva` & `react-konva` for interactive 2D canvas manipulations.
  - `pdfjs-dist` for rendering and viewing PDF pages.
  - `pdf-lib` for modifying and generating the final PDF document.
  - `html-to-image` for capturing high-quality DOM-to-image snapshots.

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn or pnpm

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd lab_output
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit the local URL provided by Vite (usually `http://localhost:5173`).

### Building for Production

To create a production-ready build, run:
```bash
npm run build
```
The compiled assets will be available in the `dist` folder.
