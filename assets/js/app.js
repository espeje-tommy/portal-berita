// ==== KONFIGURASI API ====
const API_BASE = "https://script.google.com/macros/s/AKfycbzpgdh4RbGx0G38QesDE5vYSBdKW1ikzNMFNfPGDN3rRKR8iLx5gpkY8BaeIxtJZRvUMA/exec";

// Theme switcher (jika ada tombol di index.html)
const toggle = document.getElementById("themeToggle");
if (toggle) {
  toggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    toggle.textContent = document.body.classList.contains("dark") ? "🌙" : "☀️";
  });
}

// Helper
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

  // default Berita
  loadList("Berita");
}

function loadList(category) {
  const listDiv = document.getElementById("contentList");
  listDiv.innerHTML = "⏳ Memuat...";

  const cacheKey = "cache_" + category;
  const cache = localStorage.getItem(cacheKey);

  // Tampilkan cache dulu (jika ada)
  if (cache) {
    try {
      const data = JSON.parse(cache);
      renderList(category, data);
    } catch(e){}
  }

  if (category === "Peraturan") {
    fetch(`${API_BASE}?action=getPeraturan`)
      .then(r => r.json())
      .then(({ok, data}) => {
        if (ok) {
          renderList(category, data);
          localStorage.setItem(cacheKey, JSON.stringify(data));
        } else {
          listDiv.innerHTML = "❌ Gagal memuat peraturan";
        }
      })
      .catch(err => listDiv.innerHTML = "❌ " + err);
    return;
  }

  fetch(`${API_BASE}?action=getPosts&category=${encodeURIComponent(category)}`)
    .then(r => r.json())
    .then(({ok, data}) => {
      if (ok) {
        // limit 20 sudah dilakukan di backend, tapi kita safety di sini
        const limited = (data || []).slice(0, 20);
        renderList(category, limited);
        localStorage.setItem(cacheKey, JSON.stringify(limited));
      } else {
        listDiv.innerHTML = "❌ Gagal memuat data";
      }
    })
    .catch(err => listDiv.innerHTML = "❌ " + err);
}

function renderList(category, data) {
  const listDiv = document.getElementById("contentList");
  if (!data || !data.length) {
    listDiv.innerHTML = "<p>Tidak ada data.</p>";
    return;
  }

  if (category === "Peraturan") {
    listDiv.innerHTML = data.map(p => `
      <div class="card">
        <h3>${escapeHtml(p.judul)}</h3>
        <div class="date">${p.modifiedTime}</div>
        <a href="${p.url}" class="btn" target="_blank">📑 Lihat PDF</a>
      </div>
    `).join("");
    return;
  }

  listDiv.innerHTML = data.map(item => {
    let imgTag = "";
    if (item.GambarURL) {
      if (item.GambarURL.includes("action=getImage")) {
        const imgId = "img_" + item.ID;
        imgTag = `<img id="${imgId}" class="thumb" alt="gambar">`;
        loadImageBase64(item.GambarURL, imgId);
      } else {
        imgTag = `<img src="${item.GambarURL}" class="thumb" alt="gambar">`;
      }
    }

    return `
      <div class="card">
        ${imgTag}
        <h3>${escapeHtml(item.Judul || '')}</h3>
        <div class="date">${item.TanggalPost || ''}</div>
        <p>${escapeHtml((item.Isi || '').substring(0,120))}...</p>
        <a href="detail.html?id=${encodeURIComponent(item.ID)}" class="btn">Baca Selengkapnya</a>
      </div>
    `;
  }).join("");
}

function loadImageBase64(apiUrl, elementId) {
  fetch(apiUrl)
    .then(r => r.json())
    .then(res => {
      if (res.ok) {
        const img = document.getElementById(elementId);
        if (img) img.src = res.dataUrl;
      }
    })
    .catch(err => console.error("Load image error:", err));
}

// ===== Detail Page =====
if (document.getElementById("detailContainer")) {
  const id = getQueryParam("id");
  const container = document.getElementById("detailContainer");
  if (!id) {
    container.innerHTML = "<p>Parameter ID tidak ditemukan.</p>";
  } else {
    fetch(`${API_BASE}?action=getDetail&id=${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(({ok, data}) => {
        if (!ok) throw new Error("Tidak ditemukan");
        renderDetail(data);
      })
      .catch(err => container.innerHTML = "❌ " + err);
  }
}

function renderDetail(data) {
  const container = document.getElementById("detailContainer");
  let imgBlock = "";
  if (data.GambarURL) {
    if (data.GambarURL.includes("action=getImage")) {
      const imgId = "detailImg";
      imgBlock = `<img id="${imgId}" class="detail-img" alt="gambar">`;
      container.innerHTML = `
        <article class="card">
          ${imgBlock}
          <h2>${escapeHtml(data.Judul || '')}</h2>
          <div class="date">${data.TanggalPost || ''}</div>
          <p>${escapeHtml(data.Isi || '').replace(/\n/g,"<br>")}</p>
        </article>
      `;
      loadImageBase64(data.GambarURL, imgId);
      return;
    } else {
      imgBlock = `<img src="${data.GambarURL}" class="detail-img" alt="gambar">`;
    }
  }
  container.innerHTML = `
    <article class="card">
      ${imgBlock}
      <h2>${escapeHtml(data.Judul || '')}</h2>
      <div class="date">${data.TanggalPost || ''}</div>
      <p>${escapeHtml(data.Isi || '').replace(/\n/g,"<br>")}</p>
    </article>
  `;
}

// Helpers
function escapeHtml(s){
  return String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
