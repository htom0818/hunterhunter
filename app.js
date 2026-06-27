const imageMap = {
  "ビヨンド＝ネテロ": "images/characters/beyond_netero.png",
  "ジン＝フリークス": "images/characters/ging_freecss.png",
  "パリストン＝ヒル": "images/characters/pariston_hill.png",
  "クラピカ": "images/characters/kurapika.png",
  "レオリオ": "images/characters/leorio.png",
  "チードル": "images/characters/cheadle.png",
  "ミザイストム": "images/characters/mizaistom.png",
  "ツェリードニヒ＝ホイコーロ": "images/characters/tserriednich_hui_guo_rou.png",
  "ホイコーロ国王": "images/characters/hui_guo_rou.png",
  "アイザック＝ネテロ": "images/characters/isaac_netero.png",
  "ドン＝フリークス": "images/characters/don_freecss.png"
};

const state = { view: "episodes", query: "", selected: null };
const $ = (id) => document.getElementById(id);
const listEl = $("list");
const detailEl = $("detail");
const searchEl = $("searchInput");

function norm(s){ return String(s || "").toLowerCase().replace(/\s/g, ""); }
function includesQuery(text){ return !state.query || norm(text).includes(norm(state.query)); }
function initials(name){ return String(name).replace(/[＝・\s]/g, "").slice(0,2); }
function imgOrFallback(name){
  const src = imageMap[name];
  if(!src) return `<div class="avatarFallback">${initials(name)}</div>`;
  return `<img class="avatar" src="${src}" alt="${name}" onerror="this.outerHTML='<div class=&quot;avatarFallback&quot;>${initials(name)}</div>'" />`;
}
function escapeHtml(s){return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function tag(name){ return `<span class="tag" data-term="${escapeHtml(name)}">${escapeHtml(name)}</span>`; }
function line(text){ return `<p class="lineText">${escapeHtml(text)}</p>`; }

function episodeMatches(ep){
  const hay = [ep.no, ep.title, ep.summary, Object.keys(ep.lines||{}).join(" "), (ep.terms||[]).join(" ")].join(" ");
  return includesQuery(hay);
}
function termMatches(name, arr){ return includesQuery([name, ...(arr||[])].join(" ")); }
function lineEntries(){
  const map = {};
  DB.episodes.forEach(ep => {
    Object.entries(ep.lines || {}).forEach(([name, arr]) => {
      if(!map[name]) map[name] = [];
      map[name].push({ episode: ep, lines: arr });
    });
  });
  return map;
}
function termEpisodes(name){
  return DB.episodes.filter(ep => (ep.terms||[]).includes(name) || Object.keys(ep.lines||{}).includes(name));
}

function updateStats(){
  const terms = Object.keys(DB.terms).length;
  const lines = Object.keys(lineEntries()).length;
  $("stats").innerHTML = `<span class="stat">話数 ${DB.episodes.length}</span><span class="stat">用語 ${terms}</span><span class="stat">ライン ${lines}</span>`;
}

function renderList(){
  let html = "";
  if(state.view === "episodes"){
    const eps = DB.episodes.filter(episodeMatches);
    html = eps.map(ep => `<div class="item ${state.selected===ep.no?'active':''}" data-kind="episode" data-id="${ep.no}"><div class="itemTitle">No${ep.no} ${escapeHtml(ep.title)}</div><div class="itemMeta">${Object.keys(ep.lines||{}).length}ライン / ${(ep.terms||[]).length}用語</div></div>`).join("");
  }
  if(state.view === "terms"){
    const terms = Object.entries(DB.terms).filter(([name, arr]) => termMatches(name, arr));
    html = terms.map(([name, arr]) => `<div class="item ${state.selected===name?'active':''}" data-kind="term" data-id="${escapeHtml(name)}"><div class="itemTitle">${escapeHtml(name)}</div><div class="itemMeta">${arr.length}件 / 登場 ${termEpisodes(name).map(e=>e.no).join(', ')}</div></div>`).join("");
  }
  if(state.view === "lines"){
    const entries = Object.entries(lineEntries()).filter(([name, arr]) => includesQuery([name, ...arr.flatMap(x=>x.lines)].join(" ")));
    html = entries.map(([name, arr]) => `<div class="item ${state.selected===name?'active':''}" data-kind="line" data-id="${escapeHtml(name)}"><div class="itemTitle">${escapeHtml(name)}</div><div class="itemMeta">${arr.map(x=>'No'+x.episode.no).join(' / ')}</div></div>`).join("");
  }
  listEl.innerHTML = html || `<div class="empty">該当なし</div>`;
}

function renderHome(){
  detailEl.innerHTML = `<div class="heroCard"><p class="kicker">Dark Continent Arc</p><h2 class="heroTitle">暗黒大陸編 データベース</h2><div class="summary">検索窓からキャラクター・用語・話数を検索できます\n左の一覧から話別、用語・人物、ストーリーラインを切り替えできます</div><p class="hint">画像差し替えは images/characters 内のPNGを同じファイル名で置き換えます</p></div>`;
}

function renderEpisode(no){
  const ep = DB.episodes.find(e => String(e.no) === String(no));
  if(!ep) return renderHome();
  const linesHtml = Object.entries(ep.lines||{}).map(([name, arr]) => `<div class="sectionTitle">［${escapeHtml(name)}］</div>${arr.map(line).join("")}`).join("");
  const termsHtml = (ep.terms||[]).map(t => tag(t)).join("");
  detailEl.innerHTML = `<article class="heroCard"><p class="kicker">Episode</p><h2 class="heroTitle">No${ep.no}　${escapeHtml(ep.title)}</h2><div class="summary">${escapeHtml(ep.summary)}</div></article><section class="card"><h3>ストーリーライン</h3>${linesHtml || '<p class="empty">なし</p>'}</section><section class="card"><h3>登場・関連用語</h3><div class="tagRow">${termsHtml}</div></section>`;
}

function renderTerm(name){
  const arr = DB.terms[name];
  if(!arr) return renderHome();
  const eps = termEpisodes(name);
  const file = imageMap[name];
  detailEl.innerHTML = `<article class="heroCard"><div class="avatarBox">${imgOrFallback(name)}<div><p class="kicker">Term / Character</p><h2 class="heroTitle">${escapeHtml(name)}</h2>${file ? `<div class="filename">${file}</div>` : `<div class="hint">画像ファイル未設定</div>`}</div></div></article><section class="card"><h3>登録情報</h3>${arr.map(line).join("")}</section><section class="card"><h3>登場話</h3><div class="tagRow">${eps.map(e => `<span class="tag" data-episode="${e.no}">No${e.no} ${escapeHtml(e.title)}</span>`).join("") || '<span class="empty">なし</span>'}</div></section>`;
}

function renderLine(name){
  const entries = lineEntries()[name];
  if(!entries) return renderHome();
  detailEl.innerHTML = `<article class="heroCard"><div class="avatarBox">${imgOrFallback(name)}<div><p class="kicker">Storyline</p><h2 class="heroTitle">${escapeHtml(name)}</h2><div class="hint">キャラ・団体ごとの行動履歴</div></div></div></article>${entries.map(({episode, lines}) => `<section class="card"><div class="cardTitle"><h3>No${episode.no}　${escapeHtml(episode.title)}</h3><span class="tag" data-episode="${episode.no}">話を開く</span></div>${lines.map(line).join("")}</section>`).join("")}`;
}

function render(){ renderList(); if(!state.selected) return renderHome(); if(state.view==='episodes') renderEpisode(state.selected); if(state.view==='terms') renderTerm(state.selected); if(state.view==='lines') renderLine(state.selected); }

document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => { document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); state.view = btn.dataset.view; state.selected = null; render(); }));
searchEl.addEventListener('input', e => { state.query = e.target.value; state.selected = null; render(); });
listEl.addEventListener('click', e => { const item = e.target.closest('.item'); if(!item) return; state.selected = item.dataset.id; render(); });
detailEl.addEventListener('click', e => { const term = e.target.closest('[data-term]'); const ep = e.target.closest('[data-episode]'); if(term){ state.view='terms'; state.selected=term.dataset.term; document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active', b.dataset.view==='terms')); render(); } if(ep){ state.view='episodes'; state.selected=ep.dataset.episode; document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active', b.dataset.view==='episodes')); render(); } });
updateStats(); render();
