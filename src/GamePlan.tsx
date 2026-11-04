import { useMemo, useState } from 'react'
import { initialRoster, openerAllocation, optimizeShots, scorePlan, type PlayerPlanInput } from './optimizer'

type Opponent = { name: string; date: string; note: string }
export default function GamePlan({ opponent, opponents, onOpponentChange }: {
  opponent: string
  opponents: Opponent[]
  onOpponentChange: (name: string) => void
}) {
  const [roster, setRoster] = useState<PlayerPlanInput[]>(initialRoster)
  const [total, setTotal] = useState(60)
  const [threes, setThrees] = useState(28)
  const [decay, setDecay] = useState(0.8)
  const [showInputs, setShowInputs] = useState(false)
  const result = useMemo(() => optimizeShots(roster, total, threes, decay), [roster, total, threes, decay])
  const baseline = useMemo(() => scorePlan(roster, openerAllocation, decay), [roster, decay])
  const delta = result.expected - baseline
  const comparableToOpener = total === 60 && threes === 28
  const ranked = [...result.allocations].sort((a, b) => (b.two + b.three) - (a.two + a.three))
  const lead = ranked[0]
  function change(id: string, field: keyof PlayerPlanInput, value: number | boolean) {
    setRoster(previous => previous.map(player => player.id === id ? { ...player, [field]: value } : player))
  }
  function choose(name: string) {
    onOpponentChange(name)
    setRoster(previous => previous.map(player => ({ ...player, matchup: 0 })))
  }
  const editNumber = (player: PlayerPlanInput, field: 'twoRate' | 'threeRate' | 'maxTotal' | 'maxTwo' | 'maxThree' | 'matchup', min: number, max: number) =>
    <input className="game-number" type="number" min={min} max={max} step={field === 'matchup' ? 1 : field.endsWith('Rate') ? 0.1 : 1}
      value={player[field]} aria-label={`${player.name} ${field}`}
      onChange={event => change(player.id, field, Math.min(max, Math.max(min, Number(event.target.value))))} />
  return <section className="game-plan" aria-labelledby="game-plan-heading">
    <div className="game-plan-heading"><div><div className="eyebrow">FULL-GAME ALLOCATION <span>/ NEW MODEL</span></div><h2 id="game-plan-heading">An exact shot plan for the Buckeyes</h2><p>Set the shots available. The optimizer assigns every attempt to a player and shot type, subject to your availability, volume, and matchup assumptions.</p></div><span className="game-plan-badge">15 PLAYER ROSTER</span></div>
    <div className="game-controls">
      <label>OPPONENT<select value={opponent} onChange={event => choose(event.target.value)}>{opponents.map(item => <option key={item.name} value={item.name}>{item.name} · {item.date}</option>)}</select></label>
      <label>TOTAL FIELD-GOAL ATTEMPTS<input type="number" min="1" max="100" value={total} onChange={event => { const next = Math.min(100, Math.max(1, Number(event.target.value))); setTotal(next); setThrees(current => Math.min(current, next)) }} /></label>
      <label>THREE-POINT ATTEMPTS<input type="number" min="0" max={total} value={threes} onChange={event => setThrees(Math.min(total, Math.max(0, Number(event.target.value))))} /></label>
      <label>QUALITY DROP PER EXTRA SHOT<input type="number" min="0" max="3" step="0.1" value={decay} onChange={event => setDecay(Math.min(3, Math.max(0, Number(event.target.value))))} /><small>Percentage points; model assumption</small></label>
    </div>
    <p className="game-explainer">The 60 attempts and 28 threes start from the <a href="https://ohiostatebuckeyes.com/sports/mens-basketball/stats/2026-27" target="_blank" rel="noreferrer">official BYU opener table ↗</a>. They are editable game-plan assumptions. Opponent names do not apply hidden defensive ratings; set player matchup adjustments below.</p>
    {result.feasible ? <>
      <div className="game-summary"><div><small>OPTIMIZED FIELD-GOAL POINTS</small><strong>{result.expected.toFixed(1)}</strong><span>Scenario expected value, excluding free throws</span></div><div><small>VS OPENER SHOT MIX</small><strong className={comparableToOpener && delta >= 0 ? 'positive' : ''}>{comparableToOpener ? `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}` : '—'}</strong><span>{comparableToOpener ? 'Same 60 shots / 28 threes, modeled with current rates' : 'Comparison only applies at 60 shots / 28 threes'}</span></div><div><small>FIRST OPTION BY VOLUME</small><strong className="leader-name">{roster.find(p => p.id === lead?.id)?.name ?? '—'}</strong><span>{lead ? lead.two + lead.three : 0} planned attempts</span></div></div>
      <div className="game-table-wrap"><table className="game-table"><thead><tr><th>BUCKEYE</th><th>TWOS</th><th>THREES</th><th>TOTAL SHOTS</th><th>EXPECTED FG PTS</th><th>INPUT QUALITY</th></tr></thead><tbody>{ranked.map(item => { const player = roster.find(p => p.id === item.id)!; return <tr key={item.id} className={item.two + item.three ? '' : 'zero-row'}><td><b>#{player.number} {player.name}</b></td><td>{item.two}</td><td>{item.three}</td><td><strong>{item.two + item.three}</strong></td><td>{item.expected.toFixed(1)}</td><td>{player.source}</td></tr> })}</tbody><tfoot><tr><td>TEAM TOTAL</td><td>{total - threes}</td><td>{threes}</td><td>{total}</td><td>{result.expected.toFixed(1)}</td><td>Exact integer allocation</td></tr></tfoot></table></div>
    </> : <div className="game-error" role="alert">{result.reason} Open model inputs to adjust the roster.</div>}
    <div className="game-model"><button type="button" aria-expanded={showInputs} onClick={() => setShowInputs(!showInputs)}>{showInputs ? 'Hide' : 'Edit'} roster availability, rates, and shot limits <span>{showInputs ? '−' : '+'}</span></button>{showInputs && <><p>Players who appeared in the BYU opener start as available. Alex Smith and other players without a regular-season appearance start off; turn them on to test their roles. Only Mobley and Bynum have pooled OSU shooting totals. Other rates shrink one game toward illustrative 50% two-point / 34% three-point priors, or use those priors alone.</p><div className="game-table-wrap"><table className="game-table input-table"><thead><tr><th>AVAILABLE</th><th>PLAYER</th><th>2PT %</th><th>3PT %</th><th>MATCHUP ±pp</th><th>MAX 2S</th><th>MAX 3S</th><th>MAX TOTAL</th></tr></thead><tbody>{roster.map(player => <tr key={player.id}><td><input type="checkbox" checked={player.available} aria-label={`${player.name} available`} onChange={event => change(player.id, 'available', event.target.checked)} /></td><td><b>#{player.number} {player.name}</b><small>{player.source}</small></td><td>{editNumber(player, 'twoRate', 1, 99)}</td><td>{editNumber(player, 'threeRate', 1, 99)}</td><td>{editNumber(player, 'matchup', -30, 30)}</td><td>{editNumber(player, 'maxTwo', 0, 40)}</td><td>{editNumber(player, 'maxThree', 0, 40)}</td><td>{editNumber(player, 'maxTotal', 0, 40)}</td></tr>)}</tbody></table></div><div className="game-input-footer"><label>Caps and percentages are editable model inputs. Increase Alex Smith's caps or rates only when you have a scouting basis for doing so.</label><button type="button" onClick={() => { setRoster(initialRoster); setTotal(60); setThrees(28); setDecay(0.8) }}>Reset full-game model</button></div></>}</div>
    <p className="game-caveat"><b>What this means:</b> This is the highest expected field-goal scoring allocation <em>under the numbers entered</em>, with a 0.8 percentage-point quality penalty per additional attempt by the same player and shot type. It is a scenario, not a verified best way to win. Defense, turnovers, free throws, rebounds, playing time, changing shot quality, and real opponent tendencies are not modeled. A true win-probability optimizer needs those inputs and far more shot-location data.</p>
  </section>
}
