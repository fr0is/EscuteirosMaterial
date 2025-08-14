import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const { error } = await supabase.from("users").select("id").limit(1);
  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
  res.status(200).json({ success: true });
}