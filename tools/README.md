# Tools

Everything needed to rebuild and check the site. Nothing in this folder is deployed
(`.vercelignore`), but the repository is public: keep confidential material out.

## Product pages
The eight product pages (`autosecops.html`, `aidr.html`, `it-ops.html`, `breakpoint.html`,
`fennec.html`, `sonar.html`, `robodr.html`, `foundation-models.html`) are generated.

```
node tools/build-pages.js .
node tools/check-links.js .
```

Sources, per product, in `tools/pages/`:

| File | What it holds |
| --- | --- |
| `<slug>.json` | `<title>`, meta description, name, "built for" and "works with" chips |
| `<slug>.story.json` | the page itself: hook, stake, scene (without / with), chapters, before and after, limits, pilot, objections (also the FAQ JSON-LD), close |
| `<slug>.caps.json` | the full feature list and spec table, shown folded at the bottom and used as JSON-LD `featureList` |
| `<slug>.extra.html` | live demos inserted after the scene (AutoSecOps and AIDR only) |

`tools/art/world.html` is the footer panorama block shared by all generated pages
(the homepage has the same block inline).

## Briefs for writing content
`tools/pages/STORY.md` (story copy), `CAPS.md` (feature lists) and `BRIEF.md` (page meta)
are the briefs used to write the content from the sales decks, with the confidentiality
and style rules. The decks themselves are **not** in the repository. To work from them,
extract their text locally into `tools/decks/` (git-ignored), for example:

```
"C:\Program Files\Git\ucrt64\bin\pdftotext.exe" -layout -enc UTF-8 deck.pdf tools/decks/deck.txt
```

## Visual checks (Windows)
- Start the preview server from `.claude/launch.json` (port 4321).
- `.\tools\shot.ps1 -Url http://localhost:4321/index.html -Name home -W 1440 -H 9000`
  then `.\tools\slice.ps1 -Name home` to cut it into readable slices (`tools/shots/`).
- Lower sections or phone width: open `tools/viewer.html?p=index.html&w=390&h=15000&y=0`
  in the screenshot script (the page sits in a tall iframe, offset by `y`).
- `tools/gallery.html` paints every scene at once; `tools/og.html` renders the social card
  (save it as `assets/og-cover.png`, 1200×630).
