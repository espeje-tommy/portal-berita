/* ===== KONFIGURASI API ===== */
const API_BASE = "https://script.google.com/macros/s/AKfycbzpgdh4RbGx0G38QesDE5vYSBdKW1ikzNMFNfPGDN3rRKR8iLx5gpkY8BaeIxtJZRvUMA/exec";

/* ===== THEME ===== */
function applyThemeFromStorage() {
  const saved = localStorage.getItem("theme"); // "dark" | "light" | null
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const useDark = saved ? saved === "dark" : prefersDark;
  document.body.classList.toggle("dark", useDark);
  updateThemeIcon();
}
function updateThemeIcon() {
  const dark = document.body.classList.contains("dark");
  const icon = document.getElementById("themeIcon") || document.getElementById("themeToggle");
  if (icon) icon.textContent = dark ? "🌙" : "☀️";
}
function toggleTheme() {
  const willDark = !document.body.classList.contains("dark");
  document.body.classList.toggle("dark", willDark);
  localStorage.setItem("theme", willDark ? "dark" : "light");
  updateThemeIcon();
}
document.addEventListener("DOMContentLoaded", () => {
  applyThemeFromStorage();
  const t = document.getElementById("themeToggle");
  if (t) t.addEventListener("click", toggleTheme);

  // tutup modal bila klik luar gambar
  const modal = document.getElementById("imgModal");
  if (modal) modal.addEventListener("click", (e) => {
    if (e.target.id === "imgModal" || e.target.id === "closeModal") {
      modal.style.display = "none";
    }
  });
});

/* ===== UTIL ===== */
function getQueryParam(key){ return new URLSearchParams(window.location.search).get(key); }
function escapeHtml(s){ return String(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m])); }
function formatDate(s){
  if(!s) return "";
  const d = new Date(s);
  if (isNaN(d)) return s;
  return d.toLocaleString("id-ID", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }).replace('.', '');
}

/* ===== INDEX (LIST) ===== */
if (document.getElementById("contentList")) {
  const tabs = document.querySelectorAll(".tab-link");
  tabs.forEach(t => t.addEventListener("click", (e) => {
    e.preventDefault();
    tabs.forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    loadList(t.dataset.tab);
  }));
  loadList("Berita");
}

function loadList(category){
  const listDiv = document.getElementById("contentList");
  listDiv.innerHTML = "⏳ Memuat...";

  const cacheKey = "cache_" + category;
  const cache = localStorage.getItem(cacheKey);
  if (cache) {
    try { renderList(category, JSON.parse(cache)); } catch {}
  }

  if (category === "Peraturan") {
    fetch(`${API_BASE}?action=getPeraturan`)
      .then(r=>r.json())
      .then(({ok,data})=>{
        if(ok){ renderList(category,data); localStorage.setItem(cacheKey, JSON.stringify(data)); }
        else listDiv.innerHTML = "❌ Gagal memuat peraturan";
      })
      .catch(err=> listDiv.innerHTML = "❌ " + err);
    return;
  }

  fetch(`${API_BASE}?action=getPosts&category=${encodeURIComponent(category)}`)
    .then(r=>r.json())
    .then(({ok,data})=>{
      if(ok){
        const limited = (data||[]).slice(0,20);
        renderList(category, limited);
        localStorage.setItem(cacheKey, JSON.stringify(limited));
      } else listDiv.innerHTML = "❌ Gagal memuat data";
    })
    .catch(err=> listDiv.innerHTML = "❌ " + err);
}

function renderList(category, data){
  const listDiv = document.getElementById("contentList");
  if (!data || !data.length) { listDiv.innerHTML = "<p>Tidak ada data.</p>"; return; }

  if (category === "Peraturan") {
    listDiv.innerHTML = data.map(p => `
      <div class="card">
        <h3>${escapeHtml(p.judul)}</h3>
        <div class="date">${p.modifiedTime}</div>
        <a href="${p.url}" target="_blank" class="btn">📑 Lihat PDF</a>
      </div>
    `).join("");
    return;
  }

  listDiv.innerHTML = data.map(item => {
    let img = "";
    if (item.GambarURL) {
      const imgId = "img_" + item.ID;
      img = `<img id="${imgId}" class="thumb popup-img" alt="gambar">`;
      loadImageBase64(item.GambarURL, imgId);
    }
    return `
      <div class="card">
        ${img}
        <h3>${escapeHtml(item.Judul || "")}</h3>
        <div class="date">${formatDate(item.TanggalPost)}</div>
        <p>${escapeHtml((item.Isi || "").substring(0,120))}...</p>
        <a href="detail.html?id=${encodeURIComponent(item.ID)}" class="btn">Baca Selengkapnya</a>
      </div>
    `;
  }).join("");
}

/* ===== DETAIL ===== */
if (document.getElementById("detailContainer")) {
  const id = getQueryParam("id");
  const container = document.getElementById("detailContainer");
  if (!id) { container.innerHTML = "<p>Parameter ID tidak ditemukan.</p>"; }
  else {
    fetch(`${API_BASE}?action=getDetail&id=${encodeURIComponent(id)}`)
      .then(r=>r.json())
      .then(({ok,data})=>{
        if(!ok) throw new Error("Tidak ditemukan");
        renderDetail(data);
      })
      .catch(err=> container.innerHTML = "❌ " + err);
  }
}

function renderDetail(d){
  const c = document.getElementById("detailContainer");
  let imgHtml = "";
  if (d.GambarURL) {
    imgHtml = `<img id="detailImg" class="detail-img popup-img" alt="gambar">`;
  }
  c.innerHTML = `
    <article class="card">
      ${imgHtml}
      <h2>${escapeHtml(d.Judul || "")}</h2>
      <div class="date">${formatDate(d.TanggalPost)}</div>
      <p>${escapeHtml(d.Isi || "").replace(/\n/g,"<br>")}</p>
    </article>
  `;
  if (d.GambarURL) loadImageBase64(d.GambarURL, "detailImg");
}

/* ===== IMAGE HELPERS ===== */
function loadImageBase64(apiUrl, elementId){
  if (!apiUrl) return;
  // jika URL sudah data: base64, langsung set
  if (apiUrl.startsWith("data:")) {
    const el = document.getElementById(elementId);
    if (el) { el.src = apiUrl; enableImagePopup(el); }
    return;
  }
  // jika pakai proxy Apps Script (?action=getImage)
  fetch(apiUrl)
    .then(r=>r.json())
    .then(res=>{
      if(res && res.ok){
        const el = document.getElementById(elementId);
        if (el) { el.src = res.dataUrl; enableImagePopup(el); }
      }
    })
    .catch(err=> console.error("Load image error:", err));
}

function enableImagePopup(img){
  if(!img) return;
  img.addEventListener("click", ()=>{
    const m = document.getElementById("imgModal");
    const mi = document.getElementById("modalImg");
    if (m && mi) {
      mi.src = img.src;
      m.style.display = "flex";
      m.setAttribute("aria-hidden","false");
    }
  });
}
