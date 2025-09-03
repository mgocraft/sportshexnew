
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

type OrderRow = {
  id: number;
  created_at: string;
  team_id: number|null;
  witch_id: number|null;
  type: 'bless'|'curse';
  status: string;
  paid_at: string|null;
  result: string|null;
  factor: number|null;
  note: string|null;
  witch_name: string|null;
  team_name: string|null;
};

export default function Admin(){
  const router = useRouter();
  const [ok,setOk]=useState(false);
  const [rows,setRows]=useState<OrderRow[]>([]);
  const [loading,setLoading]=useState(false);

  useEffect(()=>{
    const key = router.query.key as string | undefined;
    if(!key) return;
    if(key === process.env.NEXT_PUBLIC_ADMIN_KEY){
      setOk(true);
    } else {
      setOk(false);
    }
  },[router.query.key]);

  useEffect(()=>{ if(!ok) return;
    (async()=>{
      const { data, error } = await supabase
        .from('orders')
        .select('id,created_at,team_id,witch_id,type,status,paid_at,result,factor,note, witches(name), teams(name)')
        .order('created_at', { ascending:false })
        .limit(100);
      if(!error && data){
        const mapped = (data as any[]).map(d => ({
          id: d.id, created_at: d.created_at, team_id: d.team_id, witch_id: d.witch_id, type: d.type,
          status: d.status, paid_at: d.paid_at, result: d.result, factor: d.factor, note: d.note,
          witch_name: d.witches?.name ?? null, team_name: d.teams?.name ?? null
        }));
        setRows(mapped);
      }
    })();
  },[ok]);

  const saveRow = async (row: OrderRow) => {
    setLoading(true);
    const { error } = await supabase.from('orders').update({
      result: row.result,
      factor: row.factor
    }).eq('id', row.id);
    setLoading(false);
    if(error) alert('Save failed: ' + error.message);
  };

  if(!router.query.key) return <main className="max-w-3xl mx-auto p-6">Missing ?key= in URL.</main>;
  if(!ok) return <main className="max-w-3xl mx-auto p-6">Invalid admin key.</main>;

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Admin: Orders</h1>
      <p className="text-sm opacity-70 mb-4">Edit result (hit/miss) and weighting factor. Note was provided by the buyer.</p>
      <div className="grid gap-3">
        {rows.map(r => (
          <div key={r.id} className="card">
            <div className="text-sm opacity-70">{new Date(r.created_at).toLocaleString()}</div>
            <div className="font-semibold mt-1">{r.witch_name || 'Unknown Witch'} -> {r.type.toUpperCase()} on {r.team_name || 'Unknown Team'}</div>
            {r.note && <div className="text-sm mt-1 opacity-80">Note: {r.note}</div>}
            <div className="flex items-center gap-3 mt-3">
              <label className="text-sm">Result:</label>
              <select value={r.result ?? ''} onChange={e=>{ const v=e.target.value||null; setRows(rows.map(x=>x.id===r.id?{...x,result:v as any}:x))}} className="bg-black/40 border border-gray-700 rounded p-1">
                <option value="">(none)</option>
                <option value="hit">hit</option>
                <option value="miss">miss</option>
              </select>
              <label className="text-sm ml-4">Factor:</label>
              <input type="number" step="0.1" min="0" value={r.factor ?? 1} onChange={e=>{ const v=parseFloat(e.target.value); setRows(rows.map(x=>x.id===r.id?{...x,factor:isNaN(v)?null:v}:x))}} className="bg-black/40 border border-gray-700 rounded p-1 w-24"/>
              <button onClick={()=>saveRow(r)} className="btn ml-auto">{loading?'Saving...':'Save'}</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
