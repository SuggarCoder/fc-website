# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Solid.js + Three.js web application for building interactive 3D experiences. Uses Vite for bundling and development.

## Commands

- `pnpm dev` or `pnpm start` - Start dev server on http://localhost:3000
- `pnpm build` - Production build to `dist/`
- `pnpm serve` - Preview production build

## Architecture

**Entry Flow:**
- `index.html` → `src/index.tsx` (mounts app, initializes devtools) → `src/App.tsx` (root component)

**Tech Stack:**
- **Solid.js** - Reactive UI framework with fine-grained reactivity
- **Three.js** - 3D graphics rendering
- **GSAP** - Animation library
- **UnocSS** (preset-mini) - Atomic CSS utilities
- **TypeScript** - Strict mode enabled

**Key Directories:**
- `src/` - Application source code (Solid components)
- `public/` - Static assets including 3D models (.glb files)

## Configuration Notes

- Vite dev server runs on port 3000
- TypeScript uses JSX preserve mode with solid-js import source
- UnocSS provides utility classes (e.g., `text-4xl`, `font-bold`)
