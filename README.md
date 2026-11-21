# Leonida Platinum Log

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/rivan122/makefun-gta6-trophy-guide-v2c/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/rivan122/makefun-gta6-trophy-guide-v2c/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI,
built for the [make.fun GTA 6 trophy guide bounty](https://make.fun/c/gta6-trophy-guide-01).

**Entry title:** "Leonida Platinum Log — 55 trophies · 25 disputes shown both ways ·
16 count trackers · 6-stage roadmap · 63 pages across 22 sites · spoiler shield,
export/import". Every count in that title is computed from the guide's own data file,
`app/data/trophies.json`, not typed in by hand-waving.

**What it is:** all 55 trophies with their official names, descriptions and grades
(1 platinum, 2 gold, 6 silver, 46 bronze), each with a guide written in this entry's
own words and a sources line naming the published guides behind it. 25 trophies carry
a dispute panel that shows both versions where the published guides disagree, plus
this log's call on which to follow. 16 count trackers cover the long grinds — 250
stunts, 42 shooting-range golds, 100 WAiNK spots, 100 vehicles, $250,000 laundered,
$100,000 spent and more — with steppers, a progress bar and automatic tick-off at the
target. A 6-stage roadmap orders the run from story to platinum. Missable coverage:
1 possibly missable trophy (meditations), 8 at risk (the one-time story missions plus
the VCIA departure and the Rhino encounter) and 3 still unconfirmed — each flagged
with when it can be missed and what protects you. Kind filters (story, missable,
collectibles, activities, online), grade filters, full-text search, a spoiler shield
that hides unearned story trophies' names and descriptions, and progress saved in
localStorage with export to a file and import back. It all works offline: the app
loads only its own files and uses no Rockstar logos or artwork.

**Run it:** serve `app/` with any static server (`node serve.ts`, then open
http://localhost:8080) and open `app/index.html` in desktop Chrome.

**Hand it in:** `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` copies the
app and screenshots to `out/` and writes `out/dossier.json` there.
