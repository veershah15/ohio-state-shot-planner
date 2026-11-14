# Ohio State Shot Planner

An independent, interactive shot-allocation scenario tool for Ohio State men's basketball. The full-game optimizer assigns an exact number of two- and three-point attempts to each player on the current 15-man roster. A second lab compares two Buckeyes over 12 attempts in a selected court area.

**Status:** interactive MVP. Shooting inputs are a **November 4, 2026 snapshot**, when the 2026–27 regular-season table included only the November 2 BYU opener. Opponent schedule choices were checked **November 14, 2026**. This is an exploration aid, not a prediction or an official Ohio State product.

## Run

```bash
npm install
npm run dev
```

Open the localhost URL shown by Vite. Use `npm run build`, `npm run lint`, and `npm run test` to verify the project.

## Full-game shot plan

The default scenario starts with the **60 field-goal attempts and 28 threes** in Ohio State's [November 2 BYU opener statistics](https://ohiostatebuckeyes.com/sports/mens-basketball/stats/2026-27). Select an opponent, set the game shot totals, edit player availability, shooting rates, matchup adjustments, and per-player shot caps. The optimizer returns exact integer counts of twos, threes, and total shots for every roster player. It reports when the caps cannot accommodate the requested total.

The algorithm maximizes **expected field-goal points under the entered assumptions**, not actual win probability. It uses a min-cost flow model with one unit for each possible shot, fixed team totals for twos and threes, player-specific shot-type caps, a shared per-player total cap, and an editable make-rate decline for each extra attempt of the same type (0.8 percentage points by default). The page explains the currently selected decline, including when it is set to zero. This decline models harder marginal shots; it is an assumption, not a measured Ohio State effect. A player without a BYU appearance starts unavailable until the user enables them. Alex Smith is therefore present but off by default.

Mobley and Bynum use pooled Ohio State totals noted below. Other players who appeared against BYU use that one-game result shrunk toward **illustrative** 50% two-point and 34% three-point priors (30 and 20 prior attempts respectively); players with no regular-season appearance start at the priors alone. Those priors, all shot caps, and all matchup adjustments are editable assumptions. Opponent selection never applies a hidden rating. The comparison with the opener's shot mix appears only when the scenario uses the same 60 total attempts and 28 threes and the current availability and shot caps still allow the opener's allocations.

The model excludes defensive scoring, free throws, turnovers, rebounds, playing time, shot creation, and actual opponent tendencies. It cannot yet make a defensible claim that its plan gives Ohio State the *best chance to win*. That would require a tested possession-level game model and reliable matchup/location data.

## What is sourced

| Input | Value in app | Primary source | As of |
| --- | --- | --- | --- |
| 2026–27 roster | John Mobley Jr., Amare Bynum, Alex Smith and jersey numbers | [Ohio State roster](https://ohiostatebuckeyes.com/sports/mens-basketball/roster) | Nov 3, 2026 |
| Mobley 2025–26 | 155/359 FG, 97/236 3PT | [Ohio State 2025–26 cumulative stats](https://ohiostatebuckeyes.com/sports/mens-basketball/stats/2025-26) | Nov 3, 2026 |
| Bynum 2025–26 | 129/255 FG, 28/91 3PT | [Ohio State 2025–26 cumulative stats](https://ohiostatebuckeyes.com/sports/mens-basketball/stats/2025-26) | Nov 3, 2026 |
| Mobley at BYU | 4/9 FG, 2/5 3PT | [Ohio State 2026–27 cumulative stats](https://ohiostatebuckeyes.com/sports/mens-basketball/stats/2026-27) | Nov 3, 2026 |
| Bynum at BYU | 7/10 FG, 3/5 3PT | [Ohio State 2026–27 cumulative stats](https://ohiostatebuckeyes.com/sports/mens-basketball/stats/2026-27) | Nov 3, 2026 |
| Schedule choices | Prairie View A&M, UMBC, Vanderbilt, Lipscomb, BYU | [Ohio State 2026–27 schedule](https://ohiostatebuckeyes.com/sports/mens-basketball/schedule) | Nov 14, 2026 |

For Mobley and Bynum, the app pools 2025–26 totals and the opener. Three-point rate is combined 3PTM / 3PTA. Two-point rate is (combined FGM − combined 3PTM) / (combined FGA − combined 3PTA):

- Mobley: 99/241 threes = 41.1%; 60/127 twos = 47.2%.
- Bynum: 31/96 threes = 32.3%; 105/169 twos = 62.1%.

The 2026–27 official regular-season table did not list Alex Smith or any attempts for him when checked November 4. The **34% three-point** and **52% two-point** starting values are illustrative, editable assumptions. They are not sourced shooting percentages. The same is true of every opponent adjustment, the default ±8 percentage-point sensitivity setting, and the hypothetical 12-shot plan.

## Calculation

```
adjusted make rate = clamp(base make rate + user opponent adjustment, 1%, 99%)
expected points = Σ (allocated shots × adjusted make rate × shot value)
comparison = expected points − expected points from an even 6/6 split
sensitivity endpoints = the same calculation with each adjusted rate moved ± user band
```

The sensitivity range is a deterministic what-if band, **not** a confidence or credible interval. It is intentionally adjustable because a single opener, a new player, and missing matchup data create material uncertainty. The go-to option is the highest adjusted make rate among the three included players for the selected shot type. A margin below three percentage points is labeled a close call.

## Limits and next data step

Official cumulative box-score stats do **not** establish left/right location, defender matchup, shot quality, or opponent-specific defensive effects. Left and right use the same rate for a given shot type. Selecting an opponent changes the planning context and clears opponent adjustments; it does not silently apply a defensive factor. The model also excludes free throws, offensive rebounds, turnovers, fatigue, defensive adaptation, and the possibility that efficiency falls with more attempts. It does **not** output win probability.

Next, obtain a lawful, documented play-by-play or shot-coordinate dataset with stable access and enough games to estimate zones and opponents. Add ingestion, dated refreshes, validation, and sample-size-aware estimates before labeling any location or matchup recommendation data-driven.

The project is not affiliated with Ohio State Athletics. Source links are used for attribution; no official photos, logos, PDFs, or scraped bulk datasets are bundled.
