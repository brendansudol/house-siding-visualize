import { createHouse } from './house.js?v=6aada2ddc6db';
import { paintColors as palette } from './paint-colors.js?v=abdc78d0b4aa';
const byCode=new Map(palette.map(p=>[p.code,p]));
const byHex=new Map(palette.map(p=>[p.hex,p]));
const presets=[['Retreat',6207,7008,6340],['Labradorite',7619,7008,2839],['Hunt Club',6468,7042,7508],['Accessible Beige',7036,7005,7069]].map(([name,...numbers])=>{
  const paintCodes=Object.fromEntries(['siding','trim','door'].map((key,i)=>[key,`SW ${numbers[i]}`]));
  return {name,paintCodes,...Object.fromEntries(Object.entries(paintCodes).map(([key,code])=>[key,byCode.get(code).hex]))};
});
let state={...presets[0],paintCodes:{...presets[0].paintCodes},gable:presets[0].siding,matchGable:true,light:'day'},surface='siding',model=null,saved=[],tone='all';
try{const stored=JSON.parse(localStorage.getItem('westover-looks')||'[]');if(Array.isArray(stored))saved=stored.filter(x=>x&&typeof x.id==='string'&&validState(x.colors)).slice(0,24).map(x=>({...x,colors:{...x.colors,gable:x.colors.siding,matchGable:true}}));}catch{}
function validHex(x){return typeof x==='string'&&/^#[0-9a-f]{6}$/i.test(x);}
function validState(x){return x&&['siding','trim','door','gable'].every(k=>validHex(x[k]))&&typeof x.matchGable==='boolean';}
// Some official colors share a digital hex value. Preserve the chosen SW number.
function paint(hex,preferredCode){const preferred=byCode.get(preferredCode);return preferred?.hex===hex.toLowerCase()?preferred:byHex.get(hex.toLowerCase());}
function name(hex,preferredCode){return paint(hex,preferredCode)?.name||'Custom color';}
function code(hex,preferredCode){return paint(hex,preferredCode)?.code||hex.toUpperCase();}
function toast(message){const el=document.getElementById('toast');el.textContent=message;el.classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('visible'),2600);}
function update(){
  document.getElementById('color-error').textContent='';
  state.matchGable=true;state.gable=state.siding;
  state.paintCodes={...state.paintCodes,gable:state.paintCodes?.siding};
  model?.setColors(state);
  for(const k of ['siding','trim','door','gable']){
    document.getElementById('name-'+k).textContent=k==='gable'&&state.matchGable?'Matches siding':name(state[k],state.paintCodes[k]);
    document.querySelector(`[data-surface="${k}"] .surface-chip`).style.background=state[k];
  }
  const selected=paint(state[surface],state.paintCodes[surface]),source=document.getElementById('paint-source');
  document.getElementById('selected-name').textContent=name(state[surface],state.paintCodes[surface]);
  document.getElementById('selected-code').textContent=code(state[surface],state.paintCodes[surface]);
  document.getElementById('selected-lrv').textContent=selected?`Light reflectance (LRV): ${selected.lrv}`:'';
  source.hidden=!selected;
  if(selected){source.href=selected.url;source.textContent=`View ${selected.name} at Sherwin-Williams ↗`;}
  document.getElementById('hex-input').value=state[surface].toUpperCase();
  document.getElementById('color-picker').value=state[surface];
  renderRelated(selected);
  document.querySelectorAll('.swatch').forEach(b=>{const active=b.dataset.code===selected?.code;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});
  document.querySelectorAll('.preset').forEach((b,i)=>b.classList.toggle('active',['siding','trim','door'].every(k=>presets[i][k]===state[k])));
  document.getElementById('saved-count').textContent=saved.length;
}
function setColor(hex,paintCode){if(!validHex(hex))throw new Error('Use a six-digit hex color, such as #6F7D70.');state[surface]=hex.toLowerCase();state.paintCodes={...state.paintCodes,[surface]:paintCode};document.getElementById('color-error').textContent='';update();}
function swatch(p){
  const b=document.createElement('button');b.className='swatch';b.style.background=p.hex;b.dataset.color=p.hex;b.dataset.code=p.code;
  b.title=`${p.name} · ${p.code}`;b.setAttribute('aria-label',b.title);
  b.addEventListener('click',()=>setColor(p.hex,p.code));return b;
}
function renderRelated(selected){
  const section=document.getElementById('related-colors'),parent=document.getElementById('related-swatches');
  const strip=selected?.strip?.length>1;
  const codes=strip?selected.strip:selected?.similar||[];
  const colors=codes.map(c=>byCode.get(c)).filter(Boolean).sort((a,b)=>b.lrv-a.lrv).slice(0,7);
  section.hidden=colors.length<2;parent.replaceChildren();
  document.getElementById('related-label').textContent=strip?'On this SW color strip':'Similar SW shades';
  for(const p of colors){const b=swatch(p);b.classList.add('strip-swatch');parent.append(b);}
}
function matchesFamily(p,filter){return filter==='all'||p.families.includes(filter)||(filter==='cool-neutral'&&p.undertones.includes('cool'))||(filter==='warm-neutral'&&p.undertones.includes('warm'));}
function matchesTone(p){return tone==='all'||(tone==='light'&&p.lrv>=60)||(tone==='mid'&&p.lrv>=25&&p.lrv<60)||(tone==='dark'&&p.lrv<25);}
const familyLabels={neutral:'Grays & neutrals',white:'Whites',green:'Greens',blue:'Blues',yellow:'Yellows',orange:'Oranges',red:'Reds',purple:'Purples'};
const normalizeSearch=value=>value.toLowerCase().replace(/grey/g,'gray').replace(/[^a-z0-9]/g,'');
for(const option of document.getElementById('color-family').options){option.textContent+=` (${palette.filter(p=>matchesFamily(p,option.value)).length.toLocaleString('en-US')})`;}
function renderSwatches(){
  const filter=document.getElementById('color-family').value;
  const query=normalizeSearch(document.getElementById('color-search').value);
  const colors=palette.filter(p=>matchesFamily(p,filter)&&matchesTone(p)&&normalizeSearch(`${p.name}${p.code}`).includes(query));
  if(filter!=='all')colors.sort((a,b)=>b.lrv-a.lrv);
  const parent=document.getElementById('swatches');parent.replaceChildren();parent.scrollTop=0;
  let previousFamily=null;
  for(const p of colors){
    if(filter==='all'&&p.family!==previousFamily){const heading=document.createElement('div');heading.className='swatch-family';heading.textContent=familyLabels[p.family];parent.append(heading);previousFamily=p.family;}
    parent.appendChild(swatch(p));
  }
  const total=palette.length.toLocaleString('en-US');
  document.getElementById('color-count').textContent=colors.length===palette.length?`${total} exterior colors`:`${colors.length.toLocaleString('en-US')} of ${total} exterior colors`;
  document.getElementById('no-colors').hidden=colors.length>0;
  document.getElementById('clear-filters').hidden=filter==='all'&&!query&&tone==='all';
  update();
}
document.querySelectorAll('button[data-surface]').forEach(b=>b.addEventListener('click',()=>{surface=b.dataset.surface;document.querySelectorAll('button[data-surface]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b);});update();}));
document.getElementById('color-family').addEventListener('change',renderSwatches);
document.getElementById('color-search').addEventListener('input',renderSwatches);
function setTone(value){tone=value;document.querySelectorAll('[data-tone]').forEach(b=>{b.classList.toggle('active',b.dataset.tone===tone);b.setAttribute('aria-pressed',b.dataset.tone===tone);});}
document.querySelectorAll('[data-tone]').forEach(b=>b.addEventListener('click',()=>{setTone(b.dataset.tone);renderSwatches();}));
document.getElementById('clear-filters').addEventListener('click',()=>{document.getElementById('color-family').value='all';document.getElementById('color-search').value='';setTone('all');renderSwatches();});
document.getElementById('color-picker').addEventListener('input',e=>setColor(e.target.value));
document.getElementById('hex-input').addEventListener('change',e=>{let c=e.target.value.trim();if(!c.startsWith('#'))c='#'+c;try{setColor(c);}catch(err){document.getElementById('color-error').textContent=err.message;}});
document.getElementById('hex-input').addEventListener('keydown',e=>{if(e.key==='Enter')e.target.blur();});
document.querySelectorAll('[data-light]').forEach(b=>b.addEventListener('click',()=>{state.light=b.dataset.light;model?.lighting(state.light);document.querySelectorAll('[data-light]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b);});}));
function setView(v){model?.view(v);document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===v);b.setAttribute('aria-pressed',b.dataset.view===v);});}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
document.getElementById('reset-view').addEventListener('click',()=>setView('perspective'));
document.getElementById('viewport').addEventListener('orbitstart',()=>document.querySelectorAll('[data-view]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false');}));
function miniPalette(colors){const div=document.createElement('span');div.className='mini-palette';for(const k of ['siding','trim','door']){const i=document.createElement('i');i.style.background=colors[k];div.appendChild(i);}return div;}
presets.forEach(p=>{const b=document.createElement('button');b.className='preset';b.appendChild(miniPalette(p));b.append(document.createTextNode(p.name));b.addEventListener('click',()=>{state={...state,...p,gable:p.siding,matchGable:true};update();});document.getElementById('presets').appendChild(b);});
function persist(){try{localStorage.setItem('westover-looks',JSON.stringify(saved));return true;}catch{toast('Browser storage is unavailable. These looks will last for this visit.');return false;}}
document.getElementById('save-look').addEventListener('click',()=>{if(saved.some(x=>['siding','trim','door','gable'].every(k=>x.colors[k]===state[k]&&code(x.colors[k],x.colors.paintCodes?.[k])===code(state[k],state.paintCodes?.[k])))){toast('This combination is already saved.');return;}if(saved.length>=24){toast('Your shortlist is full. Remove a look to save another.');return;}saved.push({id:crypto.randomUUID(),name:name(state.siding,state.paintCodes?.siding),colors:{...state}});const ok=persist();update();if(ok)toast('Combination saved to your shortlist.');});
function renderSaved(){const list=document.getElementById('saved-list');list.replaceChildren();if(!saved.length){const p=document.createElement('p');p.className='empty-state';p.textContent='Find a combination you love, then save it here.';list.append(p);return;}for(const look of saved){const card=document.createElement('div');card.className='saved-card';card.append(miniPalette(look.colors));const detail=document.createElement('div');detail.className='saved-detail';const title=document.createElement('h3');title.textContent=name(look.colors.siding,look.colors.paintCodes?.siding);const meta=document.createElement('p');meta.textContent=`${code(look.colors.siding,look.colors.paintCodes?.siding)} · ${name(look.colors.trim,look.colors.paintCodes?.trim)} trim`;detail.append(title,meta);card.append(detail);const apply=document.createElement('button');apply.className='button';apply.textContent='Apply look';apply.addEventListener('click',()=>{state={...state,...look.colors};model?.lighting(state.light);document.querySelectorAll('[data-light]').forEach(b=>{b.classList.toggle('active',b.dataset.light===state.light);b.setAttribute('aria-pressed',b.dataset.light===state.light);});update();document.getElementById('saved-dialog').close();toast('Saved look applied.');});const remove=document.createElement('button');remove.className='remove-look';remove.textContent='×';remove.setAttribute('aria-label','Remove '+name(look.colors.siding,look.colors.paintCodes?.siding)+' combination');remove.addEventListener('click',()=>{saved=saved.filter(x=>x.id!==look.id);persist();update();renderSaved();});card.append(apply,remove);list.append(card);}}
for(const [button,dialog] of [['photo-open','photos-dialog'],['saved-open','saved-dialog'],['model-info','info-dialog']])document.getElementById(button).addEventListener('click',()=>{if(dialog==='saved-dialog')renderSaved();document.getElementById(dialog).showModal();});
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
document.getElementById('download').addEventListener('click',()=>{
  if(!model)return;
  model.render();
  const source=model.renderer.domElement,canvas=document.createElement('canvas');
  const scale=Math.max(1,1200/source.width);
  canvas.width=Math.round(source.width*scale);canvas.height=Math.round(source.height*scale)+200;
  const ctx=canvas.getContext('2d'),y=canvas.height-200;
  ctx.fillStyle='#f9faf7';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(source,0,0,canvas.width,y);
  ctx.font='20px sans-serif';ctx.fillStyle='#284e3c';ctx.fillText('WESTOVER / YOUR COLOR COMBINATION',32,y+35);
  ['siding','trim','door','gable'].forEach((k,i)=>{
    const x=32+i*(canvas.width-64)/4,labels={siding:'LAP SIDING',trim:'TRIM',door:'FRONT DOOR',gable:'SHINGLE GABLES'};
    ctx.fillStyle=state[k];ctx.fillRect(x,y+60,26,54);
    ctx.fillStyle='#53634d';ctx.font='12px sans-serif';ctx.fillText(labels[k],x+36,y+71);
    ctx.font='15px sans-serif';ctx.fillText(name(state[k],state.paintCodes?.[k]),x+36,y+93,(canvas.width-64)/4-46);
    ctx.font='13px sans-serif';ctx.fillText(code(state[k],state.paintCodes?.[k]),x+36,y+113);
  });
  ctx.font='12px sans-serif';ctx.fillStyle='#7f8879';
  ctx.fillText('Photo-based approximation. Sherwin-Williams digital colors; verify with physical samples.',32,canvas.height-28);
  canvas.toBlob(blob=>{
    if(!blob){toast('Could not export this view. Please try again.');return;}
    const a=document.createElement('a'),url=URL.createObjectURL(blob);
    a.download=`westover-${state.siding.slice(1)}.png`;a.href=url;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);toast('Your house view is ready to download.');
  },'image/png');
});
renderSwatches();
try{model=createHouse(document.getElementById('viewport'),state);}catch(error){document.getElementById('loading').textContent='The 3D view needs WebGL. Try a browser with hardware acceleration enabled.';console.error(error);}

// Agents use the same paint state and update path as the visible controls.
const modelContext=document.modelContext;
if(modelContext?.registerTool){
  const lifecycle=new AbortController();
  const tools=[{
    name:'get_house_palette',title:'Read house paint colors',description:'Read the current siding, trim, door and shingle gable colors, with the current lighting and Sherwin-Williams exterior swatches.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute(){return {colors:{...state},swatches:palette.map(({name,code,hex})=>({name,code,hex}))};}
  },{
    name:'set_house_palette',title:'Change house paint colors',description:'Apply hex colors to the lap siding, trim and door. Shingle gables always match the lap siding. Changes the visible preview only; does not save a combination.',inputSchema:{type:'object',properties:{siding:{type:'string',pattern:'^#[0-9a-fA-F]{6}$'},trim:{type:'string',pattern:'^#[0-9a-fA-F]{6}$'},door:{type:'string',pattern:'^#[0-9a-fA-F]{6}$'},light:{type:'string',enum:['day','cloud','evening']}},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){
      if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Expected a paint palette object.');
      const allowed=['siding','trim','door','light'];
      for(const [key,value] of Object.entries(input)){if(!allowed.includes(key))throw new Error('Unknown paint setting: '+key);if(['siding','trim','door','gable'].includes(key)&&!validHex(value))throw new Error('Colors must use six-digit hex notation.');if(key==='light'&&!['day','cloud','evening'].includes(value))throw new Error('Unknown lighting condition.');}
      const next={...state,...input};for(const key of ['siding','trim','door','gable'])next[key]=next[key].toLowerCase();state=next;update();model?.lighting(state.light);document.querySelectorAll('[data-light]').forEach(b=>{b.classList.toggle('active',b.dataset.light===state.light);b.setAttribute('aria-pressed',b.dataset.light===state.light);});model?.render();return {colors:{...state}};
    }
  }];
  for(const tool of tools){try{Promise.resolve(modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
  addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
