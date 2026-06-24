// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import mermaid from 'astro-mermaid';
import tailwindcss from '@tailwindcss/vite';
import remarkGfm from 'remark-gfm';

// https://astro.build/config

// Deployed to GitHub Pages as a PROJECT page → https://hkrathore.github.io/sysdesign-course/
// A project page is served under /<repo>/, so Astro needs `base`. Astro auto-prefixes
// bundled assets and Starlight links, but the public/ mermaid-zoom.js script is referenced
// by an absolute URL in `head`, so it must include `base` explicitly or it 404s in prod.
const base = '/sysdesign-course';

export default defineConfig({
	site: 'https://hkrathore.github.io',
	base,
	// GFM (tables, strikethrough, task lists) for BOTH .md and .mdx. Astro's
	// built-in `gfm` shorthand is applied to .md but does NOT propagate to MDX
	// via extendMarkdownConfig — so .mdx lesson tables render as raw "| ... |"
	// text unless remark-gfm is added explicitly to remarkPlugins (which IS
	// inherited by MDX). This is the single fix for all 12 widget (.mdx) lessons.
	markdown: {
		// singleTilde:false so a bare `~` (used throughout as "approximately", e.g.
		// `~10-30%`) renders literally instead of being parsed as GFM strikethrough.
		// With singleTilde on (the default), two `~` pair up and strike through the
		// span between them (phantom strike-out, most visible in the dense cheat
		// sheets). We use no intentional `~~` strikethrough anywhere, so only `~~`
		// staying as strikethrough costs us nothing.
		remarkPlugins: [[remarkGfm, { singleTilde: false }]],
	},
	integrations: [
		// astro-mermaid MUST be registered BEFORE starlight so its rehype step
		// processes ```mermaid blocks before Starlight's expressive-code grabs them.
		mermaid({
			theme: 'neutral',
			autoTheme: true, // follow Starlight's light/dark mode
		}),
		starlight({
			title: 'Modern System Design Interview',
			description:
				'Director-altitude system-design interview prep, built on the RESHADED framework.',
			// "On this page" right-hand table-of-contents disabled site-wide; reclaims reading
			// width (paired with a wider --sl-content-width in global.css so wide trade-off
			// tables fit the reading column instead of overflowing it).
			tableOfContents: false,
			head: [
				// Click-to-zoom for Mermaid diagrams (readability for dense diagrams).
				{ tag: 'script', attrs: { src: `${base}/mermaid-zoom.js`, defer: true } },
			],
			customCss: ['./src/styles/global.css'],
			// Sidebar = 13 modules grouped into 5 Parts (the learning sequence), plus the
			// course-overview home (index.md) and the Cheat Sheets. Lessons autogenerate from
			// each module directory by frontmatter sidebar.order. Module numbers are presentation
			// only — cross-references were removed so the order can change without breaking links.
			sidebar: [
				{ label: 'Course Overview', link: '/' },
				{ label: 'Part I · Method & Fundamentals', collapsed: false, items: [
					{ label: 'Module 1 · Foundations', collapsed: true, items: [{ autogenerate: { directory: 'module-1' } }] },
					{ label: 'Module 2 · Core Concepts & Trade-offs', collapsed: true, items: [{ autogenerate: { directory: 'module-2' } }] },
					{ label: 'Module 3 · System Building Blocks', collapsed: true, items: [{ autogenerate: { directory: 'module-3' } }] },
				] },
				{ label: 'Part II · Design Problems', collapsed: false, items: [
					{ label: 'Module 4 · System-Design Problems', collapsed: true, items: [{ autogenerate: { directory: 'module-4' } }] },
					{ label: 'Module 5 · Business-Domain Problems', collapsed: true, items: [{ autogenerate: { directory: 'module-5' } }] },
				] },
				{ label: 'Part III · Specialized Design Tracks', collapsed: false, items: [
					{ label: 'Module 6 · LLD & OOD Curveballs', collapsed: true, items: [{ autogenerate: { directory: 'module-6' } }] },
					{ label: 'Module 7 · Data Platform Foundations', collapsed: true, items: [{ autogenerate: { directory: 'module-7' } }] },
					{ label: 'Module 8 · Data Platform Problems', collapsed: true, items: [{ autogenerate: { directory: 'module-8' } }] },
					{ label: 'Module 9 · Gen AI & Agentic Foundations', collapsed: true, items: [{ autogenerate: { directory: 'module-9' } }] },
					{ label: 'Module 10 · Gen AI & Agentic Problems', collapsed: true, items: [{ autogenerate: { directory: 'module-10' } }] },
				] },
				{ label: 'Part IV · Engineering Excellence & Operations', collapsed: false, items: [
					{ label: 'Module 11 · Security, Privacy & Trust', collapsed: true, items: [{ autogenerate: { directory: 'module-11' } }] },
					{ label: 'Module 12 · Testing & Quality Engineering', collapsed: true, items: [{ autogenerate: { directory: 'module-12' } }] },
					{ label: 'Module 13 · Production Troubleshooting & Incident Response', collapsed: true, items: [{ autogenerate: { directory: 'module-13' } }] },
				] },
				{ label: 'Part V · Strategy & Leadership', collapsed: false, items: [
					{ label: 'Module 14 · Architecture & Org Strategy', collapsed: true, items: [{ autogenerate: { directory: 'module-14' } }] },
					{ label: 'Module 15 · Leadership Track', collapsed: true, items: [{ autogenerate: { directory: 'module-15' } }] },
				] },
				{ label: 'Part VI · Capstone', collapsed: false, items: [
					{ label: 'Module 16 · Capstone & Rubric', collapsed: true, items: [{ autogenerate: { directory: 'module-16' } }] },
				] },
				{ label: 'Cheat Sheets', collapsed: true, items: [{ autogenerate: { directory: 'cheatsheets' } }] },
			],
		}),
		react(),
	],
	vite: {
		// '@components/...' → src/components/... (matches CLAUDE.md §7 widget imports).
		// Done via Vite alias rather than tsconfig paths to avoid the Rolldown resolver conflict.
		resolve: {
			alias: {
				'@components': fileURLToPath(new URL('./src/components', import.meta.url)),
			},
		},
		plugins: [tailwindcss()],
	},
});
