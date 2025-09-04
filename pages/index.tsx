
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import classNames from 'classnames';
import { useRouter } from 'next/router';

type Witch={id:number;name:string;bio:string;image_url:string;price_cents:number};
type Team={id:number;name:string;league:string};

export default function Home(){
  const [witches,setWitches]=useState<Witch[]>([]);
  const [teams,setTeams]=useState<Team[]>([]);
  const [teamId,setTeamId]=useState<number|null>(null);
  const [witchId,setWitchId]=useState<number|null>(null);
  const [type,setType]=useState<'bless'|'curse'>('curse');
  const [errorMessage,setErrorMessage]=useState<string|null>(null);
  const router=useRouter();

  useEffect(()=>{(async()=>{
    const {data:w,error:we}=await supabase.from('witches').select('*').eq('active',true).limit(50);
    if(we){console.error('Failed to fetch witches',we);setErrorMessage('Unable to load witches.');} else setWitches(w||[]);
    const {data:t,error:te}=await supabase.from('teams').select('*').limit(500);
    if(te){console.error('Failed to fetch teams',te);setErrorMessage('Unable to load teams.');} else setTeams(t||[]);
  })()},[]);

  const selected=witches.find(w=>w.id===witchId);
  const goToPay=()=>{
    if(!teamId||!witchId) return alert('Pick a team & witch');
    const q=new URLSearchParams({teamId:String(teamId),witchId:String(witchId),type});
    router.push(`/pay?${q.toString()}`);
  };

  return(<>
    <Head><title>SportsHex</title><meta name="description" content="Hex your rivals. Bless your team."/></Head>
    <main className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="text-2xl font-bold">SportsHex</div>
        <nav className="flex gap-2">
          <Link href="/leaderboard" className="btn">Leaderboard</Link>
          <Link href="/admin" className="btn">Admin</Link>
        </nav>
      </header>
      {errorMessage&&<div className="mb-4 text-red-500">{errorMessage}</div>}
      <section className="grid md:grid-cols-3 gap-6 items-start">
        <div className="card md:col-span-1">
          <h2 className="text-lg font-semibold mb-3">1) Choose a team</h2>
          <select className="w-full bg-black/40 border border-gray-700 rounded p-2" onChange={e=>setTeamId(Number(e.target.value))} value={teamId??''}>
            <option value="" disabled>Select team...</option>
            {teams.map(t=>(<option key={t.id} value={t.id}>{t.league} — {t.name}</option>))}
          </select>

          <h2 className="text-lg font-semibold mt-6 mb-3">2) Bless or Curse</h2>
          <div className="flex gap-2">
            {(['bless','curse'] as const).map(k=>(
              <button key={k} onClick={()=>setType(k)} className={classNames('btn',type===k&&'bg-white/10')}>{k==='bless'?'Bless':'Curse'}</button>
            ))}
          </div>

          <h2 className="text-lg font-semibold mt-6 mb-3">3) Pick a Witch</h2>
          <div className="grid grid-cols-2 gap-3 max-h-72 overflow-auto pr-1">
            {witches.map(w=>(
              <button key={w.id} onClick={()=>setWitchId(w.id)} className={classNames('card text-left',witchId===w.id&&'ring-2 ring-indigo-500')}>
                <img src={w.image_url} alt={w.name} className="w-full h-24 object-cover rounded mb-2"/>
                <div className="font-semibold">{w.name}</div>
                <div className="text-sm opacity-80">{w.bio}</div>
                <div className="text-xs mt-2 opacity-70">${(w.price_cents/100).toFixed(2)}</div>
              </button>
            ))}
          </div>

          <button onClick={goToPay} className="btn w-full mt-6">{selected?`Continue ($${(selected.price_cents/100).toFixed(2)})`:'Continue to Pay'}</button>
          <p className="text-xs opacity-70 mt-2">For entertainment only. No refunds if the universe disagrees.</p>
        </div>

        <div className="card md:col-span-2">
          <h2 className="text-lg font-semibold mb-3">Featured Witches</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {witches.slice(0,4).map(w=>(
              <div key={w.id} className="flex gap-3">
                <img src={w.image_url} alt={w.name} className="w-24 h-24 object-cover rounded"/>
                <div><div className="font-semibold">{w.name}</div>
                <div className="text-sm opacity-80">{w.bio}</div></div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-sm opacity-80">SportsHex is a ritualtainment marketplace. Spells are tracked against outcomes to rank our casters.</div>
        </div>
      </section>
    </main>
  </>)
}
