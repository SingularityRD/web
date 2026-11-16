# Singularity website (www.singularityrd.com)

Static site, no build step. Vercel deploys `main` to www.singularityrd.com within minutes.
**This repository is public, and Vercel serves every file in it** except what `.vercelignore`
lists. Nothing confidential may ever be committed: no sales or investor decks, no prices,
revenue, valuation or fundraising figures, no customer or pilot names, no roadmap.

## Working with the founder (Anıl)
- He writes casual Turkish; answer in Turkish. All site copy is English.
- The bar is "god tier": a top-tier lab's site, inspired by https://0.security/ but never a copy.
- Copy is short and clear. A visitor should understand fast and want to buy.
- Sell with story, not feature lists: scenes, before/after, outcomes. Full feature lists may
  exist, but folded away. He rejected bullet lists of features on the homepage cards.
- Paintings (`art.js`) are never shown being drawn. They appear finished and then live
  (drifting clouds, swaying beam, turning corona, lights).
- For big passes: homepage story first, then the inner pages. He likes independent
  subagent review passes on big changes.
- Work on a `claude/*` branch and push it. He opens and merges the PR himself (the
  GitHub CLI may not be installed). Commit or push only when he asks.

## What the site says (rules he set)
- Hero: "We hack governments. Then we secure them." Always say it is done with authorization.
- Proof numbers: software they secured runs on 5B+ devices and is used by 1B+ people (his call).
- Portfolio: the Singularity Foundation Models (Cyber, Frontier, Frontier Cyber) and seven
  products: AutoSecOps, AIDR, IT Ops, Breakpoint, Fennec, Sonar, RoboDR. Other products
  exist but stay off the site until he decides.
- Only AutoSecOps, AIDR, IT Ops and Breakpoint run on the model. Never write that all seven do.
- Benchmarks are internal measurements and are labelled that way. Do not add new reference
  models or benchmarks without him.
- Artificial Analysis card: paid closed models only (Claude Opus, Sonnet, Haiku; GPT Sol,
  Astra, Terra), each at **medium** reasoning effort, Intelligence Index **v5**, Singularity
  at 44 (his internal estimate, labelled "not listed by Artificial Analysis"). Before
  changing it, re-read the live leaderboard and use the current model versions.
- AutoSecOps: 2,000+ integrations; a workflow platform for every team (IT, finance, RevOps,
  people, legal, engineering). Do not name competing workflow platforms in copy.
- AIDR must match its decks: kernel-level checking is a Linux preview; named agents are
  Claude Code, Codex, OpenCode and OpenClaw plus MCP tools; Cursor and VS Code Copilot are
  preview. No "any agent", "no code changes" or agent frameworks the decks do not name.
- RoboDR: rules limit dangerous commands automatically; pausing the robot, a safe state or
  a rollback needs two people. It is not a safety-rated component.
- Product pages explain what each product does end to end, but nothing a competitor could
  steal: no architecture, component names, model details or sizes, prices, counts, customers.
  Depth is offered as a technical brief under NDA.
- Legal entities: Singularity Research and Development Inc. (Delaware, US); Singularity Arge
  Siber Güvenlik ve Yapay Zeka Teknoloji A.Ş. (Türkiye); Singularity Korea (South Korea).
- SEO/GEO: canonical host is www; JSON-LD on every page; the homepage FAQPage mirrors the
  visible FAQ; `llms.txt`, `robots.txt` and `sitemap.xml` are kept current. His SEO/GEO
  strategy doc: https://claude.ai/artifact/AfQsdqWLa2r8g7jRAvx3UM

## Code map
- `index.html`, `home.css`, `home.js`: homepage (and shared styles/scripts for product pages).
- `product.css`: product pages. `chrome.css`: header for blog and customer pages.
- `art.js`: generative paintings. Each scene paints back to front; `p.layer({...})` puts
  what follows on a moving sheet (drift, rise, sway, breathe, spin, flash, animated in
  `home.css`); `p.fx(...)` adds live lights. `world` is the footer panorama.
- The eight product pages are **generated**: edit `tools/pages/*` and run
  `node tools/build-pages.js .`, never edit `aidr.html` etc. by hand. See `tools/README.md`.

## Checking work
- `node tools/check-links.js .` after any change (links, anchors, ids, JSON-LD, paintings).
- Preview server: `.claude/launch.json` (`python -m http.server 4321`).
- Screenshots: `tools/shot.ps1` (headless Edge) and `tools/slice.ps1`; `tools/viewer.html`
  for lower sections or phone width; `tools/gallery.html` shows every painting at once.
- In the Bash tool, heredocs with an apostrophe fail; write scripts to files instead.
