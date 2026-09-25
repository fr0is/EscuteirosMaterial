import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  console.log("🔔 [PING] Request recebido em:", new Date().toISOString());

  // Verifica o token enviado pelo GitHub
  const authHeader = req.headers.authorization;

  if (authHeader !== `Bearer ${process.env.PING_TOKEN}`) {
    console.log("❌ [PING] Não autorizado");

    return res.status(401).json({
      success: false,
      error: "Unauthorized",
    });
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .limit(1);

    if (error) {
      console.error("❌ [PING] Erro Supabase:", error.message);

      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    console.log(
      "✅ [PING] Query executada com sucesso",
      data?.length ? "→ resultado encontrado" : "→ tabela vazia"
    );

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ [PING] Erro:", error.message);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}