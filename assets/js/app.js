const API_BASE="https://script.google.com/macros/s/AKfycbzpgdh4RbGx0G38QesDE5vYSBdKW1ikzNMFNfPGDN3rRKR8iLx5gpkY8BaeIxtJZRvUMA/exec";

function getQueryParam(k){return new URLSearchParams(window.location.search).get(k);}
function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}

// ===== Index Page =====
if(document.getElementById("contentList")){
  const tabs=document.querySelectorAll(".tab-link");
  tabs.forEach(t=>t.addEventListener("click",e=>{
    e.preventDefault(); tabs.forEach(x=>x.classList.remove("active"));
    t.classList.add("active"); loadList(t.dataset.tab);
  }));
  loadList("Berita");
}
function loadList(cat){
  const div=document.getElementById("contentList"); div.innerHTML="⏳ Memuat...";
  fetch(`${API_BASE}?action=${cat==="Peraturan"?"getPeraturan":"getPosts&category="+cat}`)
    .then(r=>r.json()).then(({ok,data})=>{
      if(ok){renderList(cat,data);} else div.innerHTML="❌ gagal";}
    ).catch(err=>div.innerHTML="❌ "+err);
}
function renderList(cat,data){
  const div=document.getElementById("contentList");
  if(!data||!data.length){div.innerHTML="<p>Tidak ada data.</p>";return;}
  if(cat==="Peraturan"){div.innerHTML=data.map(p=>`<div class="card"><h3>${escapeHtml(p.judul)}</h3><div class="date">${p.modifiedTime}</div><a href="${p.url}" target="_blank" class="btn">📑 PDF</a></div>`).join("");return;}
  div.innerHTML=data.map(item=>{
    let img=""; if(item.GambarURL){const imgId="img_"+item.ID; img=`<img id="${imgId}" class="thumb popup-img" alt="gambar">`; loadImageBase64(item.GambarURL,imgId);}
    return `<div class="card">${img}<h3>${escapeHtml(item.Judul)}</h3><div class="date">${item.TanggalPost}</div><p>${escapeHtml((item.Isi||'').substring(0,120))}...</p><a href="detail.html?id=${item.ID}" class="btn">Baca Selengkapnya</a></div>`;
  }).join("");
}
function loadImageBase64(apiUrl,elId){
  fetch(apiUrl).then(r=>r.json()).then(res=>{
    if(res.ok){const el=document.getElementById(elId); if(el){el.src=res.dataUrl; enableImagePopup(el);}}
  });
}

// ===== Detail Page =====
if(document.getElementById("detailContainer")){
  fetch(`${API_BASE}?action=getDetail&id=${getQueryParam("id")}`).then(r=>r.json()).then(({ok,data})=>{
    if(!ok) throw new Error("Not found"); renderDetail(data);
  }).catch(err=>document.getElementById("detailContainer").innerHTML="❌ "+err);
}
function renderDetail(d){
  const c=document.getElementById("detailContainer"); let img="";
  if(d.GambarURL){img=`<img id="detailImg" class="detail-img popup-img" alt="gambar">`; loadImageBase64(d.GambarURL,"detailImg");}
  c.innerHTML=`<article class="card">${img}<h2>${escapeHtml(d.Judul)}</h2><div class="date">${d.TanggalPost}</div><p>${escapeHtml(d.Isi).replace(/\n/g,"<br>")}</p></article>`;
}

// ===== Modal Popup =====
function enableImagePopup(img){
  if(!img) return;
  img.addEventListener("click",()=>{
    const m=document.getElementById("imgModal"), mi=document.getElementById("modalImg");
    m.style.display="flex"; mi.src=img.src;
  });
}
document.addEventListener("DOMContentLoaded",()=>{
  const m=document.getElementById("imgModal"), c=document.getElementById("closeModal");
  if(c) c.onclick=()=>m.style.display="none";
});
