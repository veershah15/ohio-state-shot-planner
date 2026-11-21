// Upcoming choices from Ohio State's official 2026–27 schedule, checked Nov 21, 2026.
// These dates label scenarios; they do not supply opponent defensive ratings.
export const opponents = [
  { name: 'Vanderbilt', date: 'Nov 24', dateIso: '2026-11-24', note: 'Scheduled home game' },
  { name: 'Lipscomb', date: 'Nov 29', dateIso: '2026-11-29', note: 'Scheduled home game' },
  { name: 'Nebraska', date: 'Dec 2', dateIso: '2026-12-02', note: 'Scheduled away game' },
  { name: 'Maryland', date: 'Dec 6', dateIso: '2026-12-06', note: 'Scheduled home game' },
  { name: 'Notre Dame', date: 'Dec 12', dateIso: '2026-12-12', note: 'Scheduled away game' },
  { name: 'Stony Brook', date: 'Dec 15', dateIso: '2026-12-15', note: 'Scheduled home game' },
  { name: 'Kansas', date: 'Dec 19', dateIso: '2026-12-19', note: 'CBS Sports Classic' },
  { name: 'Mississippi Valley State', date: 'Dec 22', dateIso: '2026-12-22', note: 'Scheduled home game' },
  { name: 'Oregon', date: 'Dec 30', dateIso: '2026-12-30', note: 'Scheduled home game' },
  { name: 'BYU', date: 'Nov 2', dateIso: '2026-11-02', note: 'Opener: Ohio State lost 83–94' },
]

export function easternDate(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)
  const value = (part: string) => parts.find(item => item.type === part)?.value
  return `${value('year')}-${value('month')}-${value('day')}`
}

export function nextOpponentName(today: string): string {
  return opponents.find(item => item.dateIso >= today && item.name !== 'BYU')?.name ?? 'BYU'
}
