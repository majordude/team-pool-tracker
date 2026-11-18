# Team Pool Tracker

**Free web app that schedules team pool matches and scores them table by table — built for a senior pool league, free for any league to use.**

[![Live site](https://img.shields.io/badge/Live-teampooltracker.com-blue)](https://teampooltracker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

<!-- SCREENSHOT GOES HERE — one picture of the app in action is worth
     more than everything below. Save it as docs/screenshot.png and
     remove this comment block.
     ![Team Pool Tracker](docs/screenshot.png) -->

## Why this exists

Running a team pool match on paper means lopsided pairings, arguments
about who sat out, and a score sheet nobody can read afterward. Team Pool
Tracker was built for a senior-center league in Pennsylvania to fix that:
fair pairings from whoever shows up, scoring table by table, and a printed
record at the end. It runs on a phone, costs nothing, and needs no account.

**Try it live: https://teampooltracker.com**

## What it does

- Builds fair pairings from whoever shows up — from 4 players to 15 or more
- Handles late arrivals, locked pairs, swaps, and dropped games when running behind
- Per-table scoring with a pace line (On pace, Ahead, Running behind)
- Prints a blank score sheet and a match record
- Manager-only team stats behind a PIN
- Works offline after the first visit (installable web app)
- No account, no tracking — all data stays on the phone

## Who it's for

- Senior-center and community pool leagues
- Bars, clubs, and rec leagues running team matches
- Anyone who schedules team games and wants the pairings fair

## Try it locally

```
cd app
python3 -m http.server 8000
```
Then open http://localhost:8000.

## Layout

- `app/` — the shipped static site (version 0.18). Plain HTML and JavaScript, no build step.
- `app/tests/test_engine.js` — scheduling logic tests (`node app/tests/test_engine.js`)
- `docs/` — feature list, requirements, and deployment guide

## Deploying

Hosted on Cloudflare Pages by direct upload. See the Deployment Guide in `docs/`.

## Contributing

Issues and ideas welcome — especially from other leagues. If your group
runs matches differently (more tables, different scoring), open an issue
and describe how your league plays.

## Credit

Created by Fast Eddie G, built with Claude by Anthropic. Licensed under MIT.
