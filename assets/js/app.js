// ==== KONFIGURASI ====
// Ganti dengan URL Web App dari Apps Script
const API_BASE = "https://script.google.com/macros/s/AKfycbzpgdh4RbGx0G38QesDE5vYSBdKW1ikzNMFNfPGDN3rRKR8iLx5gpkY8BaeIxtJZRvUMA/exec"; 

// Theme switcher
const toggle = document.getElementById("themeToggle");
if (toggle) {
  toggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    toggle.textContent = document.body.classList.contains("dark") ? "🌙" : "☀️";
  });
}

// Ambil parameter URL
function getQueryParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

// ===== Index Page (Daftar) =====
if (document.getElementById("contentList")) {
  const tabs = document.querySelectorAll(".tab-link");
  tabs.forEach(t => {
    t.addEventListener("click", e => {
      e.preventDefault();
      tabs.forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      loadList(t.dataset.tab);
    });
  });

  // Default: load Berita
  loadList("Berita");
}

function loadList(category) {
  const listDiv = document.getElementById("contentList");
  listDiv.innerHTML = "⏳ Memuat...";

  // cacheKey per kategori
  const cacheKey = "cache_" + category;
  const cache = localStorage.getItem(cacheKey);

  // Jika ada cache → tampilkan dulu
  if (cache) {
    try {
      const data = JSON.parse(cache);
      renderList(category, data);
    } catch (e) {
      console.error("Cache corrupt:", e);
    }
  }

  // Tetap ambil data terbaru
  if (category === "Peraturan") {
    fetch(`${API_BASE}?action=getPeraturan`)
      .then(r => r.json())
      .then(({ok, data}) => {
        if (ok) {
          renderList(category, data);
          localStorage.setItem(cacheKey, JSON.stringify(data));
        }
      })
      .catch(err => listDiv.innerHTML = "❌ Error: " + err);
    return;
  }

  fetch(`${API_BASE}?action=getPosts&category=${category}`)
    .then(r => r.json())
    .then(({ok, data}) => {
      if (ok) {
        // 🔥 Batasi hanya 20 berita terbaru
        const limited = data.slice(0, 20);
        renderList(category, limited);
        localStorage.setItem(cacheKey, JSON.stringify(limited));
      }
    })
    .catch(err => listDiv.innerHTML = "❌ Error: " + err);
}

function renderList(category, data) {
  const listDiv = document.getElementById("contentList");
  if (!data || !data.length) {
    listDiv.innerHTML = "<p>Tidak ada data.</p>";
    return;
  }

  if (category === "Peraturan") {
    listDiv.innerHTML = data.map(p =>
      `<div class="card">
         <h3>${p.judul}</h3>
         <div class="date">${p.modifiedTime}</div>
         <a href="${p.url}" class="btn" target="_blank">📑 Lihat PDF</a>
       </div>`
    ).join("");
    return;
  }

  listDiv.innerHTML = data.map(item =>
    `<div class="card">
       ${item.GambarURL ? `<img src="${item.GambarURL}" class="thumb" loading="lazy">` : ""}
       <h3>${item.Judul}</h3>
       <div class="date">${item.TanggalPost}</div>
       <p>${item.Isi.substring(0,120)}...</p>
       <a href="detail.html?id=${item.ID}" class="btn">Baca Selengkapnya</a>
     </div>`
  ).join("");
}

// ===== Detail Page =====
if (document.getElementById("detailContainer")) {
  const id = getQueryParam("id");
  fetch(`${API_BASE}?action=getDetail&id=${id}`)
    .then(r => r.json())
    .then(({ok, data}) => {
      if (!ok) throw new Error("Tidak ditemukan");
      document.getElementById("detailContainer").innerHTML = `
        <article class="card">
          ${data.GambarURL ? `<img src="${data.GambarURL}" class="detail-img">` : ""}
          <h2>${data.Judul}</h2>
          <div class="date">${data.TanggalPost}</div>
          <p>${data.Isi.replace(/\n/g,"<br>")}</p>
        </article>
      `;
    })
    .catch(err => document.getElementById("detailContainer").innerHTML = "❌ Error: " + err);
}
