# Marouane Benabdelkader — Portfolio

**Live site: [marouanebenabdelkader.github.io](https://marouanebenabdelkader.github.io)**

Personal portfolio of a full stack AI engineer working on agentic systems, NLP and computer vision. It presents freelance case studies (AI agents, RAG systems, automation pipelines), professional experience, skills and education, in English and French.

## Features

- Bilingual: `/en/` and `/fr/` routes. The language switch keeps you on the same page, and `/` redirects based on the browser language
- Light and dark themes that follow the system setting, with a manual toggle
- One case-study page per project, each with an architecture diagram
- A 3D book at `/en/book/` and `/fr/book/`: one project per spread, with pages that curl as they turn (React Three Fiber). Illustrations and cover art were generated with Nano Banana Pro (Gemini)
- Fully static export hosted on GitHub Pages

## Tech stack

Next.js 15 (App Router, `output: "export"`), React 19, TypeScript and Tailwind CSS v4, with three.js / React Three Fiber for the book, deployed with GitHub Actions.

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export to out/
npm run verify   # checks the export: pages, language links, no confidential names
npm run check    # type-check + bilingual content check
```

## Editing content

All text lives in `content/`:

| File | Contents |
|---|---|
| `profile.ts` | Profile, experience, education, skills, personal project |
| `projects.ts` | Freelance case studies |
| `diagrams.ts` | Architecture diagram for each case study |
| `ui.ts` | Interface strings |
| `book.ts` | Strings for the 3D book (its pages are drawn from `projects.ts` and `profile.ts`) |

Every text field has an `en` and a `fr` version. Pushing to `main` builds and deploys the site automatically.

## Contact

- Email: [benabdelkader.marouane@proton.me](mailto:benabdelkader.marouane@proton.me)
- LinkedIn: [marouanebenabdelkader](https://www.linkedin.com/in/marouanebenabdelkader/)
