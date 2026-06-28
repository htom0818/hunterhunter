const DATA = window.HXH_DATA;
const $ = (sel) => document.querySelector(sel);
const screens = {home:$("#homeScreen"),list:$("#listScreen"),detail:$("#detailScreen"),search:$("#searchScreen")};
const labels = {episodes:"話数",characters:"キャラクター",organizations:"組織",terms:"用語",storylines:"ストーリーライン",books:"単行本"};
const stateStack = ["home"];

function escapeHTML(str){return String(str||"").replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function imgFallback(src, cls, alt, book=false){
  const img=document.createElement("img");
  img.src=src; img.className=cls; img.alt=alt||"";
  img.onerror=()=>{img.onerror=null; const w=book?240:200,h=book?360:200;
    img.src="data:image/svg+xml;charset=UTF-8,"+encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}'><rect width='${w}' height='${h}' fill='#222'/><text x='${w/2}' y='${h/2-6}' fill='#fff' font-size='18' font-family='sans-serif' text-anchor='middle'>NO IMAGE</text><text x='${w/2}' y='${h/2+20}' fill='#aaa' font-size='12' font-family='sans-serif' text-anchor='middle'>${escapeHTML(alt)}</text></svg>`)};
  return img
}
function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function typeIntro(){const targets=[...document.querySelectorAll(".type-target")];let delay=180;targets.forEach(el=>{const text=el.dataset.text||"";el.textContent="";[...text].forEach((ch,i)=>setTimeout(()=>el.textContent+=ch,delay+i*48));delay+=text.length*48+230});setTimeout(()=>$("#enterBtn").classList.add("show"),delay+350)}
function showScreen(name,push=true){Object.values(screens).forEach(s=>s.classList.add("hidden"));screens[name].classList.remove("hidden");if(push&&stateStack[stateStack.length-1]!==name)stateStack.push(name);window.scrollTo({top:0,behavior:"smooth"})}
function goBack(){if(stateStack.length>1)stateStack.pop();showScreen(stateStack[stateStack.length-1]||"home",false)}
function listData(type){return DATA[type]||[]}

function renderHome(){
  const chars=shuffle(DATA.characters);
  const charWrap=$("#characterMarquee"); charWrap.innerHTML="";
  [...chars,...chars,...chars].forEach(c=>{
    const btn=document.createElement("button"); btn.className="character-card";
    btn.appendChild(imgFallback(c.image,"character-avatar",c.name));
    const span=document.createElement("span"); span.textContent=c.name; btn.appendChild(span);
    btn.onclick=()=>openDetail("characters",c); charWrap.appendChild(btn)
  });
  const bookWrap=$("#bookMarquee"); bookWrap.innerHTML="";
  [...DATA.books,...DATA.books,...DATA.books].forEach(b=>{
    const btn=document.createElement("button"); btn.className="book-card";
    btn.appendChild(imgFallback(b.image,"book-cover",b.name,true));
    const strong=document.createElement("strong"); strong.textContent=b.name;
    const range=document.createElement("span"); range.textContent=b.range;
    const note=document.createElement("span"); note.textContent=b.text.replace(/\n/g," / ");
    btn.append(strong,range,note); btn.onclick=()=>openDetail("books",b); bookWrap.appendChild(btn)
  });
  $("#latestTitle").textContent=`${DATA.meta.latest.episode}　${DATA.meta.latest.title}`;
  $("#latestThumb").style.backgroundImage=`url(${DATA.meta.latest.characterImage})`
}

function openList(type){
  $("#listTitle").textContent=labels[type]||"一覧";
  const wrap=$("#listContent"); wrap.innerHTML="";
  listData(type).forEach(item=>{wrap.appendChild(makeListCard(type,item))});
  showScreen("list")
}
function makeListCard(type,item){
  const btn=document.createElement("button"); btn.className="list-card";
  if(type==="characters"){btn.appendChild(imgFallback(item.image,"",item.name))}
  if(type==="books"){btn.appendChild(imgFallback(item.image,"book-mini",item.name,true))}
  const strong=document.createElement("strong"); strong.textContent=item.name||item.title||item.no;
  const small=document.createElement("small"); small.textContent=item.range||(item.text||item.profile||"").split("\n")[0]||"";
  btn.append(strong,small); btn.onclick=()=>openDetail(type,item); return btn
}
function linkedItemsByName(name, source){return (source || []).filter(x => JSON.stringify(x).includes(name))}
function appendDetailSection(parent,title,items,type){
  if(!items.length)return;
  const sec=document.createElement("div"); sec.className="detail-section";
  const h=document.createElement("h4"); h.textContent=title; sec.appendChild(h);
  items.forEach(item=>{
    const b=document.createElement("button"); b.className="list-card"; b.style.width="100%"; b.style.marginBottom="8px";
    const s=document.createElement("strong"); s.textContent=item.name;
    const small=document.createElement("small"); small.textContent=(item.text||item.profile||"").split("\n")[0]||"";
    b.append(s,small); b.onclick=()=>openDetail(type,item); sec.appendChild(b)
  });
  parent.appendChild(sec)
}
function openDetail(type,item){
  $("#detailKicker").textContent=(labels[type]||"DETAIL").toUpperCase();
  $("#detailTitle").textContent=item.name||item.title||item.no||"詳細";
  const detail=$("#detailContent"); detail.innerHTML="";
  if(type==="characters"){
    const hero=document.createElement("div"); hero.className="detail-hero";
    hero.appendChild(imgFallback(item.image,"",item.name));
    const title=document.createElement("h3"); title.textContent=item.name; hero.appendChild(title); detail.appendChild(hero);
    const p=document.createElement("p"); p.textContent=item.profile||""; detail.appendChild(p);
    appendDetailSection(detail,"STORYLINE",linkedItemsByName(item.name,DATA.storylines),"storylines");
    appendDetailSection(detail,"登場話",DATA.episodes.filter(e=>(item.episodes||[]).includes(e.name.split("　")[0])),"episodes")
  }else if(type==="books"){
    const hero=document.createElement("div"); hero.className="detail-hero";
    hero.appendChild(imgFallback(item.image,"book-detail",item.name,true));
    const title=document.createElement("h3"); title.textContent=item.name; hero.appendChild(title); detail.appendChild(hero);
    const p=document.createElement("p"); p.textContent=`${item.range}\n${item.text}`; detail.appendChild(p)
  }else{
    const p=document.createElement("p"); p.textContent=item.text||item.summary||item.profile||""; detail.appendChild(p);
    appendDetailSection(detail,"関連キャラクター",DATA.characters.filter(c=>JSON.stringify(item).includes(c.name)),"characters");
    appendDetailSection(detail,"関連用語",DATA.terms.filter(t=>t.name!==item.name && JSON.stringify(item).includes(t.name)),"terms");
    appendDetailSection(detail,"関連組織",DATA.organizations.filter(o=>o.name!==item.name && JSON.stringify(item).includes(o.name)),"organizations")
  }
  showScreen("detail")
}
function doSearch(){
  const q=$("#searchInput").value.trim();
  $("#searchTitle").textContent=q ? `検索結果：${q}` : "検索結果";
  const wrap=$("#searchContent"); wrap.innerHTML="";
  if(!q){wrap.innerHTML='<div class="list-card"><strong>検索ワードを入力してください</strong></div>';showScreen("search");return}
  let hits=[];
  ["characters","episodes","terms","organizations","storylines","books"].forEach(type=>{
    listData(type).forEach(item=>{if(JSON.stringify(item).includes(q))hits.push({type,item})})
  });
  if(!hits.length){wrap.innerHTML='<div class="list-card"><strong>該当なし</strong></div>'}
  hits.forEach(({type,item})=>{
    const card=makeListCard(type,item);
    const tag=document.createElement("small"); tag.textContent=labels[type]; card.appendChild(tag);
    wrap.appendChild(card)
  });
  showScreen("search")
}
document.addEventListener("DOMContentLoaded",()=>{
  typeIntro(); renderHome();
  $("#enterBtn").addEventListener("click",()=>{$("#intro").classList.add("hidden");$("#app").classList.remove("hidden")});
  document.querySelectorAll("[data-open-list]").forEach(btn=>btn.addEventListener("click",()=>openList(btn.dataset.openList)));
  document.querySelectorAll("[data-back]").forEach(btn=>btn.addEventListener("click",goBack));
  $("#searchBtn").addEventListener("click",doSearch);
  $("#searchInput").addEventListener("keydown",e=>{if(e.key==="Enter")doSearch()})
});
