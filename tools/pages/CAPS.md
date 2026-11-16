# Brief: full feature lists for the product pages

## Goal
The founder wants every important product feature from the sales decks on the website, so a buyer can see the full feature set of each product. Each product page (generated from `pages/<slug>.json`) already has a short story: problem, how it works, six highlights, who it is for, control, FAQ. We are adding one new section per product, "Everything in <Product>": a grouped feature list plus a small spec table. We also need three headline features per product for its card on the homepage.

You write content only, as JSON. Do not edit the site files directly.

## Inputs
- Deck text files (extracted from PDFs) in `tools/decks/` (deck text, kept local only: never commit it). Read every deck file named for your product, start to end. Feature lists, module slides, comparison tables and appendix slides are the richest parts.
- The page's current content: `tools/pages/<slug>.json`. Your list may restate a core feature briefly for completeness, but do not copy its sentences.
- For AutoSecOps and AIDR, the page also shows the live demos in `tools/pages/<slug>.extra.html`. Skim it so you know what is already shown.

## Include (be complete)
Every customer-facing capability in the decks: modules, what it detects or covers, response actions (by kind), AI features, reporting and outputs, supported platforms / operating systems / protocols / language families / environments, integrations and integration categories the deck names, deployment options, compliance frameworks and regulations it produces evidence for, access control and admin (SSO, roles, audit log), human-approval controls, data handling (what stays on site). If the deck lists 30 real capabilities, the page should show about 30.

## Leave out (competitors read this page)
- How it is built: architecture, internal component or service names, algorithms, detection logic, rule or policy formats, data schemas, thresholds.
- AI model names, sizes, training details.
- Prices, tiers, licence or deal terms, ROI figures tied to a customer.
- Customer, pilot or partner names, internal metrics, benchmark methods, competitor benchmark numbers.
- Roadmap, "planned", "coming soon", "Q3" items. Items the deck marks preview or beta: include only if offered today, and end the item with " (preview)". Items the deck marks not live: leave out.
- Exact counts of rules, detections, tools or actions. The one allowed count: AutoSecOps has 2,000+ integrations.
- Do not name competitor products or models, except the benchmark models already shown on the site.

## Facts and style
- Every item must come from the deck files (or, for the models, from the sources named in your task). Do not invent capabilities, integrations, standards or certifications. "Supports evidence for ISO 27001" is fine if the deck says so; never claim the product or Singularity is certified unless the deck says so.
- Plain English for a buyer (CISO, IT manager, plant manager). Short noun phrases or short clauses, sentence case, US spelling, no trailing period, no hype words (revolutionary, seamless, cutting-edge, unleash, game-changing, best-in-class). Spell out an acronym the first time only if a non-specialist would not know it, e.g. "Software bill of materials (SBOM)".

## Output
Write `tools/pages/<slug>.caps.json`, UTF-8, valid JSON, this shape:

```json
{
  "slug": "sonar",
  "title": "Everything in Sonar",
  "sub": "One sentence, at most 20 words, that frames the list.",
  "groups": [
    { "h": "At most 4 words", "items": ["At most 12 words", "..."] }
  ],
  "specs": [
    { "k": "At most 3 words", "v": "At most 16 words" }
  ],
  "top": ["At most 6 words", "At most 6 words", "At most 6 words"],
  "gaps": ["At most 30 words each"]
}
```
- `groups`: 4 to 8 groups, 3 to 8 items each, 20 to 48 items in total. Order groups the way a buyer thinks: what it sees, what it does, AI, outputs, integrations, deployment and control.
- `specs`: 4 to 6 rows of plain facts, for example Deployment, Works with, Platforms, Evidence for, Access control, Data.
- `top`: the three features that sell the product, for its homepage card.
- `gaps`: important deck points the current page misses that are not features (a key differentiator, a regulation, a buyer worry). Empty list if none.

Validate with `node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" <file>`, then re-read the file once against "Leave out".

## Report back (under 150 words)
Files written, item counts, what you left out on purpose, and any item you were unsure about.
