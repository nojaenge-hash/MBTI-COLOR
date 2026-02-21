// ===============================
// MBTI Color App (Supabase v2)
// ===============================

// ===== Supabase Init =====
// ⚠️ anon(JWT, eyJ...) 키 사용 권장 (클라이언트 공개용)
// ⚠️ 실서비스에서는 반드시 RLS 정책으로 INSERT/SELECT 제한하세요.
const SUPABASE_URL = "https://gihmqoijkgblxwktsvvs.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpaG1xb2lqa2dibHh3a3RzdnZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzOTkyNDksImV4cCI6MjA4Njk3NTI0OX0._XToYf2aFWRqq1t6yZ8TTY4KLJAQxg4iGvp4ReX_rEs";

console.log("[SUPABASE] key head/len:", SUPABASE_KEY.slice(0, 10), SUPABASE_KEY.length);

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== Constants =====
const MBTIS = [
  "ISTJ","ISFJ","INFJ","INTJ",
  "ISTP","ISFP","INFP","INTP",
  "ESTP","ESFP","ENFP","ENTP",
  "ESTJ","ESFJ","ENFJ","ENTJ"
];

// ⚠️ 실제 서비스면 프론트에 관리자 코드 두는 건 의미 없습니다(누구나 소스 보면 앎).
const ADMIN_CODE = "노쟁이";

// ===== UI State =====
let data = [];
let filterMbti = "";

// ===== Elements =====
const listEl = document.getElementById("list");
const chipArea = document.getElementById("chipArea");
const mbtiSelect = document.getElementById("mbtiSelect");
const clearFilterBtn = document.getElementById("clearFilterBtn");
const statTotal = document.getElementById("statTotal");
const statFilter = document.getElementById("statFilter");

const form = document.getElementById("form");
const nameEl = document.getElementById("name");
const hexEl = document.getElementById("hex");
const pickerEl = document.getElementById("picker");
const swatchEl = document.getElementById("swatch");
const randomBtn = document.getElementById("randomBtn"); // (없을 수도 있음)
const mbtiPreviewEl = document.getElementById("mbtiPreview");
const modalToggle = document.getElementById("modalToggle");

// ===== Helpers =====
const isHex = (v) => /^#[0-9A-Fa-f]{6}$/.test(v);

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getSelectedMBTI() {
  const EI = document.querySelector('input[name="EI"]:checked')?.value ?? "E";
  const SN = document.querySelector('input[name="SN"]:checked')?.value ?? "S";
  const TF = document.querySelector('input[name="TF"]:checked')?.value ?? "T";
  const JP = document.querySelector('input[name="JP"]:checked')?.value ?? "J";
  return `${EI}${SN}${TF}${JP}`;
}

function setPreview() {
  if (mbtiPreviewEl) mbtiPreviewEl.textContent = getSelectedMBTI();
}

function setColorUI(hex) {
  if (swatchEl) swatchEl.style.background = hex;
  document.documentElement.style.setProperty("--accent", hex);
}

function normalizeHex(input) {
  const v = String(input || "").trim().toUpperCase();
  return v;
}

// ===== Data Load =====
async function loadData() {
  const { data: rows, error } = await db
    .from("mbti_colors")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("[LOAD] error:", error);
    alert("로드 실패: " + error.message);
    return;
  }

  data = rows || [];
  render();
}

// ===== Render =====
function renderSelect() {
  if (!mbtiSelect) return;
  if (mbtiSelect.options.length > 1) return;

  MBTIS.forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    mbtiSelect.appendChild(opt);
  });
}

function renderChip() {
  if (!chipArea) return;
  chipArea.innerHTML = "";
  if (!filterMbti) return;

  const chip = document.createElement("button");
  chip.className = "chip";
  chip.innerHTML = `<span>${filterMbti}</span><i>×</i>`;
  chip.onclick = () => {
    filterMbti = "";
    if (mbtiSelect) mbtiSelect.value = "";
    render();
  };
  chipArea.appendChild(chip);
}

