/* ============================================================
   publicar_ficha_omie — anexa o PDF da ficha técnica ao produto
   correspondente no Omie (vínculo pelo Código do Produto).

   API Omie é JSON-RPC:
   - ConsultarProduto  → valida que o código existe e obtém o nId
   - IncluirAnexo      → sobe o PDF na tabela "produtos"
   Erros do Omie voltam como { faultstring, faultcode }.
   ============================================================ */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const omieKey = Deno.env.get("OMIE_API_KEY") || "";
const omieSecret = Deno.env.get("OMIE_API_SECRET") || "";

const sb = createClient(supabaseUrl, supabaseServiceKey);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS });
}

async function omieCall(endpoint: string, call: string, param: Record<string, unknown>) {
  const res = await fetch(`https://app.omie.com.br/api/v1/${endpoint}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ call, app_key: omieKey, app_secret: omieSecret, param: [param] }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && !data.faultstring, data };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  try {
    if (!omieKey || !omieSecret) {
      return json({ error: "OMIE_API_KEY / OMIE_API_SECRET não configuradas no Supabase" }, 500);
    }

    const { ficha_id, pdf_base64, ator_nome, ator_setor } = await req.json();
    if (!ficha_id || !pdf_base64) {
      return json({ error: "ficha_id e pdf_base64 são obrigatórios" }, 400);
    }

    // 1) Ficha + código do produto
    const { data: ficha, error: fichaError } = await sb
      .from("fichas_tecnicas")
      .select("id, nome_produto, codigo_produto, numero_documento")
      .eq("id", ficha_id)
      .single();
    if (fichaError || !ficha) return json({ error: "Ficha não encontrada" }, 404);

    const { codigo_produto, nome_produto, numero_documento } = ficha;
    if (!codigo_produto) {
      return json({ error: 'Preencha o "Código do Produto (Omie)" na ficha antes de publicar' }, 400);
    }

    // 2) Produto existe no Omie? (ConsultarProduto pelo código)
    const consulta = await omieCall("geral/produtos", "ConsultarProduto", { codigo: codigo_produto });
    if (!consulta.ok || !consulta.data.codigo_produto) {
      const fault = consulta.data?.faultstring || "";
      return json({
        error: `❌ Código ${codigo_produto} não existe no Omie — verifique o "Código do Produto (Omie)" da ficha.` +
          (fault ? ` (Omie: ${fault})` : ""),
      }, 404);
    }
    const nIdProduto = consulta.data.codigo_produto; // id numérico interno do Omie

    // 3) Anexar o PDF ao produto
    const nomeArquivo = `FICHA-TECNICA-${String(codigo_produto).replace(/[^A-Za-z0-9-]/g, "")}.pdf`;
    const anexo = await omieCall("geral/anexo", "IncluirAnexo", {
      cTabela: "produtos",
      nId: nIdProduto,
      cCodIntAnexo: `ft-${ficha_id}`.slice(0, 60),
      cNomeArquivo: nomeArquivo,
      cTipoArquivo: "pdf",
      cArquivo: pdf_base64,
    });
    if (!anexo.ok) {
      const fault = anexo.data?.faultstring || "erro desconhecido";
      // Anexo duplicado (mesmo cCodIntAnexo) é o caso mais comum
      return json({ error: `Falha ao anexar no Omie: ${fault}` }, 400);
    }

    // 4) Auditoria (best-effort)
    const { error: logError } = await sb.from("vp_logs").insert({
      ator_nome: ator_nome || "Sistema",
      ator_setor: ator_setor || "engenharia",
      modulo: "Ficha Técnica",
      acao: "publicou ficha no Omie",
      alvo: nome_produto || numero_documento || codigo_produto,
      alvo_id: String(ficha_id),
      detalhe: { codigo_produto, arquivo: nomeArquivo, omie_nid: nIdProduto },
    });
    if (logError) console.warn("vp_logs falhou:", logError.message);

    return json({
      sucesso: true,
      mensagem: `✅ Ficha anexada ao produto ${codigo_produto} no Omie (${nomeArquivo})`,
      codigo_produto,
    });
  } catch (error) {
    console.error("Erro geral:", error);
    return json({ error: `Erro ao publicar: ${(error as Error).message}` }, 500);
  }
});
