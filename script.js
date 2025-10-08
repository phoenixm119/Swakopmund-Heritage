const contentFiles = {
  "2024-09-01-example-page.html": `---
title: Swakopmund Jetty History
tags: jetty,heritage,coast
cover: jetty-cover.jpg
summary: A short summary about the Swakopmund Jetty and its historical significance.
date: 2024-09-01
---
<h1>Swakopmund Jetty</h1>
<p>The Swakopmund Jetty has been a focal point of the town since the early 20th century. It is
a symbol of the maritime heritage of the city.</p>
<p>Walking along the jetty offers panoramic views of the Atlantic and the town's German-era
architecture.</p>
<img src="jetty-1.jpg" alt="Swakopmund Jetty">
<footer>End of article.</footer>
`,

  "sub-folder/2024-10-10-old-library.txt": `---
title: Old Library of Swakopmund
tags: library,heritage,architecture
cover: library-cover.jpg
summary: The library stands as an example of colonial architecture in Swakopmund.
date: 2024-10-10
---
The Old Library is located near the main square.
its timber frames and decorative cornices are preserved.

library-photo.jpg

It served as a cultural centre for many decades.
`,

  "2026-01-01-future-post.txt": `---
title: Future Post
tags: sample
date: 2026-01-01
draft: true
summary: This is a draft for future date.
---
This post is for future and should be hidden until the date arrives.
`,

  "2024-08-20-no-frontmatter.txt": `
This file has no front-matter.
Line one becomes a paragraph.
image-example.jpg
Another paragraph.
`,


  "sub-folder/nested-folder/2024-11-05-museum.html": `---
title: Swakopmund Museum
tags: museum,heritage
cover: museum-cover.jpeg
summary: A concise summary of the museum.
date: 2024-11-05
---
<h1>Swakopmund Museum</h1>
<p>The museum showcases natural and cultural history.</p>
<img src="museum-1.png" alt="Museum interior">
`
};



function nowDateISO(){
  const d = new Date();
  return d.toISOString().slice(0,10);
}

function parseFrontMatter(text){
  
  if(!text.startsWith('---')) return {fm:{}, body:text.trim()};
  const end = text.indexOf('---', 3);
  if(end === -1) return {fm:{}, body:text.trim()};
  const fmRaw = text.slice(3, end).trim();
  const body = text.slice(end+3).trim();
  const lines = fmRaw.split(/\r?\n/).filter(Boolean);
  const fm = {};
  lines.forEach(line=>{
    const idx = line.indexOf(':');
    if(idx === -1) return;
    const key = line.slice(0,idx).trim();
    const val = line.slice(idx+1).trim();
    fm[key] = val;
  });
  return {fm, body};
}

function filenameToTitle(filename){
 
  const base = filename.split('/').pop();
  const noExt = base.replace(/\.[^.]+$/,'');
  if(/^\d{4}-\d{2}-\d{2}-/.test(noExt)){
    return noExt.replace(/^\d{4}-\d{2}-\d{2}-/,'').replace(/-/g,' ').replace(/\b\w/g, c=>c.toUpperCase());
  }

  return noExt.replace(/-/g,' ').replace(/\b\w/g, c=>c.toUpperCase());
}

function extractH1FromHTML(html){
  const m = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  return m ? m[1].replace(/<[^>]+>/g,'').trim() : null;
}

function isImageLine(line){
  return /\.(jpe?g|png|gif|webp|svg)$/i.test(line.trim());
}

function joinPath(...parts){
  return parts.filter(Boolean).join('/').replace(/\/{2,}/g,'/');
}


const index = {folders: new Set(), pages: []};

Object.keys(contentFiles).forEach(path=>{

  const segs = path.split('/');
  for(let i=0;i<segs.length-1;i++){
    const folderPath = segs.slice(0,i+1).join('/');
    index.folders.add(folderPath);
  }

  const raw = contentFiles[path];
  const {fm, body} = parseFrontMatter(raw);

  const fname = path.split('/').pop();
  let date = fm.date || (fname.slice(0,10).match(/^\d{4}-\d{2}-\d{2}$/) ? fname.slice(0,10) : null);
  const draft = (fm.draft === 'true' || fm.draft === true);
  const tags = fm.tags ? fm.tags.split(',').map(t=>t.trim()).filter(Boolean) : [];
  const summary = fm.summary || '';
  const titleFromH1 = extractH1FromHTML(body);
  const title = fm.title || titleFromH1 || filenameToTitle(path);
  index.pages.push({path, raw, fm, body, date, draft, tags, summary, title});
});


