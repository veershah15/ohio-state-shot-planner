# Ohio State Shot Planner

An independent, interactive shot-allocation scenario tool for Ohio State men's basketball. Pick an opponent and court area, compare two current Buckeyes, and move a fixed set of 12 field-goal attempts between them. The app recalculates expected points, a visible sensitivity range, and a conditional go-to suggestion.

**Status:** first MVP, data checked **November 3, 2026**. The 2026–27 regular season had one published Ohio State game, at BYU on November 2. This is an exploration aid, not a prediction or an official Ohio State product.

## Run

```bash
npm install
npm run dev
```

Open the localhost URL shown by Vite. Use `npm run build` for the production build.

## What is sourced

| Input | Value in app | Primary source | As of |
| --- | --- | --- | --- |
| 2026–27 roster | John Mobley Jr., Amare Bynum, Alex Smith and jersey numbers | [Ohio State roster](https://ohiostatebuckeyes.com/sports/mens-basketball/roster) | Nov 3, 2026 |
| Mobley 2025–26 | 155/359 FG, 97/236 3PT | [Ohio State 2025–26 cumulative stats](https://ohiostatebuckeyes.com/sports/mens-basketball/stats/2025-26) | Nov 3, 2026 |
| Bynum 2025–26 | 129/255 FG, 28/91 3PT | [Ohio State 2025–26 cumulative stats](https://ohiostatebuckeyes.com/sports/mens-basketball/stats/2025-26) | Nov 3, 2026 |
| Mobley at BYU | 4/9 FG, 2/5 3PT | [Ohio State 2026–27 cumulative stats](https://ohiostatebuckeyes.com/sports/mens-basketball/stats/2026-27) | Nov 3, 2026 |
| Bynum at BYU | 7/10 FG, 3/5 3PT | [Ohio State 2026–27 cumulative stats](https://ohiostatebuckeyes.com/sports/mens-basketball/stats/2026-27) | Nov 3, 2026 |
| Schedule choices | Youngstown State, Marshall, UConn, BYU | [Ohio State media center](https://ohiostatebuckeyes.com/sports/2026/10/7/mens-basketball-media-center) | Nov 3, 2026 |

For Mobley and Bynum, the app pools 2025–26 totals and the opener. Three-point rate is combined 3PTM / 3PTA. Two-point rate is (combined FGM − combined 3PTM) / (combined FGA − combined 3PTA):

- Mobley: 99/241 threes = 41.1%; 60/127 twos = 47.2%.
- Bynum: 31/96 threes = 32.3%; 105/169 twos = 62.1%.

The 2026–27 official regular-season table did not list Alex Smith or any attempts for him when checked. The **34% three-point** and **52% two-point** starting values are illustrative, editable assumptions. They are not sourced shooting percentages. The same is true of every opponent adjustment, the default ±8 percentage-point sensitivity setting, and the hypothetical 12-shot plan.

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
