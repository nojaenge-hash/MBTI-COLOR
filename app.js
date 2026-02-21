// ===== Supabase Init (임시 고정 테스트용) =====
const SUPABASE_URL = "https://gihmqoijkgblxwktsvvs.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpaG1xb2lqa2dibHh3a3RzdnZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzOTkyNDksImV4cCI6MjA4Njk3NTI0OX0._XToYf2aFWRqq1t6yZ8TTY4KLJAQxg4iGvp4ReX_rEs";

console.log("KEY head/len", SUPABASE_KEY.slice(0,10), SUPABASE_KEY.length);

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== Constants =====
const MBTIS = [
  "ISTJ","ISFJ","INFJ","INTJ",
  "ISTP","ISFP","INFP","INTP",
  "ESTP","ESFP","ENFP","ENTP",
  "ESTJ","ESFJ","ENFJ","ENTJ"
];

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
const randomBtn = document.getElementById("randomBtn");
const mbtiPreviewEl = document.getElementById("mbtiPreview");
const modalToggle = document.getElementById("modalToggle");

// ===== Helpers =====
const isHex = (v) => /^#[0-9A-Fa-f]{6}$/.test(v);

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function getSelectedMBTI(){
  const EI = document.querySelector('input[name="EI"]:checked')?.value ?? "E";
  const SN = document.querySelector('input[name="SN"]:checked')?.value ?? "S";
  const TF = document.querySelector('input[name="TF"]:checked')?.value ?? "T";
  const JP = document.querySelector('input[name="JP"]:checked')?.value ?? "J";
  return `${EI}${SN}${TF}${JP}`;
}

function setPreview(){
  mbtiPreviewEl.textContent = getSelectedMBTI();
}

function setColorUI(hex){
  swatchEl.style.background = hex;
  document.documentElement.style.setProperty("--accent", hex);
}

// ===== Supabase Load =====
async function loadData(){
  const { data: rows, error } = await db
    .from("mbti_colors")
    .select("*")
    .order("id",{ ascending:true });

  if(error){
    console.error(error);
    alert("로드 실패: " + error.message);
    return;
  }

  data = rows;
  render();
}

// ===== Render =====
function renderSelect(){
  if(mbtiSelect.options.length > 1) return;

  MBTIS.forEach(m=>{
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    mbtiSelect.appendChild(opt);
  });
}

function renderChip(){
  chipArea.innerHTML = "";
  if(!filterMbti) return;

  const chip = document.createElement("button");
  chip.className = "chip";
  chip.innerHTML = `<span>${filterMbti}</span><i>×</i>`;
  chip.onclick = ()=>{
    filterMbti = "";
    mbtiSelect.value="";
    render();
  };
  chipArea.appendChild(chip);
}

function renderList(){
  const view = filterMbti
    ? data.filter(x=>x.mbti===filterMbti)
    : data;

  listEl.innerHTML = "";

  view.forEach(item=>{
    const row = document.createElement("div");
    row.className="row";

    row.innerHTML = `
      <div class="cell id">${item.id}</div>
      <div class="cell mbti">
        <button class="mbtiPill">${item.mbti}</button>
      </div>
      <div class="cell name">${escapeHtml(item.name)}</div>
      <div class="cell color">
        <span class="dot" style="--c:${item.hex}"></span>
      </div>
      <div class="cell del">
        <button class="delBtn">삭제</button>
      </div>
    `;

    row.querySelector(".mbtiPill").onclick=()=>{
      filterMbti=item.mbti;
      mbtiSelect.value=item.mbti;
      render();
    };

    row.querySelector(".delBtn").onclick=async()=>{
      const code = prompt("관리자 코드를 입력하세요");
      if(code!==ADMIN_CODE){
        alert("관리자 코드가 올바르지 않습니다.");
        return;
      }

      const ok = confirm("정말 삭제하시겠습니까?");
      if(!ok) return;

      await db.from("mbti_colors").delete().eq("id",item.id);
      loadData();
    };

    listEl.appendChild(row);
  });

  statTotal.textContent = data.length;
  statFilter.textContent = filterMbti || "전체";
}

function render(){
  renderChip();
  renderList();
}

// ===== Events =====
mbtiSelect.onchange=e=>{
  filterMbti=e.target.value;
  render();
};

clearFilterBtn.onclick=()=>{
  filterMbti="";
  mbtiSelect.value="";
  render();
};

document.querySelectorAll('input[name="EI"],input[name="SN"],input[name="TF"],input[name="JP"]')
.forEach(r=>r.addEventListener("change",setPreview));

pickerEl.oninput=()=>{
  hexEl.value=pickerEl.value.toUpperCase();
  setColorUI(pickerEl.value);
};

hexEl.oninput=()=>{
  if(isHex(hexEl.value)){
    pickerEl.value=hexEl.value;
    setColorUI(hexEl.value);
  }
};

randomBtn.onclick=()=>{
  const rand="#" + Math.floor(Math.random()*0xffffff)
  .toString(16).padStart(6,"0").toUpperCase();
  hexEl.value=rand;
  pickerEl.value=rand;
  setColorUI(rand);
};

form.onsubmit = async (e) => {
  e.preventDefault();

  const name = nameEl.value.trim();
  const mbti = getSelectedMBTI();
  const hex = hexEl.value.trim().toUpperCase();

  if (!name) {
    alert("이름을 입력하세요.");
    nameEl.focus();
    return;
  }

  if (!isHex(hex)) {
    alert("HEX 형식이 올바르지 않습니다. 예: #41C6FF");
    hexEl.focus();
    hexEl.select();
    return;
  }

  const { error } = await db.from("mbti_colors").insert([{ mbti, name, hex }]);

  if (error) {
    console.error(error);
    alert("등록 실패: " + error.message);
    return;
  }

  modalToggle.checked = false;
  await loadData();
};


// ===== Init =====
renderSelect();
setPreview();
setColorUI("#9441FF");
loadData();
