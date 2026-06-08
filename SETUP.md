# SETUP — Stand up the course site & hand off to Claude Code

This guide takes you from the bundled content to a running site, then to generating the remaining modules with Claude Code. Pair it with `CLAUDE.md` (the generation spec).

---

## 1. Recommended stack (and why)

**Astro + Starlight + MDX + React islands + Tailwind + Mermaid.**

- **Starlight** gives you the course chrome for free: auto sidebar/nav from the file tree, full-text search, dark mode, mobile layout. For a 6-module / ~40-lesson course that's exactly what you don't want to hand-build.
- **MDX** lets a lesson be markdown prose *and* import a React widget inline — the core requirement. `<EstimationCalculator client:load />` drops a live widget into the page.
- **React islands**: the widgets we've already built are React + Tailwind; they hydrate only where used, so the content pages stay fast.
- **Mermaid** renders the architecture diagrams already embedded in the lessons.

**Alternatives** (pick one and stay with it):
- *Docusaurus* — heavier, all-React, batteries-included docs/course platform. Great if you prefer everything in React; Tailwind needs a little wiring against its Infima theme.
- *Vite + React + Tailwind + MDX (+ react-router)* — maximum control, fewest deps, but you build nav/search yourself.

> **Version churn warning:** Astro/Starlight/Tailwind/Mermaid integrations change often and my training has a cutoff. Have Claude Code pull **current** setup steps from the Context7 MCP (already in your connectors) or the official docs before scaffolding. Treat any exact command below as approximate.

---

## 2. Target repo structure

```
sysdesign-course/
  CLAUDE.md                        # generation spec (in this bundle)
  astro.config.mjs                 # Starlight + MDX + Mermaid; sidebar config
  package.json
  src/
    content/docs/
      index.mdx                    # Module 0 home (syllabus + progress tracker)
      module-1/
        lesson-1-1.mdx ... 1-5.mdx
      module-2/
        lesson-2-1.mdx ...
      cheatsheets/
        module-1.mdx
    components/widgets/
      EstimationCalculator.jsx     # from bundle
      LatencyVisualizer.jsx        # from bundle
      (ShardingVisualizer.jsx, ConsistentHashingRing.jsx, ... as built)
```

---

## 3. Bootstrap — Claude Code session #1 (scaffold)

Drop `CLAUDE.md` and the bundled `content/` into an empty repo, then give Claude Code roughly this:

> "Read CLAUDE.md. Scaffold an Astro + Starlight site with MDX, Tailwind, and Mermaid support — verify the current setup steps via Context7 first. Create the `src/content/docs` tree and `src/components/widgets` folder per CLAUDE.md §7. Configure the Starlight sidebar for Modules 0–6 with the lesson list in CLAUDE.md §9. Then stop so I can migrate content."

---

## 4. Migrate the already-generated content

The bundle contains the raw lessons and widgets. Mapping:

| Bundled file | → Repo path | Transform |
|---|---|---|
| `Module_0_Syllabus.md` | `src/content/docs/index.mdx` | add frontmatter (`title`, `sidebar.order: 0`); keep tracker |
| `Module_1_Lessons_1.1-1.3.md` | split into `module-1/lesson-1-1.mdx … 1-3.mdx` | add frontmatter; in 1-3 import + embed `EstimationCalculator` |
| `Module_1_Lessons_1.4-1.5.md` | `module-1/lesson-1-4.mdx`, `1-5.mdx` | in 1-4 import + embed `LatencyVisualizer` |
| `Module_1_CheatSheet.md` | `cheatsheets/module-1.mdx` | add frontmatter |
| `Module_2_Lessons_2.1-2.2.md` | `module-2/lesson-2-1.mdx`, `2-2.mdx` | add frontmatter |
| `Module_2_Lessons_2.3-2.4.md` | `module-2/lesson-2-3.mdx`, `2-4.mdx` | add frontmatter |
| `EstimationCalculator.jsx` | `src/components/widgets/` | none |
| `LatencyVisualizer.jsx` | `src/components/widgets/` | none |

Transforms in plain terms: (1) split the multi-lesson `.md` files at each `# Lesson` heading into one `.mdx` per lesson; (2) prepend Starlight frontmatter; (3) where a lesson references a widget, add the `import` and the `<Widget client:load />` tag at the marked spot; (4) the Mermaid ```mermaid blocks already in the prose render once the mermaid integration is on — no change needed.

Claude Code prompt:

> "Migrate the files in `/content-bundle` into the repo per SETUP §4. Split the multi-lesson markdown into one MDX per lesson, add Starlight frontmatter (title + sidebar order), and embed `EstimationCalculator` in lesson 1.3 and `LatencyVisualizer` in lesson 1.4. Run the dev server and confirm every page renders, diagrams draw, and widgets hydrate."

---

## 5. Generate the remaining modules (the loop)

Per chunk (one or two lessons at a time keeps quality high), prompt Claude Code:

> "Following CLAUDE.md, generate Module 2 lessons 2.5 and 2.6. Build the **Sharding/partitioning visualizer** (range/hash/directory with hot-spotting) and the **Consistent Hashing ring** (add/remove nodes → live key remap) as self-contained widgets matching the style of the existing two, embed them, add Mermaid diagrams, register the pages in the sidebar, and verify the build. Match the voice and depth of lessons 2.3–2.4."

Repeat down the §9 work list: finish Module 2, then Module 3 (16 building blocks), Module 4 (RESHADED warm-up), Module 5 (16 problems, each structured as the 8 named RESHADED steps), Module 6 (capstone + rubric), then the per-module cheat sheets and the Master RESHADED cheat sheet.

Tips:
- Generate in small batches; review for altitude (§2) before committing.
- Have Claude Code read the two newest lessons before writing, so voice doesn't drift.
- Commit per lesson; one module per branch if you want clean review.

---

## 6. Run & deploy

```
npm install
npm run dev        # local preview
npm run build      # static output in ./dist
```

Deploy the static build to Netlify, Vercel, Cloudflare Pages, or GitHub Pages — all serve Astro output directly. For a private study site, Netlify/Vercel password protection or Cloudflare Access is enough.

---

## 7. Why this division of labor

- **Claude Code** is strong at the mechanical, repetitive work this needs: scaffolding, splitting files, wiring imports, registering sidebar entries, building widget variants, running the dev server, fixing build errors — and it can pull current framework docs via Context7.
- **CLAUDE.md** carries the part that's easy to lose at volume: the Director-altitude framing, the pedagogy contract, the "trade-off + rejected alternative" rule. Keep it open; if a generated lesson drifts toward IC-trivia depth or unquantified hand-waving, point Claude Code back at §2 and §4.
