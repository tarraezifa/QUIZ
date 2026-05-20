const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const { nim, materi_slug: materiSlug } = req.body || {};
  if (!nim || typeof nim !== "string" || !materiSlug || typeof materiSlug !== "string") {
    res.status(400).json({ error: "NIM dan materi wajib diisi." });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    res.status(500).json({ error: "Konfigurasi server belum lengkap." });
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from("submissions")
    .select("id")
    .eq("nim", nim)
    .eq("materi_slug", materiSlug)
    .limit(1)
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: "Gagal mengecek NIM." });
    return;
  }

  res.status(200).json({ exists: Boolean(data) });
};
