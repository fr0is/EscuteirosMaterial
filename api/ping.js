import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Verifica token secreto
  const token = req.headers['x-ping-token'];
  if (!token || token !== process.env.PING_TOKEN) {
    console.warn("❌ [PING] Token inválido ou ausente");
    return res.status(403).json({ success: false, error: "Forbidden" });
  }

  console.log("🔔 [PING] Request autorizado recebido em:", new Date().toISOString());

  const { data, error } = await supabase.from("users").select("id").limit(1);

  if (error) {
    console.error("❌ [PING] Erro Supabase:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }

  console.log("✅ [PING] Query ao Supabase executada com sucesso");
  res.status(200).json({ success: true });
}
