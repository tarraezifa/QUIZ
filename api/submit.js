const { createClient } = require("@supabase/supabase-js");

const answerKeys = {
  "ppn-kms": [2, 1, 2],
  "konsep-dasar-ppn": [1, 1, 2],
  "subjek-objek-ppn": [1, 2, 0],
  "tarif-perhitungan-ppn": [2, 0, 3],
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const { nama, nim, materi_slug: materiSlug, materi_title: materiTitle, answers } =
    req.body || {};
  if (!nama || !nim || !materiSlug || !materiTitle || !Array.isArray(answers)) {
    res.status(400).json({ error: "Data tidak lengkap." });
    return;
  }

  const correctAnswers = answerKeys[materiSlug];
  if (!correctAnswers) {
    res.status(400).json({ error: "Materi tidak dikenali." });
    return;
  }

  if (answers.length !== correctAnswers.length) {
    res.status(400).json({ error: "Jumlah jawaban tidak sesuai." });
    return;
  }

  const normalizedAnswers = answers.map((value) => Number(value));
  if (normalizedAnswers.some((value) => Number.isNaN(value))) {
    res.status(400).json({ error: "Format jawaban tidak valid." });
    return;
  }

  const correctCount = normalizedAnswers.reduce((total, answer, index) => {
    if (answer === correctAnswers[index]) {
      return total + 1;
    }
    return total;
  }, 0);

  const score = Math.round((correctCount / correctAnswers.length) * 100);

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    res.status(500).json({ error: "Konfigurasi server belum lengkap." });
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { error } = await supabase.from("submissions").insert({
    nama,
    nim,
    materi_slug: materiSlug,
    materi_title: materiTitle,
    answers: normalizedAnswers,
    correct_count: correctCount,
    score,
  });

  if (error) {
    if (error.code === "23505") {
      res
        .status(409)
        .json({ error: "NIM sudah pernah digunakan untuk materi ini." });
      return;
    }
    res.status(500).json({ error: "Gagal menyimpan data." });
    return;
  }

  res.status(200).json({ correct_count: correctCount, score });
};
