export type ShotType = 'two' | 'three'
export type PlayerPlanInput = {
  id: string
  name: string
  number: string
  source: string
  openerTwo: number
  openerThree: number
  twoRate: number
  threeRate: number
  maxTwo: number
  maxThree: number
  maxTotal: number
  available: boolean
  matchup: number
}

type Opener = { twoMade: number; twoTaken: number; threeMade: number; threeTaken: number }
const priorTwo = 0.50
const priorThree = 0.34
const estimate = (made: number, taken: number, prior: number, weight: number) =>
  Math.round(((made + prior * weight) / (taken + weight)) * 1000) / 10
const newcomer = 'Editable model estimate · no prior OSU sample'
const opener = 'One-game estimate, shrunk toward model prior'

function fromOpener(id: string, name: string, number: string, stats: Opener, maxTotal: number, maxThree: number): PlayerPlanInput {
  return {
    id, name, number, source: opener,
    openerTwo: stats.twoTaken, openerThree: stats.threeTaken,
    twoRate: estimate(stats.twoMade, stats.twoTaken, priorTwo, 30),
    threeRate: estimate(stats.threeMade, stats.threeTaken, priorThree, 20),
    maxTwo: maxTotal, maxThree, maxTotal, available: true, matchup: 0,
  }
}
function withoutOpener(id: string, name: string, number: string): PlayerPlanInput {
  return { id, name, number, source: newcomer, openerTwo: 0, openerThree: 0,
    twoRate: 50, threeRate: 34, maxTwo: 10, maxThree: 6, maxTotal: 10,
    available: false, matchup: 0 }
}

// Roster and opener totals: official Ohio State pages, checked Nov 4, 2026.
// The 2026-27 regular season had one game. These are scenario inputs, not projections.
export const initialRoster: PlayerPlanInput[] = [
  { id: 'mobley', name: 'John Mobley Jr.', number: '0', source: '2025–26 + BYU totals', openerTwo: 4, openerThree: 5, twoRate: 47.2, threeRate: 41.1, maxTwo: 15, maxThree: 15, maxTotal: 20, available: true, matchup: 0 },
  { id: 'bynum', name: 'Amare Bynum', number: '1', source: '2025–26 + BYU totals', openerTwo: 5, openerThree: 5, twoRate: 62.1, threeRate: 32.3, maxTwo: 17, maxThree: 12, maxTotal: 20, available: true, matchup: 0 },
  fromOpener('givens', 'Curtis Givens III', '2', { twoMade: 1, twoTaken: 1, threeMade: 0, threeTaken: 2 }, 11, 8),
  fromOpener('williams', 'Jimmie Williams', '3', { twoMade: 0, twoTaken: 1, threeMade: 0, threeTaken: 6 }, 13, 11),
  fromOpener('jelavic', 'Andrija Jelavic', '4', { twoMade: 5, twoTaken: 6, threeMade: 1, threeTaken: 2 }, 16, 9),
  fromOpener('thompson', 'Anthony Thompson', '6', { twoMade: 0, twoTaken: 1, threeMade: 0, threeTaken: 4 }, 12, 9),
  fromOpener('njegovan', 'Ivan Njegovan', '7', { twoMade: 2, twoTaken: 2, threeMade: 0, threeTaken: 0 }, 8, 2),
  withoutOpener('herro', 'Myles Herro', '8'),
  withoutOpener('alex-smith', 'Alex Smith', '9'),
  fromOpener('pippen', 'Justin Pippen', '10', { twoMade: 2, twoTaken: 5, threeMade: 2, threeTaken: 3 }, 16, 11),
  fromOpener('lj-smith', 'LJ Smith', '14', { twoMade: 0, twoTaken: 2, threeMade: 1, threeTaken: 1 }, 10, 7),
  fromOpener('ojianwuna', 'Josh Ojianwuna', '17', { twoMade: 2, twoTaken: 4, threeMade: 0, threeTaken: 0 }, 11, 2),
  fromOpener('aaliya', 'Lee Aaliya', '23', { twoMade: 1, twoTaken: 1, threeMade: 0, threeTaken: 0 }, 8, 3),
  withoutOpener('nash', 'Braylen Nash', '55'),
  withoutOpener('lazarevic', 'Vuk Lazarevic', '88'),
]

export type Allocation = { id: string; two: number; three: number; expected: number }
export type OptimizeResult = { feasible: boolean; allocations: Allocation[]; expected: number; allocated: number; reason?: string }
type Edge = { to: number; rev: number; capacity: number; cost: number; player?: number; shot?: ShotType }

