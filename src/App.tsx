import { useState } from 'react'
import './App.css'
import GamePlan from './GamePlan'

type Id = 'mobley' | 'bynum' | 'smith'
type Shot = 'three' | 'two'
const ids: Id[] = ['mobley', 'bynum', 'smith']
const players: Record<Id, {name:string; no:string; evidence:string; source:string; three:number; two:number}> = {
  mobley: {name:'John Mobley Jr.',no:'00',evidence:'2025–26 + 1 opener',source:'99/241 3PT · 60/127 2PT',three:41.1,two:47.2},
  bynum: {name:'Amare Bynum',no:'01',evidence:'2025–26 + 1 opener',source:'31/96 3PT · 105/169 2PT',three:32.3,two:62.1},
  smith: {name:'Alex Smith',no:'09',evidence:'Illustrative assumption',source:'No regular-season attempts listed',three:34,two:52},
}
const zones: {id:string; label:string; type:Shot; pos:string}[] = [
  {id:'left-wing',label:'Left wing 3',type:'three',pos:'left-wing'},
  {id:'top',label:'Top of key 3',type:'three',pos:'top'},
  {id:'right-wing',label:'Right wing 3',type:'three',pos:'right-wing'},
  {id:'left-paint',label:'Left paint 2',type:'two',pos:'left-paint'},
  {id:'right-paint',label:'Right paint 2',type:'two',pos:'right-paint'},
]
const opponents = [
  {name:'Youngstown State',date:'Nov 6',note:'Next scheduled home game'},
  {name:'Marshall',date:'Nov 9',note:'Scheduled home game'},
  {name:'UConn',date:'Nov 13',note:'Scheduled away game'},
  {name:'BYU',date:'Nov 2',note:'Opener: Ohio State lost 83–94'},
]
const initialRates = () => Object.fromEntries(ids.map(id => [id,{three:players[id].three,two:players[id].two}])) as Record<Id,Record<Shot,number>>
const clamp = (n:number) => Math.min(99,Math.max(1,n))
const format = (n:number) => n.toFixed(1)

