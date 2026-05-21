# Theme & Design System

## Brand Colors
- Peacock Blue: `#0F3057`, Teal: `#008080`, Royal Purple: `#4B0082`, White
- Accent gradient: `from-[#008080] to-[#4B0082]`

## CSS Stack
- Tailwind CSS v4 via `@tailwindcss/vite` plugin (no tailwind.config.js)
- Theme via CSS custom properties in `src/styles/theme.css`
- Animations via `tw-animate-css` + Framer Motion (`motion/react` v12)

## Files
- `src/styles/index.css` — imports fonts.css, tailwind.css, theme.css
- `src/styles/tailwind.css` — `@import 'tailwindcss' source(none); @source '../**/*.{js,ts,jsx,tsx}'; @import 'tw-animate-css';`
- `src/styles/theme.css` — Full CSS variable definitions for light/dark themes + @theme inline mapping
- Theme provider: `next-themes` with `attribute="class"` defaultTheme="light"

## Key CSS Variables (Light)
- `--background: #ffffff`, `--foreground: oklch(0.145 0 0)`
- `--card: #ffffff`, `--primary: #030213`, `--muted: #ececf0`
- `--border: rgba(0, 0, 0, 0.1)`, `--radius: 0.625rem`

## Key CSS Variables (Dark)
- `--background: oklch(0.145 0 0)`, `--foreground: oklch(0.985 0 0)`
- `--card: oklch(0.145 0 0)`, `--primary: oklch(0.985 0 0)`

## Vite Config
- React plugin + Tailwind CSS v4 plugin
- Alias: `@` → `./src`
