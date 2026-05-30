// ============================================================
// ais-sync — Sincronização de posição dos embarques (Fase 2 / AIS)
// ------------------------------------------------------------
// Backend do spec de Importação: "Calcula progresso, status, ETA dinâmico"
//
// Dois modos, escolhidos automaticamente:
//   • AIS REAL  → quando os secrets AIS_API_KEY + AIS_PROVIDER_URL existem,
//                 busca a posição por IMO no provedor (MarineTraffic,
//                 VesselFinder, Datalastic, etc.) e persiste.
//   • SIMULAÇÃO → sem chave, interpola a rota porto-origem → porto-destino
//                 e avança posição/rumo/velocidade (mantém o demo "vivo").
//
// Para ativar AIS real, basta configurar os secrets (nenhuma mudança de código):
//   supabase secrets set AIS_API_KEY=...  AIS_PROVIDER_URL="https://.../vessel?imo={imo}"
// ============================================================
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const PORTS: Record<string, [number, number]> = {
  shanghai: [31.2, 121.5], xangai: [31.2, 121.5],
  ningbo: [29.8, 121.5], qingdao: [36.0, 120.4],
  hamburg: [53.55, 9.99], hamburgo: [53.55, 9.99],
  santos: [-23.95, -46.3], itaguai: [-22.86, -43.75], "itaguaí": [-22.86, -43.75],
};

function portOf(s: string | null, fallback: [number, number]): [number, number] {
  if (!s) return fallback;
  const k = s.toLowerCase();
  for (const name in PORTS) if (k.includes(name)) return PORTS[name];
  return fallback;
}

function bearing(a: [number, number], b: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const lat1 = toRad(a[0]), lat2 = toRad(b[0]);
  const dLon = toRad(b[1] - a[1]);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// Provider-agnostic: ajuste o mapeamento aos campos do seu provedor.
async function fetchAis(imo: string | null): Promise<Record<string, unknown> | null> {
  const key = Deno.env.get("AIS_API_KEY");
  const base = Deno.env.get("AIS_PROVIDER_URL"); // ex.: https://api.provider.com/vessel?imo={imo}
  if (!key || !base || !imo) return null;
  try {
    const url = base.replace("{imo}", encodeURIComponent(imo));
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
    if (!resp.ok) return null;
    const j = await resp.json();
    return {
      lat: j.lat ?? j.latitude ?? null,
      lng: j.lng ?? j.longitude ?? null,
      speed: j.speed ?? j.speed_kn ?? null,
      heading: j.heading ?? j.course ?? null,
      eta: j.eta ?? null,
    };
  } catch (_e) {
    return null;
  }
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const JSON_HEADERS = { ...CORS, "Content-Type": "application/json" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const mode = Deno.env.get("AIS_API_KEY") ? "ais" : "simulação";
  const { data: ships, error } = await supabase
    .from("embarques").select("*").neq("status", "Entregue");

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500, headers: JSON_HEADERS,
    });
  }

  let updated = 0;
  const now = new Date().toISOString();

  for (const e of ships ?? []) {
    const start = portOf(e.origin, [31.2, 121.5]);
    const end = portOf(e.destination, [-23.95, -46.3]);
    let patch: Record<string, unknown> = { last_ais_sync: now };

    const real = mode === "ais" ? await fetchAis(e.imo) : null;

    if (real && real.lat != null && real.lng != null) {
      patch = { ...patch, lat: real.lat, lng: real.lng, speed: real.speed, heading: real.heading };
      if (real.eta) patch.eta = real.eta;
    } else {
      // Atracado/aguardando aduana: navio parado — não navega, mantém coords.
      const arrived = e.status === "Aguardando liberação" || (e.position ?? 0) >= 0.99;
      if (arrived) {
        patch = { ...patch, speed: 0 };
      } else {
        const pos = Math.min(0.99, (e.position ?? 0) + 0.02 + Math.random() * 0.015);
        const lat = start[0] + (end[0] - start[0]) * pos;
        const lng = start[1] + (end[1] - start[1]) * pos;
        const hdg = Math.round(((bearing(start, end) + (Math.random() * 6 - 3)) + 360) % 360);
        patch = {
          ...patch,
          position: Math.round(pos * 1000) / 1000,
          lat: Math.round(lat * 100) / 100,
          lng: Math.round(lng * 100) / 100,
          heading: hdg,
          speed: Math.round((14 + Math.random() * 4) * 10) / 10,
        };
      }
    }

    const { error: upErr } = await supabase.from("embarques").update(patch).eq("id", e.id);
    if (!upErr) updated++;
  }

  return new Response(JSON.stringify({ ok: true, mode, updated }), {
    headers: JSON_HEADERS,
  });
});
