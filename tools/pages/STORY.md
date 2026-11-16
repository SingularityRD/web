# Brief: product pages that sell (a story, not a feature list)

## Why
The founder read the product pages and said they read like "it has these features". He wants a buyer to read the page and want to buy. Everything important in the sales decks must still be told, but through story and sales structure, not as a list.

You write content only, as JSON. A generator turns it into the page. Do not edit the site files directly.

## Reader
A buyer with a budget: a CISO, an IT director, a plant manager, a head of robotics, a CTO. They read the headlines first and decide in two minutes whether to book a demo. Reading only your headlines, top to bottom, must tell the whole pitch.

## Inputs (paths are relative to the repository root)
- Deck text files: `tools/decks/` (deck text, kept local only: never commit it). Read every deck for your product from start to end. Demo scenarios, before/after tables, objection slides, "what it does not do" slides and pilot slides are the richest parts for this job.
- `tools/pages/<slug>.json`: the current page copy. You may keep its hook if it is already strong.
- `tools/pages/<slug>.caps.json`: the full feature list already extracted from the decks. Use it as your checklist: every important capability in it must show up somewhere in your story (mostly as proof points under a chapter).
- `tools/pages/CAPS.md`: read its "Leave out" and "Facts and style" sections. Those confidentiality and fact rules apply here unchanged.

## The page, in the order the reader meets it
1. **hook**: the promise, in the buyer's words.
2. **stake**: one sourced number that makes the problem real. Optional: only if the deck cites a source.
3. **scene**: one concrete incident told twice, side by side, on the same clock: without the product, then with it. This is where the reader feels the difference. Pick the kind of incident the deck itself demonstrates. Present tense. Roles, not names ("the on-call engineer", "a contractor's laptop"). No customer names. Every "with" beat must be something the deck says the product does.
4. **chapters**: 4 to 6. Each headline is a claim the buyer cares about (an outcome), never a feature name. Each paragraph moves from the buyer's situation, to what the product does, to what they get. Under it, 3 to 5 short proof points that name concrete capabilities from the deck. Across all chapters, every important capability in the deck appears at least once.
5. **shift**: a before/after table, 3 to 5 rows. A row needs both sides to be true: use the deck's own before/after figures where it has them, otherwise plain statements with no invented numbers.
6. **limits**: "What <product> will not do." 2 to 4 honest limits the deck states (for example: never acts without approval, does not replace a certified pentest, does not decode encrypted traffic). Security buyers trust a vendor that says where the product stops.
7. **pilot**: how a customer starts, 3 or 4 steps, from the deck's pilot or onboarding slides. No prices or fees.
8. **objections**: exactly 5 questions the buyer will really ask, phrased the way they would say them, answered straight. Always include: what the product is; whether it runs on-premises or air-gapped; how people stay in control. The other two are the biggest objections the deck answers. Each answer names the product and can be quoted on its own by an AI answer engine.
9. **close**: the last call to action.

## Voice
- Plain English. Short sentences. Active voice. Concrete nouns. Numbers only from the deck.
- Say what happens, not how impressive it is. No hype words: revolutionary, seamless, cutting-edge, unleash, game-changing, best-in-class, robust, leverage, empower, next-generation, world-class.
- No exclamation marks. No question headlines (questions belong in objections). US spelling. Sentence case.
- Explain a term a non-specialist would not know, the first time, in a few words.
- Do not write "X is not just A, it is B" constructions, and do not open sentences with "Imagine".

### Tone calibration (a made-up product, do not copy the content)
- Weak chapter headline: "Advanced correlation engine". Strong: "One incident instead of forty alerts".
- Weak paragraph: "Harbor offers real-time monitoring and automated remediation capabilities." Strong: "At 3 a.m. forty alerts fire for one broken disk. Harbor groups them into a single incident, names the disk and has the fix ready. Your engineer approves it from bed."
- Scene beat, without: {"t": "03:12", "p": "Forty alerts fire. The on-call engineer wakes up and opens five dashboards."} With: {"t": "03:12", "p": "Forty alerts fire. Harbor groups them into one incident and names the failing disk."}

## Output
Write `tools/pages/<slug>.story.json`, UTF-8, valid JSON, exactly this shape:

```json
{
  "slug": "sonar",
  "hook": { "kicker": "at most 5 words, the category", "h1": "at most 9 words", "lede": "at most 30 words" },
  "stake": { "value": "e.g. 4,484", "label": "at most 18 words", "source": "Source name, year" },
  "scene": {
    "title": "at most 8 words",
    "setup": "at most 28 words: where, when, what starts",
    "without": [ { "t": "03:12", "p": "at most 18 words" } ],
    "with": [ { "t": "03:12", "p": "at most 18 words" } ],
    "end": { "without": "at most 10 words: how it ends", "with": "at most 10 words: how it ends" }
  },
  "chapters": [
    { "tag": "at most 3 words", "h": "at most 9 words", "p": "at most 48 words", "points": ["at most 10 words each"] }
  ],
  "shift": { "title": "at most 8 words", "rows": [ { "k": "at most 4 words", "before": "at most 9 words", "after": "at most 9 words" } ] },
  "limits": { "title": "What <product> will not do", "items": [ { "h": "at most 6 words", "p": "at most 24 words" } ] },
  "pilot": { "title": "at most 8 words", "steps": [ { "h": "at most 4 words", "p": "at most 22 words" } ] },
  "objections": [ { "q": "at most 14 words", "a": "at most 48 words" } ],
  "close": { "h": "at most 8 words", "p": "at most 24 words" }
}
```
Counts: `scene.without` and `scene.with` have the same number of beats, 3 or 4, with matching times. `chapters` 4 to 6, each with 3 to 5 points. `shift.rows` 3 to 5. `limits.items` 2 to 4. `pilot.steps` 3 or 4. `objections` exactly 5. Omit `stake` if the deck has no sourced number.

Validate with `node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" <file>`. Then read your headlines alone, top to bottom: do they tell the pitch? Then re-read against the confidentiality rules.

## Report back (under 150 words)
Files written, which caps.json capabilities you could not fit, and any claim you were unsure about.
