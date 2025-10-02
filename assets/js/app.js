// API BASE
const API_BASE = "https://script.google.com/macros/s/AKfycbzpgdh4RbGx0G38QesDE5vYSBdKW1ikzNMFNfPGDN3rRKR8iLx5gpkY8BaeIxtJZRvUMA/exec";

/* ==== THEME SWITCHER ==== */
const themeToggle = document.getElementById("themeToggle");
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
    themeToggle.textContent = document.body.classList.contains("dark") ? "🌙" : "☀️";
  });
  // load theme awal
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "🌙";
  }
}

/* ==== INDEX PAGE ==== */
if (document.getElementById("contentList")) {
  // default tampil berita
  loadPosts("Berita");

  // navigasi kategori
  document.querySelectorAll("nav a").forEach(a => {
    a.addEventListener("click", e => {
      e.preventDefault();
      document.querySelectorAll("nav a").forEach(x => x.classList.remove("active"));
      a.classList.add("active");
      loadPosts(a.dataset.tab);
    });
  });
}

function loadPosts(category) {
  fetch(`${API_BASE}?action=getPosts&category=${category}`)
    .then(r => r.json())
    .then(({ ok, data }) => {
      const c = document.getElementById("contentList");
      c.innerHTML = "";
      if (!ok || !data.length) {
        c.innerHTML = "<p>Tidak ada data.</p>";
        return;
      }
      data.forEach(d => {
        c.innerHTML += `
          <div class="card">
            ${d.GambarURL ? `<img src="${d.GambarURL}" class="thumb" alt="thumbnail">` : ""}
            <h3>${d.Judul}</h3>
            <div class="date">${d.TanggalPost}</div>
            <p>${d.Isi.substring(0, 120)}...</p>
            <a href="detail.html?id=${d.ID}" class="btn">Baca Selengkapnya</a>
          </div>`;
      });
    })
    .catch(err => {
      console.error("Error loadPosts:", err);
      document.getElementById("contentList").innerHTML = "<p>❌ Gagal memuat data.</p>";
    });
}

/* ==== DETAIL PAGE ==== */
if (document.getElementById("detailContainer")) {
  const id = new URLSearchParams(window.location.search).get("id");
  fetch(`${API_BASE}?action=getDetail&id=${id}`)
    .then(r => r.json())
    .then(({ ok, data }) => {
      if (!ok) {
        document.getElementById("detailContainer").innerHTML = "<p>❌ Data tidak ditemukan</p>";
        return;
      }
      document.getElementById("detailContainer").innerHTML = `
        <div class="card">
          ${data.GambarURL ? `<img src="${data.GambarURL}" class="detail-img" alt="gambar">` : ""}
          <h2>${data.Judul}</h2>
          <div class="date">${data.TanggalPost}</div>
          <p>${data.Isi.replace(/\n/g, "<br>")}</p>
          <a href="index.html" class="btn">← Kembali</a>
        </div>`;
    })
    .catch(err => {
      console.error("Error loadDetail:", err);
      document.getElementById("detailContainer").innerHTML = "<p>❌ Gagal memuat detail.</p>";
    });
}
