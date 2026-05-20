const questions = [
  {
    question:
      "Manakah yang termasuk pengertian Kegiatan Membangun Sendiri (KMS) yang benar?",
    choices: [
      "Kegiatan membangun bangunan oleh kontraktor PKP",
      "Kegiatan membeli rumah jadi dari developer",
      "Kegiatan membangun/menambah bangunan sendiri untuk digunakan pribadi atau pihak lain",
      "Kegiatan renovasi kecil tanpa biaya",
    ],
    correctIndex: 2,
    feedback: {
      correctTitle: "Benar!",
      correctText:
        "Kegiatan Membangun Sendiri (KMS) adalah kegiatan membangun atau menambah bangunan sendiri untuk digunakan pribadi atau pihak lain.",
      wrongTitle: "Ups, jawabanmu belum tepat.",
      wrongText:
        "Jawaban yang benar adalah C. Kegiatan membangun/menambah bangunan sendiri untuk digunakan pribadi atau pihak lain.",
    },
  },
  {
    question:
      "Sebuah rumah dibangun dengan biaya Rp500.000.000, tidak termasuk tanah. Tarif efektif PPN KMS adalah 2,2%. Berapa PPN KMS yang terutang?",
    choices: [
      "Rp5.000.000",
      "Rp11.000.000",
      "Rp17.600.000",
      "Rp22.000.000",
    ],
    correctIndex: 1,
    feedback: {
      correctTitle: "Benar! Hebat!",
      correctText:
        "PPN KMS yang terutang adalah Rp11.000.000. Perhitungan: Rp500.000.000 x 2,2% = Rp11.000.000.",
      wrongTitle: "Yah, masih salah.",
      wrongText:
        "Jawaban yang benar adalah B. Rp11.000.000. Perhitungan: Rp500.000.000 x 2,2% = Rp11.000.000.",
    },
  },
  {
    question: "Pernyataan yang benar mengenai PPN KMS adalah...",
    choices: [
      "PPN dibayar setelah bangunan selesai",
      "PPN hanya dihitung sekali di akhir pembangunan",
      "PPN terutang setiap masa pajak berdasarkan biaya yang dikeluarkan dan disetor paling lambat tanggal 15 bulan berikutnya",
      "PPN KMS tidak perlu dilaporkan jika pembangunan belum selesai",
    ],
    correctIndex: 2,
    feedback: {
      correctTitle: "Keren, jawabanmu benar!",
      correctText:
        "Pernyataan yang benar adalah PPN KMS terutang setiap masa pajak berdasarkan biaya yang dikeluarkan dan disetor paling lambat tanggal 15 bulan berikutnya.",
      wrongTitle: "Belum tepat, coba lagi ya!",
      wrongText:
        "Jawaban yang benar adalah C. PPN terutang setiap masa pajak berdasarkan biaya yang dikeluarkan dan disetor paling lambat tanggal 15 bulan berikutnya.",
    },
  },
];

const screens = {
  cover: document.getElementById("cover"),
  quiz: document.getElementById("quiz"),
  result: document.getElementById("result"),
};

const startBtn = document.getElementById("startBtn");
const identityForm = document.getElementById("identityForm");
const nameInput = document.getElementById("nameInput");
const nimInput = document.getElementById("nimInput");
const startError = document.getElementById("startError");

const questionTitle = document.getElementById("questionTitle");
const questionText = document.getElementById("questionText");
const optionsEl = document.getElementById("options");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const progressBar = document.querySelector(".progress-bar");

const modal = document.getElementById("feedbackModal");
const modalCard = document.querySelector(".modal-card");
const modalIcon = document.getElementById("modalIcon");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const modalClose = document.getElementById("modalClose");

const scoreValue = document.getElementById("scoreValue");
const correctCount = document.getElementById("correctCount");

const letters = ["A", "B", "C", "D"];
let currentIndex = 0;
let answers = new Array(questions.length).fill(null);
let participant = { nama: "", nim: "" };

const iconCheck = `
  <svg viewBox="0 0 64 64" class="icon-svg">
    <circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" stroke-width="2" />
    <path d="M20 34l8 8 16-18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
`;

const iconCross = `
  <svg viewBox="0 0 64 64" class="icon-svg">
    <circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" stroke-width="2" />
    <path d="M24 24l16 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    <path d="M40 24l-16 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  </svg>
`;

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove("active"));
  screens[name].classList.add("active");
}

