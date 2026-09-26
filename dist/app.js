import { createHouse } from './house.js';
import { paintColors as palette } from './paint-colors.js';
const sw=number=>palette.find(p=>p.code===`SW ${number}`).hex;
const presets=[
  {name:'Retreat',siding:sw(6207),trim:sw(7008),door:sw(6340)},
  {name:'Labradorite',siding:sw(7619),trim:sw(7008),door:sw(2839)},
  {name:'Hunt Club',siding:sw(6468),trim:sw(7042),door:sw(7508)},
  {name:'Accessible Beige',siding:sw(7036),trim:sw(7005),door:sw(7069)}
];
let state={siding:presets[0].siding,trim:presets[0].trim,door:presets[0].door,gable:presets[0].siding,matchGable:true,light:'day'},surface='siding',model=null,saved=[];
try{const stored=JSON.parse(localStorage.getItem('westover-looks')||'[]');if(Array.isArray(stored))saved=stored.filter(x=>x&&typeof x.id==='string'&&validState(x.colors)).slice(0,24);}catch{}
function validHex(x){return typeof x==='string'&&/^#[0-9a-f]{6}$/i.test(x);}
function validState(x){return x&&['siding','trim','door','gable'].every(k=>validHex(x[k]))&&typeof x.matchGable==='boolean';}
function paint(hex){return palette.find(p=>p.hex===hex.toLowerCase());}
function name(hex){return paint(hex)?.name||'Custom color';}
function code(hex){return paint(hex)?.code||hex.toUpperCase();}
function toast(message){const el=document.getElementById('toast');el.textContent=message;el.classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('visible'),2600);}
function update(){
  document.getElementById('color-error').textContent='';
  if(state.matchGable)state.gable=state.siding;
  model?.setColors(state);
  for(const k of ['siding','trim','door','gable']){
    document.getElementById('name-'+k).textContent=k==='gable'&&state.matchGable?'Match siding':name(state[k]);
    document.querySelector(`[data-surface="${k}"] .surface-chip`).style.background=state[k];
  }
  const selected=paint(state[surface]),source=document.getElementById('paint-source');
  document.getElementById('selected-name').textContent=name(state[surface]);
  document.getElementById('selected-code').textContent=code(state[surface]);
  source.hidden=!selected;
  if(selected){source.href=selected.url;source.textContent=`View ${selected.name} at Sherwin-Williams ↗`;}
  document.getElementById('hex-input').value=state[surface].toUpperCase();
  document.getElementById('color-picker').value=state[surface];
  document.querySelectorAll('.swatch').forEach(b=>{const active=b.dataset.color===state[surface];b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});
  document.getElementById('match-gable').checked=state.matchGable;
  document.querySelectorAll('.preset').forEach((b,i)=>b.classList.toggle('active',['siding','trim','door'].every(k=>presets[i][k]===state[k])));
  document.getElementById('saved-count').textContent=saved.length;
}
function setColor(hex){if(!validHex(hex))throw new Error('Use a six-digit hex color, such as #6F7D70.');state[surface]=hex.toLowerCase();if(surface==='gable')state.matchGable=false;document.getElementById('color-error').textContent='';update();}
function renderSwatches(){
  const filter=document.getElementById('color-family').value;
  const query=document.getElementById('color-search').value.toLowerCase().replace(/\s+/g,'');
  const colors=palette.filter(p=>(filter==='all'||p.family===filter)&&`${p.name}${p.code}`.toLowerCase().replace(/\s+/g,'').includes(query));
  const parent=document.getElementById('swatches');parent.replaceChildren();parent.scrollTop=0;
  for(const p of colors){
    const b=document.createElement('button');b.className='swatch';b.style.background=p.hex;b.dataset.color=p.hex;
    b.title=`${p.name} · ${p.code}`;b.setAttribute('aria-label',b.title);
    b.addEventListener('click',()=>setColor(p.hex));parent.appendChild(b);
  }
  document.getElementById('color-count').textContent=colors.length===palette.length?`${palette.length} exterior colors`:`${colors.length} of ${palette.length} exterior colors`;
  document.getElementById('no-colors').hidden=colors.length>0;
  update();
}
document.querySelectorAll('[data-surface]').forEach(b=>b.addEventListener('click',()=>{surface=b.dataset.surface;document.querySelectorAll('[data-surface]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b);});document.getElementById('match-row').hidden=surface!=='gable';update();}));
document.getElementById('color-family').addEventListener('change',renderSwatches);
document.getElementById('color-search').addEventListener('input',renderSwatches);
document.getElementById('color-picker').addEventListener('input',e=>setColor(e.target.value));
document.getElementById('hex-input').addEventListener('change',e=>{let c=e.target.value.trim();if(!c.startsWith('#'))c='#'+c;try{setColor(c);}catch(err){document.getElementById('color-error').textContent=err.message;}});
document.getElementById('hex-input').addEventListener('keydown',e=>{if(e.key==='Enter')e.target.blur();});
document.getElementById('match-gable').addEventListener('change',e=>{state.matchGable=e.target.checked;update();});
document.querySelectorAll('[data-light]').forEach(b=>b.addEventListener('click',()=>{state.light=b.dataset.light;model?.lighting(state.light);document.querySelectorAll('[data-light]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b);});}));
function setView(v){model?.view(v);document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===v);b.setAttribute('aria-pressed',b.dataset.view===v);});}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
document.getElementById('reset-view').addEventListener('click',()=>setView('perspective'));
document.getElementById('viewport').addEventListener('orbitstart',()=>document.querySelectorAll('[data-view]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false');}));
function miniPalette(colors){const div=document.createElement('span');div.className='mini-palette';for(const k of ['siding','trim','door']){const i=document.createElement('i');i.style.background=colors[k];div.appendChild(i);}return div;}
presets.forEach(p=>{const b=document.createElement('button');b.className='preset';b.appendChild(miniPalette(p));b.append(document.createTextNode(p.name));b.addEventListener('click',()=>{state={...state,...p,gable:p.siding,matchGable:true};update();});document.getElementById('presets').appendChild(b);});
function persist(){try{localStorage.setItem('westover-looks',JSON.stringify(saved));return true;}catch{toast('Browser storage is unavailable. These looks will last for this visit.');return false;}}
document.getElementById('save-look').addEventListener('click',()=>{if(saved.some(x=>['siding','trim','door','gable'].every(k=>x.colors[k]===state[k]))){toast('This combination is already saved.');return;}if(saved.length>=24){toast('Your shortlist is full. Remove a look to save another.');return;}saved.push({id:crypto.randomUUID(),name:name(state.siding),colors:{...state}});const ok=persist();update();if(ok)toast('Combination saved to your shortlist.');});
function renderSaved(){const list=document.getElementById('saved-list');list.replaceChildren();if(!saved.length){const p=document.createElement('p');p.className='empty-state';p.textContent='Find a combination you love, then save it here.';list.append(p);return;}for(const look of saved){const card=document.createElement('div');card.className='saved-card';card.append(miniPalette(look.colors));const detail=document.createElement('div');detail.className='saved-detail';const title=document.createElement('h3');title.textContent=name(look.colors.siding);const meta=document.createElement('p');meta.textContent=`${code(look.colors.siding)} · ${name(look.colors.trim)} trim`;detail.append(title,meta);card.append(detail);const apply=document.createElement('button');apply.className='button';apply.textContent='Apply look';apply.addEventListener('click',()=>{state={...state,...look.colors};model?.lighting(state.light);document.querySelectorAll('[data-light]').forEach(b=>{b.classList.toggle('active',b.dataset.light===state.light);b.setAttribute('aria-pressed',b.dataset.light===state.light);});update();document.getElementById('saved-dialog').close();toast('Saved look applied.');});const remove=document.createElement('button');remove.className='remove-look';remove.textContent='×';remove.setAttribute('aria-label','Remove '+name(look.colors.siding)+' combination');remove.addEventListener('click',()=>{saved=saved.filter(x=>x.id!==look.id);persist();update();renderSaved();});card.append(apply,remove);list.append(card);}}
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
    ctx.font='15px sans-serif';ctx.fillText(name(state[k]),x+36,y+93,(canvas.width-64)/4-46);
    ctx.font='13px sans-serif';ctx.fillText(code(state[k]),x+36,y+113);
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
    name:'set_house_palette',title:'Change house paint colors',description:'Apply hex paint colors to the 3D house. Changes the visible preview only; does not save a combination.',inputSchema:{type:'object',properties:{siding:{type:'string',pattern:'^#[0-9a-fA-F]{6}$'},trim:{type:'string',pattern:'^#[0-9a-fA-F]{6}$'},door:{type:'string',pattern:'^#[0-9a-fA-F]{6}$'},gable:{type:'string',pattern:'^#[0-9a-fA-F]{6}$'},matchGable:{type:'boolean'},light:{type:'string',enum:['day','cloud','evening']}},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){
      if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Expected a paint palette object.');
      const allowed=['siding','trim','door','gable','matchGable','light'];
      for(const [key,value] of Object.entries(input)){if(!allowed.includes(key))throw new Error('Unknown paint setting: '+key);if(['siding','trim','door','gable'].includes(key)&&!validHex(value))throw new Error('Colors must use six-digit hex notation.');if(key==='matchGable'&&typeof value!=='boolean')throw new Error('matchGable must be true or false.');if(key==='light'&&!['day','cloud','evening'].includes(value))throw new Error('Unknown lighting condition.');}
      const next={...state,...input};for(const key of ['siding','trim','door','gable'])next[key]=next[key].toLowerCase();if(input.gable&&!('matchGable' in input))next.matchGable=false;state=next;update();model?.lighting(state.light);document.querySelectorAll('[data-light]').forEach(b=>{b.classList.toggle('active',b.dataset.light===state.light);b.setAttribute('aria-pressed',b.dataset.light===state.light);});model?.render();return {colors:{...state}};
    }
  }];
  for(const tool of tools){try{Promise.resolve(modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
  addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
