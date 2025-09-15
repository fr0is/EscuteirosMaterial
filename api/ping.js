import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  console.log("🔔 [PING] Request recebido em:", new Date().toISOString());

  const { data, error } = await supabase.from("users").select("id").limit(1);

  if (error) {
    console.error("❌ [PING] Erro Supabase:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }

  console.log("✅ [PING] Query ao Supabase executada com sucesso", data?.length ? "→ resultados encontrados" : "→ tabela vazia");
  res.status(200).json({ success: true });
}
