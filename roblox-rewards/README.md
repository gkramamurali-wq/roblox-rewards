# Roblox Rewards

A local-only kid-friendly web app prototype built with Vite and vanilla JavaScript.

## What it is

- Bright, playful web UI inspired by kid-friendly obstacle/adventure games
- Math and English puzzle area
- Reward shop for virtual in-app items only
- Parent settings for age, difficulty, sound, and local-only mode
- Runs fully local in the browser

## Safety notes

- No Roblox login
- No Robux generation claims
- No account connection
- No unsafe downloads required
- Local browser app only

## Milestone plan

1. Project structure ✅
2. Clickable UI prototype ✅
3. Puzzle engine ✅
4. Rewards and unlocks ✅
5. Save/progress ✅
6. Run guide ✅

## Implemented now

- Age and difficulty affect puzzle generation
- Math and English puzzles are generated dynamically
- Correct answers award coins, stars, XP, and occasional gems
- Quest progress updates as the child plays
- Shop items can be unlocked and equipped
- Progress is saved in browser localStorage
- Parent page includes a reset-local-save button

## Run locally

```bash
npm install
npm run dev -- --host
```

Then open the local URL shown by Vite in your browser.

On Windows with Ubuntu WSL, usually open:

- `http://localhost:5173`

## Build for production preview

```bash
npm run build
npm run preview -- --host
```
