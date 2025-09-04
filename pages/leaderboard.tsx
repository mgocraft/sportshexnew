import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { computeHitRate } from "../utils/recordUtils";
type Row = {
  witch_id: number;
  name: string;
  spells: number;
  hits: number;
  weighted_hits: number;
  image_url: string;
};
export default function Leaderboard() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("witch_leaderboard");
      if (!error && data) setRows(data as any);
    })();
  }, []);
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Witch Leaderboard</h1>
      <div className="grid gap-3">
        {rows.map((r, i) => (
          <div key={r.witch_id} className="card flex items-center gap-4">
            <div className="text-2xl w-8 text-center">{i + 1}</div>
            <img src={r.image_url} className="w-12 h-12 rounded object-cover" />
            <div className="flex-1">
              <div className="font-semibold">{r.name}</div>
              <div className="text-sm opacity-75">
                {r.spells} spells • {r.hits} hits •{" "}
                {computeHitRate(r.spells, r.hits)}% hit rate • Weighted score:{" "}
                {Number(r.weighted_hits || 0).toFixed(1)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
