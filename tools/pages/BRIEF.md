# Product page content brief

You write the CONTENT for product subpages of the Singularity website, as JSON files. A script turns each JSON file into a finished HTML page, so you never write HTML or CSS. Do not edit the site files directly.

## Who reads the page
A buyer: a CISO, an IT manager, a plant manager, a head of robotics. They should understand the product in 60 seconds and want a demo. Plain English. Short sentences. Explain any term a non-specialist would not know. No hype words (no "revolutionary", "cutting-edge", "seamless", "unleash", "game-changing").

## The confidentiality rule (most important)
Competitors will read this page. Say WHAT the product does, WHO it is for and WHAT the customer gets. Never say HOW it is built.

Leave out, even if the deck has it:
- architecture, internal components and their names, algorithms, detection rules or logic, data schemas, file formats, policy or prompt formats
- which AI models are used, model sizes, training details
- exact counts of integrations, actions, rules or tools; version numbers; roadmap; anything "coming soon"
- prices, price ranges, licence tiers, deal terms
- customer names, pilot names, internal metrics, benchmark methodology, competitor benchmark numbers
- anything that reads like the secret sauce
When in doubt, leave it out. Depth is offered on the page through a "request the technical brief" button instead.

## Facts
- Every factual claim must come from the deck text files you are given or from the homepage `index.html`. Do not invent numbers, customers, certifications, standards or integrations.
- A third-party statistic may be used only if the deck cites its source. Then name the source and year in the text itself.
- Company facts you may use: Singularity is a frontier AI security lab; AutoSecOps, AIDR, IT Ops and Breakpoint can run on its own Singularity Foundation Models (Fennec, Sonar and RoboDR do not use the model); products run in the cloud, on-premises or fully air-gapped; risky actions wait for a person's approval; vulnerability research credited by AWS, Google, Oracle, Intel and NASA.
- The seven products are AutoSecOps, AIDR, IT Ops, Breakpoint, Fennec, Sonar and RoboDR. You may mention how your product works with another one only if the deck or homepage says so.

## Output
For each product, write one file: `tools/pages/<slug>.json`, UTF-8, valid JSON, exactly this shape and within these limits:

```json
{
  "slug": "it-ops",
  "name": "IT Ops",
  "title": "≤ 60 characters. Product name + what it is + ' | Singularity'",
  "description": "≤ 155 characters. One or two plain sentences for search results.",
  "kicker": "≤ 5 words. The category, e.g. 'AI on-call engineer'",
  "h1": "≤ 9 words. The promise, not the product name.",
  "lede": "≤ 32 words. What it is and what the customer gets.",
  "stat": { "value": "e.g. 42 days", "label": "≤ 18 words", "source": "Source name, year" },
  "problem": { "title": "≤ 8 words", "items": [ { "h": "≤ 5 words", "p": "≤ 24 words" } ] },
  "steps":   { "title": "≤ 8 words", "items": [ { "h": "≤ 3 words", "p": "≤ 22 words" } ] },
  "features":{ "title": "≤ 8 words", "items": [ { "h": "≤ 5 words", "p": "≤ 20 words" } ] },
  "fit":     { "title": "≤ 8 words", "who": ["4 to 6 short labels"], "works": ["up to 8 names the deck or homepage states publicly, or an empty list"] },
  "control": { "title": "≤ 8 words", "items": [ { "h": "≤ 5 words", "p": "≤ 22 words" } ] },
  "faq": [ { "q": "≤ 12 words", "a": "≤ 45 words, written so an AI answer engine can quote it; name the product in the answer" } ],
  "cta": { "h": "≤ 8 words", "p": "≤ 24 words" }
}
```
Counts: `problem.items` exactly 3, `steps.items` 3 or 4, `features.items` exactly 6, `control.items` exactly 3, `faq` exactly 5. `stat` is optional: include it only if the deck has one strong sourced number; otherwise omit the key.

Use straight facts in the FAQ: what it is, who it is for, how it differs from the obvious alternative, whether it runs on-premises or air-gapped, how people stay in control.

After writing, validate each file with `node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" <file>` and re-read it once against the confidentiality rule.

## Report back (under 120 words)
The files you wrote, and anything you left out on purpose or were unsure about.
