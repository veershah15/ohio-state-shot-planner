import test from 'node:test'
import assert from 'node:assert/strict'
import { initialRoster, optimizeShots, type PlayerPlanInput } from '../src/optimizer.ts'

test('full-game plan assigns exactly the requested two and three attempts within every cap', () => {
  const result = optimizeShots(initialRoster, 60, 28, 0.8)
  assert.equal(result.feasible, true)
  assert.equal(result.allocations.reduce((sum, player) => sum + player.two, 0), 32)
  assert.equal(result.allocations.reduce((sum, player) => sum + player.three, 0), 28)
  for (const allocation of result.allocations) {
    const player = initialRoster.find(item => item.id === allocation.id)!
    assert.ok(allocation.two <= player.maxTwo)
    assert.ok(allocation.three <= player.maxThree)
    assert.ok(allocation.two + allocation.three <= player.maxTotal)
    if (!player.available) assert.equal(allocation.two + allocation.three, 0)
  }
})

test('the better scorer receives the shot when one attempt is available', () => {
  const small: PlayerPlanInput[] = [
    { ...initialRoster[0], id: 'low', twoRate: 35, threeRate: 25, maxTwo: 1, maxThree: 1, maxTotal: 1 },
    { ...initialRoster[1], id: 'high', twoRate: 70, threeRate: 60, maxTwo: 1, maxThree: 1, maxTotal: 1 },
  ]
  assert.equal(optimizeShots(small, 1, 1, 0).allocations.find(p => p.id === 'high')?.three, 1)
  assert.equal(optimizeShots(small, 1, 0, 0).allocations.find(p => p.id === 'high')?.two, 1)
})

test('infeasible caps are reported rather than inventing extra attempts', () => {
  const players = initialRoster.map(p => ({ ...p, maxTotal: 0 }))
  const result = optimizeShots(players, 60, 28, 0.8)
  assert.equal(result.feasible, false)
  assert.equal(result.allocated, 0)
})