const rate = (player: PlayerPlanInput, shot: ShotType, nth: number, decay: number) => {
  const base = shot === 'three' ? player.threeRate : player.twoRate
  return Math.max(1, Math.min(99, base + player.matchup - decay * nth)) / 100
}
export function scorePlan(players: PlayerPlanInput[], allocations: Allocation[], decay: number): number {
  return allocations.reduce((sum, allocation) => {
    const player = players.find(p => p.id === allocation.id)
    if (!player) return sum
    for (const shot of ['two', 'three'] as const) {
      const count = allocation[shot]
      for (let n = 0; n < count; n++) sum += (shot === 'three' ? 3 : 2) * rate(player, shot, n, decay)
    }
    return sum
  }, 0)
}

// Integer min-cost flow. Each possible attempt is a unit edge whose cost rises
// as shot quality falls. Shared player caps and fixed 2/3 counts are enforced.
export function optimizeShots(players: PlayerPlanInput[], total: number, threes: number, decay: number): OptimizeResult {
  const allocations = players.map(p => ({ id: p.id, two: 0, three: 0, expected: 0 }))
  if (!Number.isInteger(total) || !Number.isInteger(threes) || total < 0 || threes < 0 || threes > total || decay < 0)
    return { feasible: false, allocations, expected: 0, allocated: 0, reason: 'Enter a valid shot total and three-point share.' }
  const source = 0, twoNode = 1, threeNode = 2, sink = 3 + players.length * 3
  const graph: Edge[][] = Array.from({ length: sink + 1 }, () => [])
  function add(from: number, to: number, capacity: number, cost: number, player?: number, shot?: ShotType) {
    const forward: Edge = { to, rev: graph[to].length, capacity, cost, player, shot }
    const back: Edge = { to: from, rev: graph[from].length, capacity: 0, cost: -cost }
    graph[from].push(forward)
    graph[to].push(back)
  }
  add(source, twoNode, total - threes, 0)
  add(source, threeNode, threes, 0)
  players.forEach((p, index) => {
    if (!p.available) return
    const twoSlot = 3 + index * 3, threeSlot = twoSlot + 1, playerNode = twoSlot + 2
    const twoCap = Math.max(0, Math.floor(p.maxTwo)), threeCap = Math.max(0, Math.floor(p.maxThree))
    for (let n = 0; n < twoCap; n++) add(twoNode, twoSlot, 1, 3 - 2 * rate(p, 'two', n, decay), index, 'two')
    for (let n = 0; n < threeCap; n++) add(threeNode, threeSlot, 1, 3 - 3 * rate(p, 'three', n, decay), index, 'three')
    add(twoSlot, playerNode, twoCap, 0)
    add(threeSlot, playerNode, threeCap, 0)
    add(playerNode, sink, Math.max(0, Math.floor(p.maxTotal)), 0)
  })
  let allocated = 0
  while (allocated < total) {
    const distance = Array(graph.length).fill(Infinity) as number[]
    const previous = Array(graph.length).fill(null) as ({ from: number; edge: number } | null)[]
    distance[source] = 0
    for (let pass = 0; pass < graph.length - 1; pass++) {
      let changed = false
      for (let from = 0; from < graph.length; from++) {
        if (!Number.isFinite(distance[from])) continue
        graph[from].forEach((edge, index) => {
          const next = distance[from] + edge.cost
          if (edge.capacity > 0 && next < distance[edge.to] - 1e-9) {
            distance[edge.to] = next
            previous[edge.to] = { from, edge: index }
            changed = true
          }
        })
      }
      if (!changed) break
    }
    if (!previous[sink]) break
    let node = sink
    while (node !== source) {
      const step = previous[node]!
      const edge = graph[step.from][step.edge]
      edge.capacity--
      graph[node][edge.rev].capacity++
      node = step.from
    }
    allocated++
  }
  players.forEach((_, index) => {
    for (const shotNode of [twoNode, threeNode]) {
      for (const edge of graph[shotNode]) {
        if (edge.player !== index || !edge.shot || edge.capacity !== 0) continue
        allocations[index][edge.shot]++
      }
    }
  })
  allocations.forEach((item, index) => { item.expected = scorePlan([players[index]], [item], decay) })
  const expected = allocations.reduce((sum, item) => sum + item.expected, 0)
  return {
    feasible: allocated === total, allocations, expected, allocated,
    reason: allocated === total ? undefined : `Only ${allocated} of ${total} attempts fit the available players' caps. Raise caps, activate players, or lower the shot total.`,
  }
}

export const openerAllocation: Allocation[] = initialRoster.map(p => ({ id: p.id, two: p.openerTwo, three: p.openerThree, expected: 0 }))

// A comparison is valid only if the historical shot mix is still allowed by
// the user's current availability and volume limits.
export function planFitsCaps(players: PlayerPlanInput[], allocations: Allocation[]): boolean {
  return allocations.every(item => {
    const player = players.find(p => p.id === item.id)
    if (!player || !Number.isInteger(item.two) || !Number.isInteger(item.three) || item.two < 0 || item.three < 0) return false
    const shots = item.two + item.three
    return (shots === 0 || player.available) && item.two <= player.maxTwo && item.three <= player.maxThree && shots <= player.maxTotal
  })
}