function pagesInFolder(folderPath){
 
  const prefix = folderPath ? folderPath.replace(/\/$/,'') + '/' : '';
  return index.pages.filter(p => p.path.startsWith(prefix));
}


const listView = document.getElementById('listView');
const pageView = document.getElementById('pageView');
const searchInput = document.getElementById('searchInput');
const overlay = document.getElementById('overlay');
const overlayImg = document.getElementById('overlayImg');
const homeBtn = document.getElementById('homeBtn');

homeBtn.addEventListener('click', ()=>{ navigateTo('#/'); });

overlay.addEventListener('click', ()=>{ hideOverlay(); });
window.addEventListener('scroll', ()=>{ if(overlay.style.display==='flex') hideOverlay(); });

function hideOverlay(){ overlay.style.display='none'; overlay.setAttribute('aria-hidden','true'); overlayImg.src=''; }

function showOverlay(src){
  overlayImg.src = src; overlay.style.display = 'flex'; overlay.setAttribute('aria-hidden','false');
}

function currentRoute(){
  const hash = (location.hash || '#/').replace(/^#\/?/, '');
  if(!hash) return {type:'home'};
  const parts = hash.split('/');
  
  if(parts[0]==='tags' && parts[1]) return {type:'tags', tag: decodeURIComponent(parts.slice(1).join('/'))};
  
  if(parts[0]==='page' && parts[1]) return {type:'page', path: decodeURIComponent(parts.slice(1).join('/'))};
  
  if(parts[0]==='cultural') return {type:'folder', folder: decodeURIComponent(parts.slice(1).join('/'))};

  const maybe = decodeURIComponent(parts.join('/'));
  if(index.pages.some(p=>p.path===maybe)) return {type:'page', path: maybe};
  return {type:'folder', folder: maybe};
}

function navigateTo(hash){
  location.hash = hash;
}

function renderList(folderPath='', filterTerm=''){
  listView.innerHTML = '';
  pageView.style.display='none';
  listView.style.display='block';

  const crumbs = document.createElement('div'); crumbs.className='crumbs';
  crumbs.textContent = folderPath ? `Folder: ${folderPath}` : 'All heritage pages';
  listView.appendChild(crumbs);

  const prefix = folderPath ? folderPath.replace(/\/$/,'') + '/' : '';
  const childFolders = new Set();
  index.folders.forEach(f=>{
    if(f.startsWith(prefix)){
      const rest = f.slice(prefix.length).split('/')[0];
      if(rest) childFolders.add(joinPath(prefix, rest));
    }
  });
  const folderArr = Array.from(childFolders).sort((a,b)=>a.localeCompare(b));

  const pages = pagesInFolder(folderPath);

  const today = nowDateISO();
  const visiblePages = pages.filter(p=>{
    
    const base = p.path.split('/').pop();
    const hasDatePrefix = /^\d{4}-\d{2}-\d{2}-/.test(base);
    if(!hasDatePrefix) return false;
    if(p.draft) return false;
    if(p.date && p.date > today) return false;
    return true;
  });

  const q = filterTerm.trim();
  let filtered = visiblePages;
  if(q){
    const terms = q.split('/').map(t=>t.toLowerCase().trim()).filter(Boolean);
    filtered = visiblePages.filter(p=>{
      const hay = (p.title + ' ' + p.summary + ' ' + p.body).toLowerCase();
      return terms.some(t => hay.includes(t));
    });
  }

  const ul = document.createElement('ul'); ul.className='list';

  folderArr.forEach(folder => {
    const li = document.createElement('li'); li.className='item';
    const folderName = folder.split('/').slice(-1)[0];
    li.innerHTML = `<div class="folder-label">📁 <a class="link" href="#/cultural/${encodeURIComponent(folder)}">${folderName}</a></div>`;
    ul.appendChild(li);
  });

  filtered.sort((a,b)=> b.path.localeCompare(a.path)).forEach(p=>{
    const li = document.createElement('li'); li.className='item';
    const link = `#/page/${encodeURIComponent(p.path)}`;
    li.innerHTML = `<h2><a class="link" href="${link}">${escapeHtml(p.title)}</a></h2>
      <p class="summary">${escapeHtml(p.summary || '')}</p>
      <small style="color:var(--muted)">${escapeHtml(p.date || '')} • ${p.tags.join(', ')}</small>`;
    ul.appendChild(li);
  });

  if(folderArr.length===0 && filtered.length===0){
    listView.appendChild(document.createElement('div')).className='no-results';
    listView.querySelector('.no-results').textContent = 'No pages found.';
  } else {
    listView.appendChild(ul);
  }
}

function renderTag(tag){
  const t = tag.toLowerCase();
  const matched = index.pages.filter(p => p.tags.map(x=>x.toLowerCase()).includes(t) && !p.draft && (!p.date || p.date <= nowDateISO()) && /^\d{4}-\d{2}-\d{2}-/.test(p.path.split('/').pop()));
  listView.innerHTML=''; pageView.style.display='none'; listView.style.display='block';
  const header = document.createElement('div'); header.className='crumbs';
  header.textContent = `Tag: ${tag}`;
  listView.appendChild(header);
  const ul= document.createElement('ul'); ul.className='list';
  if(matched.length===0){
    listView.appendChild(document.createElement('div')).className='no-results';
    listView.querySelector('.no-results').textContent = 'No pages with this tag.';
    return;
  }
  matched.sort((a,b)=> b.path.localeCompare(a.path)).forEach(p=>{
    const li=document.createElement('li'); li.className='item';
    li.innerHTML = `<h2><a class="link" href="#/page/${encodeURIComponent(p.path)}">${escapeHtml(p.title)}</a></h2>
      <p class="summary">${escapeHtml(p.summary || '')}</p>
      <small style="color:var(--muted)">${escapeHtml(p.date || '')} • ${p.tags.join(', ')}</small>`;
    ul.appendChild(li);
  });
  listView.appendChild(ul);
}

function renderPage(path){
  const page = index.pages.find(p=>p.path===path);
  if(!page){ navigateTo('#/'); return; }

  const {fm, body} = parseFrontMatter(page.raw);
  const cover = fm.cover || (page.path.split('/').pop().replace(/\.[^.]+$/,'') + '.jpg'); // fallback
  const titleCandidate = fm.title || extractH1FromHTML(body) || page.title;
  const date = fm.date || page.date || '';
  const tags = fm.tags ? fm.tags.split(',').map(s=>s.trim()).filter(Boolean) : page.tags;

  setSocialMeta({title: titleCandidate, description: fm.summary || page.summary || '', image:`content-pages/images/${cover}`});

  listView.style.display='none';
  pageView.style.display='block';
  pageView.innerHTML = `
    <div class="page-wrap" role="main">
      <div class="content">
        <div class="cover" id="coverWrap"><img id="coverImg" src="content-pages/images/${cover}" alt="${escapeHtml(titleCandidate)}"></div>
        <h2 class="title" id="pageTitle">${escapeHtml(titleCandidate)}</h2>
        <div class="main-content" id="mainContent"></div>
      </div>
      <aside class="meta" aria-label="Page information">
        <div><small>Date</small><div>${escapeHtml(date)}</div></div>
        <div style="margin-top:10px"><small>Tags</small><div class="tags" id="tagList"></div></div>
        ${fm.draft === 'true' ? '<div style="margin-top:10px;color:#b33"><small>Draft</small><div>Draft</div></div>':''}
        <div style="margin-top:14px"><small>Share</small>
          <div style="margin-top:8px">
            <button id="shareBtn">Share</button>
            <button id="openRawBtn">Open raw</button>
          </div>
        </div>
      </aside>
    </div>
  `;

  const target = document.getElementById('mainContent');
  const ext = path.split('.').pop().toLowerCase();

  if(ext === 'txt'){
    const lines = body.split(/\r?\n/);
    lines.forEach(line=>{
      if(!line.trim()) return;
      if(isImageLine(line.trim())){
        const img = document.createElement('img');
        img.className='content-img';
        img.src = `content-pages/images/${line.trim()}`;
        img.alt = '';
        img.addEventListener('click', ()=>showOverlay(img.src));
        target.appendChild(img);
      } else {
        const p = document.createElement('p');
        p.innerText = line;
        target.appendChild(p);
      }
    });
  } else {
    const rewrote = body.replace(/src=["']([^"']+)["']/g, (m, p1)=>`src="content-pages/images/${p1}"`);
    target.innerHTML = rewrote;

    target.querySelectorAll('img').forEach(img=>{
      img.classList.add('content-img');
      img.addEventListener('click', ()=>showOverlay(img.src));
    });
  }

  const tagList = document.getElementById('tagList');
  tags.forEach(t=>{
    const b = document.createElement('a');
    b.href = `#/tags/${encodeURIComponent(t)}`;
    b.className='tag';
    b.innerText = t;
    tagList.appendChild(b);
  });

  document.getElementById('openRawBtn').addEventListener('click', ()=>{
    const w = window.open(); w.document.write('<pre>'+escapeHtml(page.raw)+'</pre>'); w.document.title = page.title;
  });

  document.getElementById('shareBtn').addEventListener('click', async ()=>{
    const shareUrl = location.href;
    if(navigator.share){
      try{ await navigator.share({title: titleCandidate, text: fm.summary || '', url: shareUrl}); }
      catch(e){ /* user cancelled */ }
    } else {
  
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard');
    }
  });

  const coverImg = document.getElementById('coverImg');
  const coverWrap = document.getElementById('coverWrap');
  coverWrap.addEventListener('mousemove', (e)=>{
    const rect = coverImg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
  
    const mask = `radial-gradient(circle 300px at ${x}px ${y}px, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)`;
    coverImg.style.webkitMaskImage = mask;
    coverImg.style.maskImage = mask;
  });
  coverWrap.addEventListener('mouseleave', ()=>{
    coverImg.style.webkitMaskImage = '';
    coverImg.style.maskImage = '';
  });

  window.addEventListener('scroll', ()=>{ if(overlay.style.display==='flex') hideOverlay(); });

  coverImg.alt = titleCandidate;
  coverImg.addEventListener('error', ()=>{ /* ignore missing image */ });
}

function setSocialMeta({title, description, image}){
  const doc = document;
  doc.title = title + ' — Swakopmund Heritage';
  setMeta('description', description);
  setMetaProperty('og:title', title);
  setMetaProperty('og:description', description);
  setMetaProperty('og:image', image);
  setMeta('twitter:card', 'summary_large_image');
  // helper
  function setMeta(name, content){
    let m = doc.querySelector(`meta[name="${name}"]`);
    if(!m){ m = doc.createElement('meta'); m.setAttribute('name', name); doc.head.appendChild(m); }
    m.setAttribute('content', content || '');
  }
  function setMetaProperty(prop, content){
    let m = doc.querySelector(`meta[property="${prop}"]`);
    if(!m){ m = doc.createElement('meta'); m.setAttribute('property', prop); doc.head.appendChild(m); }
    m.setAttribute('content', content || '');
  }
}

function escapeHtml(s){
  if(!s) return '';
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

searchInput.addEventListener('input', ()=> {
  const q = searchInput.value.trim();
 
  if(location.hash.startsWith('#/tags/')) {
   
  }

  const r = currentRoute();
  if(r.type === 'home' || r.type === 'folder'){
    renderList(r.folder || '', q);
  } else if(r.type === 'tags') {
    renderTag(r.tag);
  }
});

function handleRoute(){
  const r = currentRoute();
  if(r.type==='home'){
    setSocialMeta({title: 'Swakopmund Heritage Sites', description:'Browse heritage pages', image:''});
  }
  if(r.type === 'home'){
    const q = searchInput.value.trim();
    renderList('', q);
  } else if(r.type === 'folder'){
    const q = searchInput.value.trim();
    renderList(r.folder || '', q);
  } else if(r.type === 'page'){
    renderPage(r.path);
  } else if(r.type === 'tags'){
    renderTag(r.tag);
  }
}

if(!location.hash) location.hash = '#/';
window.addEventListener('hashchange', handleRoute);
handleRoute();

window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') hideOverlay(); });

document.addEventListener('click', (e)=>{
  const a = e.target.closest('a');
  if(!a) return;
  const href = a.getAttribute('href') || '';
  if(href.startsWith('#')) return; 

  const clean = href.replace(/^\.\//,'');
  if(index.pages.some(p=>p.path === clean)){
    e.preventDefault(); navigateTo('#/page/'+encodeURIComponent(clean));
  }
});

window.__CH_addFile = (path, rawText)=> {
  contentFiles[path] = rawText;
  location.reload();
};