export default function App(){
  const [opponent,setOpponent]=useState(opponents[0].name)
  const [zoneId,setZoneId]=useState('left-wing')
  const [a,setA]=useState<Id>('mobley')
  const [b,setB]=useState<Id>('smith')
  const [shotsA,setShotsA]=useState(6)
  const [rates,setRates]=useState(initialRates)
  const [impact,setImpact]=useState<Record<Id,number>>({mobley:0,bynum:0,smith:0})
  const [swing,setSwing]=useState(8)
  const [methods,setMethods]=useState(false)
  const zone=zones.find(z=>z.id===zoneId)!
  const value=zone.type==='three'?3:2
  const adjusted=(id:Id)=>clamp(rates[id][zone.type]+impact[id])
  const ra=adjusted(a),rb=adjusted(b),shotsB=12-shotsA
  const baseline=6*value*(ra+rb)/100
  const expected=value*(shotsA*ra+shotsB*rb)/100
  const low=value*(shotsA*clamp(ra-swing)+shotsB*clamp(rb-swing))/100
  const high=value*(shotsA*clamp(ra+swing)+shotsB*clamp(rb+swing))/100
  const delta=expected-baseline
  const leader=ids.reduce((best,id)=>adjusted(id)>adjusted(best)?id:best,ids[0])
  const lead=adjusted(leader)-Math.max(...ids.filter(id=>id!==leader).map(adjusted))
  const choose=(side:'a'|'b',id:Id)=>{if(side==='a'){setA(id);if(id===b)setB(a)}else{setB(id);if(id===a)setA(b)}}
  const chooseOpponent=(name:string)=>{setOpponent(name);setImpact({mobley:0,bynum:0,smith:0})}
  const changeRate=(id:Id,n:number)=>setRates(prev=>({...prev,[id]:{...prev[id],[zone.type]:clamp(n)}}))
  const reset=()=>{setRates(initialRates());setImpact({mobley:0,bynum:0,smith:0});setShotsA(6);setSwing(8)}
  return <div className="shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">O</span><strong>SHOT PLANNER</strong><i/><small>OHIO STATE MEN'S BASKETBALL</small></div><span className="topmeta"><b className="red-dot"/>2026–27 EARLY SEASON　/　DATA CHECKED NOV 4, 2026</span></header>
    <main>
      <div className="intro"><div><div className="eyebrow">OFFENSIVE SCENARIO LAB <span>/ 01</span></div><h1>HOW MANY SHOTS<br/><em>SHOULD EACH BUCKEYE TAKE?</em></h1><p>Build a full-game shot allocation, then test a specific court area and two-player decision below. Every result is conditional on visible assumptions.</p></div><div className="intro-right"><b>01 / 03</b><strong>BUILD A GAME PLAN</strong><span>Matchup → roster → shot counts</span></div></div>
      <GamePlan opponent={opponent} opponents={opponents} onOpponentChange={chooseOpponent}/>
      <div className="eyebrow mini-lab-label">POSSESSION LAB <span>/ ZONE & TWO-PLAYER EXPERIMENT</span></div>
      <div className="workspace">
        <section className="panel"><div className="section-title"><b>01</b><div><h2>Set the floor</h2><p>Pick the context for this possession set.</p></div></div>
          <label className="field-label" htmlFor="opponent">OPPONENT</label><select className="opponent" id="opponent" value={opponent} onChange={e=>chooseOpponent(e.target.value)}>{opponents.map(o=><option key={o.name} value={o.name}>{o.name} · {o.date}</option>)}</select><p className="hint">{opponents.find(o=>o.name===opponent)?.note}. Selection labels the matchup; your adjustments model its defensive effect.</p>
          <div className="court-head"><span className="field-label">COURT ZONE</span><small>ATTACKING BASKET ↑</small></div>
          <div className="court" role="group" aria-label="Court zone"><div className="court-arc"/><div className="court-key"/><div className="court-hoop"/>{zones.map(z=><button key={z.id} className={'zone '+z.pos+(zoneId===z.id?' active':'')} type="button" aria-pressed={zoneId===z.id} onClick={()=>setZoneId(z.id)}>{z.label.replace(' wing','').replace(' of key','').replace(' paint','').toUpperCase()}</button>)}</div>
          <div className="zone-caption"><b>{zone.label}</b><span>{value}-POINT ATTEMPT</span></div><p className="hint">Official stats separate 2s and 3s, but do not give reliable left/right splits. Both sides use the same shot-type rate.</p>
        </section>
        <section className="panel"><div className="section-title"><b>02</b><div><h2>Allocate attempts</h2><p>Move a fixed set of 12 shots between two players.</p></div></div>
          <div className="shooters">{([['a',a,shotsA,ra],['b',b,shotsB,rb]] as const).map(([side,id,shots,rate])=><div className="shooter" key={side}><small>SHOOTER {side.toUpperCase()}</small><div className="player-select"><b>{players[id].no}</b><select aria-label={'Shooter '+side.toUpperCase()} value={id} onChange={e=>choose(side,e.target.value as Id)}>{ids.map(pid=><option value={pid} key={pid}>{players[pid].name}</option>)}</select></div><div className="shot-count">{shots}<span>/12</span></div><small>PLANNED {zone.type==='three'?'THREES':'TWOS'}</small><div className="rate-line"><span>Adjusted make rate</span><strong>{format(rate)}%</strong></div></div>)}</div>
          <div className="allocation"><div><b>{players[a].name.split(' ')[0]}</b><b>{players[b].name.split(' ')[0]}</b></div><input type="range" min="0" max="12" value={shotsA} aria-label={'Shots allocated to '+players[a].name} onChange={e=>setShotsA(Number(e.target.value))} style={{'--split':(shotsA/12*100)+'%'} as React.CSSProperties}/><div className="ticks"><span>12 / 0</span><span>6 / 6</span><span>0 / 12</span></div></div>
          <div className="result"><div className="result-head"><span>EXPECTED POINTS FROM 12 SHOTS</span><small>FIELD GOALS ONLY</small></div><div className="result-main"><strong>{format(expected)}</strong><div className={delta>=0?'gain':'loss'}>{delta>=0?'+':''}{format(delta)}<small>vs 6 / 6 split</small></div></div><div className="result-range"><span>Sensitivity range</span><b>{format(low)}–{format(high)} pts</b></div><div className="range-bar"><i/></div><p>Range moves each adjusted make rate by ±{swing} percentage points. It is a what-if band, not a statistical confidence interval or win forecast.</p></div>
        </section>
        <section className="panel"><div className="section-title"><b>03</b><div><h2>Tune the matchup</h2><p>Make your assumptions visible.</p></div></div><div className="input-note">No opponent or court-side effect is applied by default. Enter your scouting estimate in percentage points.</div>
          <div className="table-head"><span>PLAYER</span><span>BASE {zone.type==='three'?'3PT':'2PT'}%</span><span>VS {opponent.toUpperCase()}</span></div>
          {ids.map(id=><div className="input-row" key={id}><div className="identity"><b>{players[id].name}</b><small>{players[id].evidence}</small></div><label className="num"><input type="number" min="1" max="99" value={rates[id][zone.type]} aria-label={players[id].name+' base make rate percent'} onChange={e=>changeRate(id,Number(e.target.value))}/><span>%</span></label><label className="num"><input type="number" min="-30" max="30" value={impact[id]} aria-label={players[id].name+' opponent adjustment percentage points'} onChange={e=>setImpact(prev=>({...prev,[id]:Math.max(-30,Math.min(30,Number(e.target.value)))}))}/><span>pp</span></label></div>)}
          <div className="swing"><div><label htmlFor="swing">SENSITIVITY BAND</label><b>±{swing} pp</b></div><input id="swing" type="range" min="1" max="25" value={swing} onChange={e=>setSwing(Number(e.target.value))}/><small>Widen this for new players or uncertain scouting assumptions.</small></div>
          <button className="reset" type="button" onClick={reset}>↺　Reset model inputs</button>
        </section>
      </div>
      <section className="takeaway"><div><div className="eyebrow">THE READOUT <span>/ SCENARIO ONLY</span></div><h2>The go-to look</h2><p><b>{players[leader].name}</b> has the highest adjusted {zone.type==='three'?'three-point':'two-point'} make rate for {zone.label.toLowerCase()} in this setup ({format(adjusted(leader))}%). {lead<3?'The margin is narrow, so treat this as a tie for planning.':'Test whether your scouting view supports the gap before shifting volume.'}</p></div><div className="stamp"><small>MODEL CALL</small><b>{lead<3?'CLOSE CALL':'#'+players[leader].no}</b><small>{opponent.toUpperCase()}</small></div></section>
      <section className="methods"><button type="button" aria-expanded={methods} onClick={()=>setMethods(!methods)}><span>METHOD & SOURCES</span><b>{methods?'−':'+'}</b></button>{methods&&<div className="methods-body"><div><h3>How the number works</h3><p>The 12-shot possession lab uses shots by player × adjusted make rate × shot value. Its comparison uses a 6/6 split with the same inputs. It excludes free throws, rebounds, turnovers, fatigue, defensive adaptation, and changing shot quality as volume grows. A higher expected value is conditional on entered rates.</p><p>Historical 2PT rates are derived as (FGM − 3PTM) ÷ (FGA − 3PTA). Mobley and Bynum pool 2025–26 regular-season totals with the Nov 2, 2026 BYU opener. Alex Smith has no listed attempts in the current regular-season table; his initial 34% / 52% values in this lab are editable illustration assumptions. Opponent adjustments are also assumptions. No real win probability is shown because this evidence cannot support one.</p></div><div><h3>Primary sources · checked Nov 4, 2026</h3><ul><li><a href="https://ohiostatebuckeyes.com/sports/mens-basketball/roster" target="_blank" rel="noreferrer">Official 2026–27 roster ↗</a> — names and roles</li><li><a href="https://ohiostatebuckeyes.com/sports/mens-basketball/stats/2025-26" target="_blank" rel="noreferrer">Official 2025–26 cumulative stats ↗</a> — historical totals</li><li><a href="https://ohiostatebuckeyes.com/sports/mens-basketball/stats/2026-27" target="_blank" rel="noreferrer">Official 2026–27 cumulative stats ↗</a> — one regular-season game</li><li><a href="https://ohiostatebuckeyes.com/sports/2026/10/7/mens-basketball-media-center" target="_blank" rel="noreferrer">Official media center ↗</a> — schedule and box-score links</li></ul><p>Opponent choices follow the official media center schedule. No tracking or shot-coordinate data is used.</p></div></div>}</section>
    </main><footer><span>OHIO STATE SHOT PLANNER</span><span>INDEPENDENT STUDENT PROJECT · NOT AFFILIATED WITH OHIO STATE ATHLETICS</span><span>BUILT FOR QUESTIONS, NOT CERTAINTY</span></footer>
  </div>
}