function renderList() {
  if (!listEl) return;

  const view = filterMbti ? data.filter((x) => x.mbti === filterMbti) : data;

  listEl.innerHTML = "";

  view.forEach((item) => {
    const row = document.createElement("div");
    row.className = "row";

    row.innerHTML = `
      <div class="cell id">${item.id ?? ""}</div>
      <div class="cell mbti">
        <button class="mbtiPill">${escapeHtml(item.mbti ?? "")}</button>
      </div>
      <div class="cell name">${escapeHtml(item.name ?? "")}</div>
      <div class="cell color">
        <span class="dot" style="--c:${escapeHtml(item.hex ?? "#000000")}"></span>
      </div>
      <div class="cell del">
        <button class="delBtn">삭제</button>
      </div>
    `;

    row.querySelector(".mbtiPill").onclick = () => {
      filterMbti = item.mbti;
      if (mbtiSelect) mbtiSelect.value = item.mbti;
      render();
    };

    row.querySelector(".delBtn").onclick = async () => {
      const code = prompt("관리자 코드를 입력하세요");
      if (code !== ADMIN_CODE) {
        alert("관리자 코드가 올바르지 않습니다.");
        return;
      }

      const ok = confirm("정말 삭제하시겠습니까?");
      if (!ok) return;

      const { error } = await db.from("mbti_colors").delete().eq("id", item.id);

      if (error) {
        console.error("[DELETE] error:", error);
        alert("삭제 실패: " + error.message);
        return;
      }

      await loadData();
    };

    listEl.appendChild(row);
  });

  if (statTotal) statTotal.textContent = String(data.length);
  if (statFilter) statFilter.textContent = filterMbti || "전체";
}

function render() {
  renderSelect();
  renderChip();
  renderList();
}

// ===== Events =====
if (mbtiSelect) {
  mbtiSelect.onchange = (e) => {
    filterMbti = e.target.value;
    render();
  };
}

if (clearFilterBtn) {
  clearFilterBtn.onclick = () => {
    filterMbti = "";
    if (mbtiSelect) mbtiSelect.value = "";
    render();
  };
}

document
  .querySelectorAll('input[name="EI"],input[name="SN"],input[name="TF"],input[name="JP"]')
  .forEach((r) => r.addEventListener("change", setPreview));

if (pickerEl && hexEl) {
  pickerEl.oninput = () => {
    const v = pickerEl.value.toUpperCase();
    hexEl.value = v;
    setColorUI(v);
  };

  hexEl.oninput = () => {
    const v = normalizeHex(hexEl.value);
    if (isHex(v)) {
      pickerEl.value = v;
      setColorUI(v);
    }
  };
}

// randomBtn이 HTML에 없을 수 있으니 안전 처리
if (randomBtn && hexEl && pickerEl) {
  randomBtn.onclick = () => {
    const rand =
      "#" +
      Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, "0")
        .toUpperCase();

    hexEl.value = rand;
    pickerEl.value = rand;
    setColorUI(rand);
  };
}

if (form) {
  form.onsubmit = async (e) => {
    e.preventDefault();

    const name = (nameEl?.value ?? "").trim();
    const mbti = getSelectedMBTI();
    const hex = normalizeHex(hexEl?.value);

    if (!name) {
      alert("이름을 입력하세요.");
      nameEl?.focus();
      return;
    }

    if (!isHex(hex)) {
      alert("HEX 형식이 올바르지 않습니다. 예: #41C6FF");
      hexEl?.focus();
      hexEl?.select?.();
      return;
    }

    const { error } = await db.from("mbti_colors").insert([{ mbti, name, hex }]);

    if (error) {
      console.error("[INSERT] error:", error);
      alert("등록 실패: " + error.message);
      return;
    }

    // UI 정리
    if (modalToggle) modalToggle.checked = false;

    if (nameEl) nameEl.value = "";
    if (hexEl) hexEl.value = "#9441FF";
    if (pickerEl) pickerEl.value = "#9441FF";
    setColorUI("#9441FF");
    setPreview();

    await loadData();
  };
}

// ===== Init =====
render();
setPreview();
setColorUI("#9441FF");
loadData();
