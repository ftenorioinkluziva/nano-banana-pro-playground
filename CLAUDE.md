# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Nano Banana Pro Playground**, an AI image generation and editing web application built with Next.js 16. The application uses Google's Gemini 3 Pro Image model via Vercel AI Gateway (@ai-sdk/gateway) to generate images from text prompts and edit/combine existing images.

## Development Commands

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run production server
pnpm start

# Lint code
pnpm lint
```

## Architecture

### Core Application Flow

1. **Client-Side Image Management**: The main `ImageCombiner` component (components/image-combiner/index.tsx) orchestrates:
   - Image uploads (file uploads or URL inputs, with HEIC conversion support)
   - Prompt management with textarea
   - Generation history with persistent storage (IndexedDB)
   - Global drag-and-drop, paste, and keyboard shortcuts

2. **API Route**: `/api/generate-image/route.ts` handles both modes:
   - `text-to-image`: Generates images from text prompts only
   - `image-editing`: Edits or combines 1-2 input images based on prompt
   - Uses Vercel AI Gateway to access Google's Gemini model
   - Returns base64-encoded images

3. **Custom Hooks** (components/image-combiner/hooks/):
   - `use-image-generation.ts`: Generation state, progress tracking, API calls
   - `use-image-upload.ts`: Handles file/URL uploads, HEIC conversion
   - `use-persistent-history.ts`: IndexedDB-based generation history
   - `use-aspect-ratio.ts`: Aspect ratio detection and management

### Key Components Structure

- `ImageCombiner` (index.tsx): Main orchestration component with resizable split view
- `InputSection`: Left panel with prompt textarea, image upload boxes, aspect ratio selector, generation history
- `OutputSection`: Right panel displaying generated images with action buttons
- `GenerationHistory`: Thumbnail grid of past generations with lazy loading
- `FullscreenViewer`: Modal for viewing images fullscreen with navigation

### State Management

- All state is managed via React hooks (useState) in the main `ImageCombiner` component
- Generation history persists in IndexedDB via `use-persistent-history` hook
- Image uploads support both File objects and external URLs
- Each generation has a unique ID and tracks status: loading/complete/error

### UI Components

Built with shadcn/ui (components/ui/) using Radix UI primitives and Tailwind CSS v4. The app uses:
- Dark theme with black background (#000000)
- Dithering shader effect via @paper-design/shaders-react
- Responsive design with mobile-first approach
- Geist and JetBrains Mono fonts

## Environment Variables

Required in `.env.local` or deployment environment:

```
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_api_key
```

The app checks for this key via `/api/check-api-key` route and displays a warning banner if missing.

## Important Implementation Details

### Image Handling
- Max file size: 10MB per image
- Supported formats: JPEG, PNG, WebP, GIF
- HEIC images are automatically converted client-side via `heic-to` library
- Images can be provided as File uploads or external URLs
- All generated images are returned as base64 data URLs

### Aspect Ratios
The app supports multiple aspect ratios that map to Gemini's supported formats:
- portrait (9:16), landscape (16:9), wide (21:9)
- square (1:1)
- 4:3, 3:4, 3:2, 2:3, 5:4, 4:5

### Generation Flow
1. User enters prompt and optionally uploads images
2. Frontend creates Generation object with loading state
3. API route receives FormData with mode, prompt, aspectRatio, and images
4. Vercel AI Gateway forwards request to Google Gemini
5. API returns base64 image
6. Frontend updates Generation to complete status and persists to IndexedDB
7. Success sound plays on completion

### Keyboard Shortcuts
- `Cmd/Ctrl + Enter`: Generate image (when in prompt textarea)
- `Cmd/Ctrl + C`: Copy generated image to clipboard
- `Cmd/Ctrl + D`: Download generated image
- `Cmd/Ctrl + U`: Load generated image as input
- `Escape`: Close fullscreen viewer
- Arrow keys: Navigate between images in fullscreen

### Global Interactions
- Paste images anywhere (not in text fields) to load into first available slot
- Paste image URLs to automatically detect and load them
- Drag and drop images anywhere to load them
- Click generated images to view fullscreen

## Path Aliases

TypeScript path aliases are configured via tsconfig.json:
- `@/*` maps to project root
- Common imports: `@/components`, `@/hooks`, `@/lib`

## Build Configuration

- Next.js 16 with App Router (React 19)
- TypeScript with strict mode
- ESLint and TypeScript errors ignored during builds (next.config.mjs)
- Image optimization disabled (unoptimized: true)
- Tailwind CSS v4 with PostCSS
- Package manager: pnpm

## Testing the Application

To test image generation:
1. Ensure `AI_GATEWAY_API_KEY` is set in environment
2. Run `pnpm dev`
3. Enter a text prompt and click Generate (text-to-image mode)
4. Upload 1-2 images and add prompt to edit/combine (image-editing mode)