function setStartError(message) {
  startError.textContent = message;
}

function setStartLoading(isLoading) {
  startBtn.disabled = isLoading;
  startBtn.textContent = isLoading ? "Memeriksa..." : "Mulai Quiz";
}

async function checkNimExists(nim) {
  const response = await fetch("/api/check-nim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nim }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || "Gagal memeriksa NIM.");
  }
  return data.exists === true;
}

async function submitResults() {
  const response = await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nama: participant.nama,
      nim: participant.nim,
      answers,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || "Gagal mengirim hasil.");
  }
  return data;
}

function updateProgress() {
  const total = questions.length;
  const current = currentIndex + 1;
  progressText.textContent = `Soal ${current} dari ${total}`;
  progressFill.style.width = `${(current / total) * 100}%`;
  progressBar.setAttribute("aria-valuenow", String(current));
}

function renderQuestion() {
  const current = questions[currentIndex];
  questionTitle.textContent = `Soal ${currentIndex + 1}`;
  questionText.textContent = current.question;

  optionsEl.innerHTML = "";
  current.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option";
    button.dataset.index = String(index);
    button.dataset.choice = letters[index];
    button.innerHTML = `
      <span class="option-letter">${letters[index]}</span>
      <span class="option-text">${choice}</span>
    `;
    button.setAttribute(
      "aria-pressed",
      answers[currentIndex] === index ? "true" : "false"
    );
    if (answers[currentIndex] === index) {
      button.classList.add("selected");
      if (answers[currentIndex] === current.correctIndex) {
        button.classList.add("correct");
      } else {
        button.classList.add("wrong");
      }
    }
    button.addEventListener("click", () => handleAnswer(index));
    optionsEl.appendChild(button);
  });
  updateProgress();
}

function handleAnswer(selectedIndex) {
  answers[currentIndex] = selectedIndex;
  renderQuestion();
  const current = questions[currentIndex];
  const isCorrect = selectedIndex === current.correctIndex;
  showModal(isCorrect, current.feedback);
}

function showModal(isCorrect, feedback) {
  modalCard.classList.remove("is-correct", "is-wrong");
  modalCard.classList.add(isCorrect ? "is-correct" : "is-wrong");
  modalIcon.innerHTML = isCorrect ? iconCheck : iconCross;
  modalTitle.textContent = isCorrect
    ? feedback.correctTitle
    : feedback.wrongTitle;
  modalText.textContent = isCorrect
    ? feedback.correctText
    : feedback.wrongText;
  modal.classList.remove("hidden");
}

function hideModal() {
  modal.classList.add("hidden");
}

function advanceFromModal() {
  hideModal();
  nextQuestion();
}

function showResults() {
  showScreen("result");

  scoreValue.textContent = "Menghitung...";
  correctCount.textContent = "Memproses...";

  submitResults()
    .then((result) => {
      scoreValue.textContent = String(result.score);
      correctCount.textContent = `${result.correct_count} dari ${questions.length}`;
    })
    .catch(() => {
      scoreValue.textContent = "--";
      correctCount.textContent = "Gagal memuat";
    });
}

function nextQuestion() {
  if (currentIndex < questions.length - 1) {
    currentIndex += 1;
    renderQuestion();
  } else {
    showResults();
  }
}

identityForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const nama = nameInput.value.trim();
  const nim = nimInput.value.trim();

  if (!nama || !nim) {
    setStartError("Nama dan NIM wajib diisi.");
    return;
  }

  setStartError("");
  setStartLoading(true);

  try {
    const exists = await checkNimExists(nim);
    if (exists) {
      setStartError(
        "Kamu sudah pernah mengerjakan quiz ini. Hasil pertama sudah tersimpan."
      );
      return;
    }

    participant = { nama, nim };
    currentIndex = 0;
    answers = new Array(questions.length).fill(null);
    renderQuestion();
    showScreen("quiz");
  } catch (error) {
  console.error("Error cek NIM:", error);
  setStartError(error.message || "Tidak dapat memproses NIM. Coba lagi.");
  } finally {
  setStartLoading(false);
  }
});

modalClose.addEventListener("click", advanceFromModal);

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    advanceFromModal();
  }
});

renderQuestion();
