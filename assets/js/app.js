/* ===== DETAIL PAGE ===== */
if (document.getElementById("detailContainer")) {
  const id = new URLSearchParams(window.location.search).get("id");
  fetch(`${API_BASE}?action=getDetail&id=${id}`)
    .then(r=>r.json())
    .then(({ok,data})=>{
      if (!ok) throw new Error("Data tidak ditemukan");
      renderDetail(data);
    })
    .catch(err=>{
      document.getElementById("detailContainer").innerHTML = "❌ " + err;
    });
}

function renderDetail(d){
  const c = document.getElementById("detailContainer");
  let imgHtml = "";
  if (d.GambarURL) {
    imgHtml = `<img id="detailImg" class="detail-img" alt="gambar">`;
  }
  c.innerHTML = `
    <article class="card">
      ${imgHtml}
      <h2>${escapeHtml(d.Judul)}</h2>
      <div class="date">${formatDate(d.TanggalPost)}</div>
      <p>${escapeHtml(d.Isi).replace(/\n/g,"<br>")}</p>
    </article>
  `;
  if (d.GambarURL) {
    loadImageBase64(d.GambarURL, "detailImg");
    const img = document.getElementById("detailImg");
    img.addEventListener("click", ()=>{
      const modal=document.getElementById("imgModal");
      const modalImg=document.getElementById("modalImg");
      modal.style.display="flex";
      modalImg.src=img.src;
    });
  }
}

document.getElementById("closeModal")?.addEventListener("click",()=>{
  document.getElementById("imgModal").style.display="none";
});
