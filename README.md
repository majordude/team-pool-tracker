# Team Pool Tracker

Free, offline-capable web app that builds fair doubles schedules for a team pool match and scores it table by table. Built for a senior pool league. No account, no tracking, and all data stays on the phone.

Live site: https://teampooltracker.com (trial)

## What it does
- Builds fair pairings from whoever shows up, from 4 players to 15 or more
- Handles late arrivals, locked pairs, swaps, and dropped games when running behind
- Per-table scoring with a pace line (On pace, Ahead, Running behind)
- Prints a blank score sheet and a match record
- Manager-only team stats behind a PIN
- Works offline after the first visit (installable web app)

## Layout
- `app/`: the shipped static site (version 0.17). Plain HTML and JavaScript, no build step.
- `app/tests/test_engine.js`: scheduling logic tests (`node app/tests/test_engine.js`)
- `docs/`: feature list, requirements, and deployment guide

## Try it locally
```
cd app
python3 -m http.server 8000
```
Then open http://localhost:8000.

## Deploying
Hosted on Cloudflare Pages by direct upload. See the Deployment Guide in `docs/`.

## Credit
Created by Fast Eddie G, built with Claude Sonnet 5.5 by Anthropic. Licensed under MIT.
