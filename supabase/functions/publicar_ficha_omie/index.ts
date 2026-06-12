import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const omieUrl = "https://app.omie.com.br/api/v1";
const omieKey = Deno.env.get("OMIE_API_KEY") || "";
const omieSecret = Deno.env.get("OMIE_API_SECRET") || "";

const sb = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { ficha_id, pdf_base64, ator_nome, ator_setor } = await req.json();

    if (!ficha_id || !pdf_base64) {
      return new Response(
        JSON.stringify({ error: "ficha_id e pdf_base64 são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1. Recuperar ficha e código do produto
    const { data: ficha, error: fichaError } = await sb
      .from("fichas_tecnicas")
      .select("id, nome_produto, codigo_produto, numero_documento")
      .eq("id", ficha_id)
      .single();

    if (fichaError || !ficha) {
      return new Response(
        JSON.stringify({ error: "Ficha não encontrada" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const { codigo_produto, nome_produto, numero_documento } = ficha;

    if (!codigo_produto) {
      return new Response(
        JSON.stringify({ error: "Código do Produto (Omie) não preenchido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Chamar API Omie para anexar arquivo
    // Endpoint: POST /api/v1/produtos/arquivo/anexar
    const nomeArquivo = `FICHA-TECNICA-${codigo_produto.replace(/[^A-Z0-9-]/g, "")}.pdf`;

    const omiePayload = {
      app_key: omieKey,
      app_secret: omieSecret,
      codigo_produto,
      arquivo_nome: nomeArquivo,
      arquivo_base64: pdf_base64,
    };

    const omieResponse = await fetch(`${omieUrl}/produtos/arquivo/anexar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(omiePayload),
    });

    const omieResult = await omieResponse.json();

    if (!omieResponse.ok || omieResult.erro) {
      console.error("Erro Omie:", omieResult);
      return new Response(
        JSON.stringify({
          error: `Falha ao publicar no Omie: ${omieResult.erro || omieResponse.statusText}`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Registrar em vp_logs
    const { error: logError } = await sb.from("vp_logs").insert({
      ator_nome: ator_nome || "Sistema",
      ator_setor: ator_setor || "engenharia",
      modulo: "Ficha Técnica",
      acao: "publicou ficha no Omie",
      alvo: nome_produto || numero_documento || codigo_produto,
      alvo_id: ficha_id,
      detalhe: {
        codigo_produto,
        arquivo: nomeArquivo,
        resposta_omie: omieResult.codigo || "sucesso",
      },
    });

    if (logError) console.warn("Erro ao registrar log:", logError);

    // 4. Retornar sucesso
    return new Response(
      JSON.stringify({
        sucesso: true,
        mensagem: `Ficha publicada no Omie (${nomeArquivo})`,
        codigo_produto,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro geral:", error);
    return new Response(
      JSON.stringify({ error: `Erro ao publicar: ${error.message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
