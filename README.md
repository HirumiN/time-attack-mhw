# Iceborne Time Attack

A solo double-elimination tournament bracket for Monster Hunter World: Iceborne time attacks. Built with React, TypeScript, and Vite.

## Features

- **Participant management** — add hunters manually or import a list (one name per line), edit, and delete while the tournament is still in setup.
- **Stage-based quest assignment** — assign a pool of quests to each stage (Stage 1, Stage 2, Stage 3, Grand Final) and pick them per stage or per match.
- **Double-elimination bracket** — upper bracket, lower bracket, and Grand Final, including a bracket reset (GF-2) when the lower-bracket winner takes the first Grand Final.
- **Match center** — shared timer, manual time entry in `MM:SS.mmm`, DNF handling, automatic winner detection, and manual override with a reason.
- **Live standings** — wins, losses, best time, elimination status, and champion display.
- **Automatic local save** — tournament state is persisted to `localStorage` on every change.
- **Portable save codes** — export the current tournament and history as a copyable code, then load it in another browser or device to continue the results.

## Tech stack

- React 19
- TypeScript 7
- Vite 8
- Oxlint

## Getting started

Requires Node.js `^20.19.0` or `>=22.12.0`.

```bash
npm install
npm run dev
```

The dev server runs at the URL printed by Vite (usually `http://localhost:5173`).

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run Oxlint |

## Usage

1. **Participants** — add or import hunters. Participants can only be edited while the tournament is in `setup`.
2. **Setup** — choose the randomizer mode and assign quests to each stage.
3. **Tournament** — generate the bracket, start the tournament, then click a match to:
   - start the shared timer,
   - finish each participant or enter times manually,
   - mark a DNF,
   - confirm the result or use a manual override.
4. **Save / Load** — generate a save code to back up the tournament or continue it elsewhere.

## Save codes

The **Save / Load** tab can generate a code containing the current tournament, all recorded results, and tournament history.

- The code is gzip-compressed and base64url-encoded, prefixed with `MHW1G-`.
- If the browser does not support `CompressionStream`, an uncompressed `MHW1-` code is produced instead.
- Copy the code and keep it somewhere safe. Paste it into **Load Save Code** to restore the tournament.
- Loading a code replaces the tournament currently open in the browser.

In addition to save codes, the app automatically stores its state in `localStorage` under the `mhw_state` key.


## Notes

- Tournament data is client-side only; there is no backend.
- Save codes are not encrypted. Do not put sensitive information in participant names.
- Bracket layout is responsive, with the Grand Final column moving below the bracket on narrow screens.
