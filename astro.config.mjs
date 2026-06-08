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
		remarkPlugins: [remarkGfm],
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
			head: [
				// Click-to-zoom for Mermaid diagrams (readability for dense diagrams).
				{ tag: 'script', attrs: { src: `${base}/mermaid-zoom.js`, defer: true } },
			],
			customCss: ['./src/styles/global.css'],
			// Sidebar = Modules 0–6. Module 0 is the syllabus home (index.mdx);
			// Modules 1–6 autogenerate from their directories by frontmatter sidebar.order.
			sidebar: [
				{ label: 'Module 0 · Course Overview', link: '/' },
				{ label: 'Module 1 · Foundations', collapsed: true, items: [{ autogenerate: { directory: 'module-1' } }] },
				{ label: 'Module 2 · Core Concepts & Trade-offs', collapsed: true, items: [{ autogenerate: { directory: 'module-2' } }] },
				{ label: 'Module 3 · System Building Blocks', collapsed: true, items: [{ autogenerate: { directory: 'module-3' } }] },
				{ label: 'Module 4 · RESHADED Walkthrough', collapsed: true, items: [{ autogenerate: { directory: 'module-4' } }] },
				{ label: 'Module 5 · System Design Problems', collapsed: true, items: [{ autogenerate: { directory: 'module-5' } }] },
				{ label: 'Module 6 · Capstone & Rubric', collapsed: true, items: [{ autogenerate: { directory: 'module-6' } }] },
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
