import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { createLapBoardGeometry, createGableShingles } from './siding-geometry.js';

export function createHouse(container, colors) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e9ede7');
  scene.fog = new THREE.Fog('#e9ede7', 45, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  container.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', '3D house. Drag to orbit, scroll or pinch to zoom. Use the view buttons for preset angles.');
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 150);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = .075;
  controls.minDistance = 12;
  controls.maxDistance = 49;
  controls.maxPolarAngle = Math.PI * .48;
  controls.target.set(0, 3.6, 0);
  const mat = (c, roughness = .86) => new THREE.MeshStandardMaterial({ color: c, roughness });
  const materials = { siding: mat(colors.siding), gable: mat(colors.gable), trim: mat(colors.trim), door: mat(colors.door) };
  const sidingReveal = materials.siding.clone(), shingleReveal = materials.gable.clone();
  function updateReveals() {
    sidingReveal.color.copy(materials.siding.color).multiplyScalar(.65);
    shingleReveal.color.copy(materials.gable.color).multiplyScalar(.62);
  }
  updateReveals();
  const lapGeometry = createLapBoardGeometry();
  const roof = mat('#343b3e'), foundation = mat('#686f65'), glass = mat('#23383d', .24), sash = mat('#dddcd3'), wood = mat('#8f7154'), brick = mat('#806353'), stone = mat('#b3ac96');
  glass.metalness = .25;
  const house = new THREE.Group();scene.add(house);
  const cube = new THREE.BoxGeometry(1, 1, 1);
  const batches = new Map();
  function box(w,h,d,x,y,z,m=materials.trim,rotation=0,parent=house) {
    const mesh = new THREE.Mesh(cube, m);mesh.scale.set(w,h,d);mesh.position.set(x,y,z);mesh.rotation.y=rotation;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function beam(a,b,width,depth,m=materials.trim,parent=house) {
    const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),mesh=new THREE.Mesh(cube,m);
    mesh.position.copy(A).add(B).multiplyScalar(.5);mesh.scale.set(width,A.distanceTo(B),depth);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.sub(A).normalize());mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function plank(w,h,d,x,y,z,m,rot=0) {
    if(!batches.has(m))batches.set(m,[]);
    const transform=new THREE.Object3D();transform.position.set(x,y,z);transform.scale.set(w,h,d);transform.rotation.y=rot;transform.updateMatrix();batches.get(m).push(transform.matrix.clone());
  }
  function wall(width,bottom,top,x,z,rot=0,m=materials.siding){
    // Each overlapping course has a real lower edge to catch grazing light.
    for(let y=bottom;y<top-.01;y+=.19){const h=Math.min(.19,top-y);plank(width,Math.max(.015,h-.018),.085,x,y+h/2,z,m,rot);}
  }
  function rectangle(x0,x1,z0,z1,bottom,top,m=materials.siding){
    box(x1-x0,top-bottom,z1-z0,(x0+x1)/2,(top+bottom)/2,(z0+z1)/2,m===materials.siding?sidingReveal:m);
    wall(x1-x0,bottom,top,(x0+x1)/2,z1+.012,0,m);wall(x1-x0,bottom,top,(x0+x1)/2,z0-.012,Math.PI,m);
    wall(z1-z0,bottom,top,x0-.012,(z0+z1)/2,-Math.PI/2,m);wall(z1-z0,bottom,top,x1+.012,(z0+z1)/2,Math.PI/2,m);
  }
  function gable(width,base,rise,cx,z,rot=0,m=materials.gable){
    const g=new THREE.Group();g.position.set(cx,base,z);g.rotation.y=rot;house.add(g);
    const s=new THREE.Shape();s.moveTo(-width/2,0);s.lineTo(width/2,0);s.lineTo(0,rise);s.closePath();
    const geo=new THREE.ExtrudeGeometry(s,{depth:.065,bevelEnabled:false});const face=new THREE.Mesh(geo,shingleReveal);face.castShadow=true;face.receiveShadow=true;g.add(face);
    const shingles=new THREE.Mesh(createGableShingles(width,rise),m);
    shingles.castShadow=true;shingles.receiveShadow=true;g.add(shingles);
    g.userData.surface='Hardie shingle gable';
    return g;
  }
  function gableRoof(width,depth,base,rise,cx,cz,rotation=0,brackets=true,trimEnds=[-1,1]){
    const g=new THREE.Group();g.position.set(cx,base,cz);g.rotation.y=rotation;house.add(g);
    const over=.43,half=width/2+over,slope=rise/(width/2),height=half*slope,length=Math.hypot(half,height),angle=Math.atan(slope);
    for(const side of [-1,1]){
      const panel=box(length,.14,depth+.8,side*half/2,rise-height/2,0,roof,0,g);panel.rotation.z=-side*angle;
      const soffit=box(length,.10,depth+.7,side*half/2,rise-height/2-.12,0,materials.trim,0,g);soffit.rotation.z=-side*angle;
      for(const end of trimEnds){
        beam([0,rise+.04,end*(depth/2+.44)],[side*half,rise-height+.04,end*(depth/2+.44)],.18,.15,materials.trim,g);
        if(brackets){for(const frac of [.12,.82]){const x=side*half*frac,y=rise-height*frac-.16,z=end*(depth/2+.3);beam([x,y-.65,z-end*.31],[x,y,z],.1,.1,materials.trim,g);}}
      }
      box(.12,.14,depth+.9,side*half,rise-height-.07,0,materials.trim,0,g);
      // Thin courses on the roof suggest asphalt shingles without distracting from paint.
      for(let t=.22;t<length;t+=.27){const p=box(.014,.012,depth+.77,side*t*Math.cos(angle),rise-t*Math.sin(angle)+.083,0,mat('#41474a'),0,g);p.rotation.z=-side*angle;}
    }
    return g;
  }
  function windowUnit(x,y,z,w=1.35,h=1.85,rot=0,count=1){
    const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=rot;house.add(g);
    const total=w*count+.10*(count-1);
    box(total+.25,h+.24,.13,0,0,.015,materials.trim,0,g);
    box(total+.10,h+.09,.14,0,0,.09,sash,0,g);
    for(let i=0;i<count;i++){
      const xx=(i-(count-1)/2)*(w+.10);
      box(w-.09,h-.09,.06,xx,0,.175,glass,0,g);
      box(.045,h,.075,xx-w/2+.02,0,.21,sash,0,g);box(.045,h,.075,xx+w/2-.02,0,.21,sash,0,g);
      box(w,.055,.075,xx,0,.22,sash,0,g);
      // Subtle reflection and interior blinds.
      const reflection=mat('#425657',.3);box(w-.15,h*.41,.006,xx,h*.23,.21,reflection,0,g);
      for(let by=-h/2+.13;by<-.12;by+=.085)box(w-.15,.012,.008,xx,by,.213,mat('#576463'),0,g);
    }
    box(total+.36,.095,.25,0,-h/2-.13,.09,materials.trim,0,g);
    box(total+.35,.075,.19,0,h/2+.15,.02,materials.trim,0,g);
    return g;
  }
  // Front is +Z. The terrain falls toward -Z, exposing a basement.
  box(9.1,3.33,8.5,0,-.785,-.4,foundation);
  box(4.45,3.33,2,2.325,-.785,-5.65,foundation);
  box(4.65,.11,2.05,-2.22,.79,-5.66,materials.trim);
  rectangle(-4.55,4.55,-6.65,3.85,.88,3.85);
  rectangle(-.35,4.55,-5.45,3.85,3.85,6.65);
  // Cross gable on the side visible in the supplied side photographs.
  rectangle(-4.55,-.34,-2.4,1.45,3.85,6.38);
  gable(4.9,6.65,1.52,2.1,3.91);gable(4.9,6.65,1.52,2.1,-5.52,Math.PI);
  gableRoof(4.9,9.3,6.65,1.52,2.1,-.8);
  gable(3.85,6.38,1.24,-4.62,-.475,-Math.PI/2);
  gableRoof(3.85,5.8,6.38,1.24,-1.65,-.475,Math.PI/2,true,[-1]);
  // Lower front-side roof and rear addition.
  gableRoof(4.3,4.2,3.86,1.11,-2.47,2.05);
  gable(4.3,3.86,1.11,-2.47,4.18);
  gableRoof(4.3,4,3.86,.80,-2.47,-4.74);
  gable(4.3,3.86,.80,-2.47,-6.8,Math.PI);
  for(const x of [-4.56,4.56])for(const z of [-6.65,3.86])box(.19,3.05,.19,x,2.39,z);
  for(const x of [-.35,4.56])for(const z of [-5.45,3.86])box(.19,2.82,.19,x,5.25,z);
  for(const x of [-4.56,-.34])for(const z of [-2.4,1.45])box(.19,2.53,.19,x,5.115,z);
  box(9.22,.18,10.65,0,.9,-1.4,materials.trim);
  // Two paired upstairs windows, one pair beside the porch.
  windowUnit(.67,5.27,3.91,.84,1.60,0,2);windowUnit(3.11,5.27,3.91,.84,1.60,0,2);
  windowUnit(2.9,2.33,3.94,1.01,1.73,0,2);
  windowUnit(-3.8,2.33,3.94,.83,1.97);windowUnit(-.50,2.33,3.94,.83,1.97);
  // Craftsman front door.
  box(1.30,2.35,.13,-2.1,2.085,3.93,materials.trim);
  box(1.04,2.17,.15,-2.1,2.02,4.02,materials.door);
  for(const xx of [-2.36,-1.85])for(const yy of [1.42,2.15])box(.36,.55,.035,xx,yy,4.12,materials.door);
  for(const xx of [-2.4,-2.1,-1.8])box(.22,.39,.02,xx,2.73,4.13,glass);
  box(.06,.18,.07,-1.7,1.98,4.15,mat('#b59b61',.3));
  // Porch, offset left as in the front photo.
  box(6.45,.26,2.82,-1.68,.94,5.11,materials.trim);
  box(6.27,.08,2.72,-1.68,1.12,5.11,wood);
  for(let x=-4.78;x<1.4;x+=.17)box(.014,.012,2.7,x,1.167,5.11,mat('#76634e'));
  const porchWidth=6.6,porchX=-1.65,porchZ=5.0;
  gableRoof(porchWidth,3.65,3.91,1.49,porchX,porchZ);
  gable(porchWidth,3.91,1.49,porchX,6.86);
  box(6.63,.33,.22,porchX,3.76,6.72,materials.trim);
  for(let x=-4.83;x<1.65;x+=.16)box(.017,.30,.025,x,3.76,6.845,materials.trim);
  box(6.3,.07,2.75,porchX,3.69,5.15,materials.trim);
  for(const x of [-4.62,1.28]){
    box(.27,2.45,.27,x,2.39,6.47);box(.38,.14,.38,x,1.21,6.47);box(.39,.17,.39,x,3.58,6.47);
    beam([x,3.12,6.47],[x+(x<0?.48:-.48),3.60,6.47],.095,.095);
  }
  function railing(x1,z1,x2,z2,y=1.15){
    const l=Math.hypot(x2-x1,z2-z1),n=Math.ceil(l/.16);
    beam([x1,y+.99,z1],[x2,y+.99,z2],.10,.11);beam([x1,y+.13,z1],[x2,y+.13,z2],.07,.07);
    for(let i=1;i<n;i++){const t=i/n;box(.045,.86,.045,x1+(x2-x1)*t,y+.55,z1+(z2-z1)*t);}
  }
  railing(-4.62,6.47,-2.55,6.47);railing(-1.12,6.47,1.28,6.47);railing(-4.62,4.1,-4.62,6.47);railing(1.28,4.1,1.28,6.47);
  for(const x of [-2.55,-1.12]){box(.17,1.2,.17,x,1.70,6.48);box(.25,.07,.25,x,2.32,6.48);}
  // Brick steps to the front path.
  for(let i=0;i<6;i++){
    const z=6.7+i*.28,h=1.1-i*.175;
    box(1.44,h,.32,-1.84,h/2,z,brick);box(1.49,.045,.35,-1.84,h+.01,z,stone);
  }
  for(const x of [-2.63,-1.03]){
    box(.18,.96,.18,x,.48,8.13);box(.27,.08,.27,x,1.0,8.13);
    beam([x,2.18,6.56],[x,1.02,8.13],.095,.12);
    for(let i=0;i<8;i++){const t=i/8,y=1.03-t*1.04;box(.04,.9,.04,x,y+.54,6.64+t*1.49);}
  }
  // Left elevation windows, matching the long wall and cross gable rhythm.
  windowUnit(-4.62,2.28,2.55,1.02,1.9,-Math.PI/2,2);
  windowUnit(-4.62,2.30,-.72,1.0,1.9,-Math.PI/2,2);
  windowUnit(-4.62,2.25,-4.80,.85,1.68,-Math.PI/2,2);
  windowUnit(-4.65,5.12,-.48,.84,1.62,-Math.PI/2,2);
  // Right elevation and rear: inferred placements where photos don't show detail.
  for(const z of [1.9,-1.6,-4.4])windowUnit(4.62,2.35,z,.93,1.68,Math.PI/2,1);
  for(const z of [1.35,-2.4])windowUnit(4.62,5.24,z,.91,1.53,Math.PI/2,1);
  windowUnit(2.10,5.24,-5.53,.85,1.62,Math.PI,2);
  for(const x of [-3.6,-1.65,.25,2.8])windowUnit(x,2.72,-6.73,.78,.89,Math.PI,1);
  windowUnit(-4.61,-.58,-2.6,.72,.67,-Math.PI/2);windowUnit(-4.61,-.58,.6,.72,.67,-Math.PI/2);
  windowUnit(1.8,-.85,-6.73,.78,1.38,Math.PI);
  // Rear cantilever with timber posts visible in the downhill photograph.
  for(const x of [-4.38,-1.4,.20])box(.15,3.30,.15,x,-.80,-6.48,wood);
  // Chimney, rain gutters and downspouts.
  box(.77,2.26,.75,3.77,7.12,-2.95,brick);
  for(let y=6.2;y<8.22;y+=.12)box(.79,.016,.77,3.77,y,-2.95,mat('#a68e7d'));
  box(.89,.22,.88,3.77,8.21,-2.95,roof);box(.82,.46,.81,3.77,8.48,-2.95,roof);box(1,.08,1,3.77,8.75,-2.95,roof);
  for(const [x,z,y] of [[4.68,3.80,6.5],[-4.68,1.35,6.2],[-4.70,-6.68,3.7]]){
    box(.075,y+1.6,.075,x,(y-1.6)/2,z);beam([x,y,z],[x+Math.sign(x)*.32,y+.24,z],.08,.08);
  }
  // Small, grounded details at the front door.
  const numberCanvas=document.createElement('canvas');numberCanvas.width=128;numberCanvas.height=256;const nc=numberCanvas.getContext('2d');nc.fillStyle='#344137';nc.font='70px Georgia';nc.textAlign='center';nc.fillText('4',64,94);nc.fillText('1',64,174);const numberTex=new THREE.CanvasTexture(numberCanvas);numberTex.colorSpace=THREE.SRGBColorSpace;
  const number=new THREE.Mesh(new THREE.PlaneGeometry(.18,.36),new THREE.MeshBasicMaterial({map:numberTex,transparent:true}));number.position.set(1.28,2.9,6.613);house.add(number);
  box(.15,.21,.15,-2.12,3.47,5.87,mat('#414639'));
  // Batch repeated siding boards into just two draw calls.
  for(const [m,transforms] of batches){const instances=new THREE.InstancedMesh(lapGeometry,m,transforms.length);transforms.forEach((a,i)=>instances.setMatrixAt(i,a));instances.castShadow=true;instances.receiveShadow=true;house.add(instances);}
  const environment=new THREE.Group();scene.add(environment);
  // A gently sloping miniature lot keeps the exposed basement believable.
  function groundY(z){return z>4 ? -.12 : Math.max(-2.45,-.12-(4-z)*.24);}
  const terrain=new THREE.PlaneGeometry(33,36,1,24);terrain.rotateX(-Math.PI/2);const positions=terrain.attributes.position;
  for(let i=0;i<positions.count;i++)positions.setY(i,groundY(positions.getZ(i)));terrain.computeVertexNormals();
  const grass=new THREE.Mesh(terrain,mat('#b5c1a6'));grass.receiveShadow=true;environment.add(grass);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),mat('#e9ede7'));ground.rotation.x=-Math.PI/2;ground.position.y=-2.6;ground.receiveShadow=true;scene.add(ground);
  // Front flagstone path, lawn and planted beds.
  for(let i=0;i<10;i++){const z=8.3+i*.44,x=-1.83-(i>3?(i-3)*.1:0);box(1.5,.035,.42,x,groundY(z)+.028,z,stone,Math.sin(i)*.035,environment);}
  box(10,.045,1.7,-.1,-.095,5.2,mat('#918775'),0,environment);
  const foliage=[mat('#738164'),mat('#859171'),mat('#667759'),mat('#9ba185')];
  let seed=41;function rand(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646;}
  const leafGeo=new THREE.IcosahedronGeometry(1,2);
  function bush(x,z,r=.55){const y=groundY(z);for(let i=0;i<4;i++){const leaf=new THREE.Mesh(leafGeo,foliage[i%4]);leaf.position.set(x+(rand()-.5)*r,y+r*.55+rand()*.25,z+(rand()-.5)*r);leaf.scale.set(r*.8,r*.66,r*.8);leaf.castShadow=true;leaf.receiveShadow=true;environment.add(leaf);}}
  for(const p of [[-4.5,7,.65],[-3.7,7.2,.62],[-3.2,8.4,.44],[-.3,7.35,.55],[.7,7.4,.5],[2,5.2,.5],[3.1,5.3,.55],[4.5,5.1,.60],[-5.4,3,.62],[-5.5,.9,.55],[-5.7,-1.4,.6]])bush(...p);
  for(let i=0;i<15;i++){const x=-5.2-i*.05,z=6-i*.52,y=groundY(z);const b=new THREE.Mesh(new THREE.DodecahedronGeometry(.29,0),stone);b.position.set(x,y+.16,z);b.scale.set(1,.7,1);b.rotation.set(rand(),rand(),rand());b.castShadow=true;environment.add(b);}
  function tree(x,z,scale){const y=groundY(z);const trunkMat=mat('#8a8673');const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.10*scale,.17*scale,3.7*scale,7),trunkMat);trunk.position.set(x,y+1.85*scale,z);trunk.castShadow=true;environment.add(trunk);
    for(let i=0;i<5;i++){const leaf=new THREE.Mesh(new THREE.IcosahedronGeometry(1,2),foliage[i%4]);leaf.position.set(x+(rand()-.5)*1.4*scale,y+(3.9+rand()*1.7)*scale,z+(rand()-.5)*1.5*scale);leaf.scale.set(1.35*scale,1.5*scale,1.25*scale);leaf.castShadow=true;leaf.receiveShadow=true;environment.add(leaf);}
  }
  tree(-13,-6,.85);tree(13,-7,.85);tree(-12,-14,.85);tree(12,-15,.85);
  const ambient=new THREE.HemisphereLight('#f6faff','#939d83',2.5);scene.add(ambient);
  const sun=new THREE.DirectionalLight('#fff4de',3.0);sun.position.set(-10,18,15);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-18;sun.shadow.camera.right=18;sun.shadow.camera.top=20;sun.shadow.camera.bottom=-18;sun.shadow.normalBias=.025;sun.shadow.bias=-.0001;sun.shadow.radius=3;scene.add(sun);sun.target.position.set(0,1,0);scene.add(sun.target);
  const fill=new THREE.DirectionalLight('#dee9f5',.55);fill.position.set(10,8,-8);scene.add(fill);
  const views={perspective:[-17,10.5,23],front:[-.25,5.0,29],side:[-28,9,.2],rear:[14,8,-27]};
  let animation=null;
  function view(name,instant=false){const goal=views[name]||views.perspective;const target=new THREE.Vector3(...goal);if(container.clientWidth<550)target.multiplyScalar(1.23);else target.multiplyScalar(1.06);if(instant||matchMedia('(prefers-reduced-motion: reduce)').matches){camera.position.copy(target);controls.target.set(0,3.6,0);controls.update();}else animation={from:camera.position.clone(),to:target,fromTarget:controls.target.clone(),start:performance.now()};}
  controls.addEventListener('start',()=>{animation=null;container.dispatchEvent(new CustomEvent('orbitstart'));});
  function lighting(mode){if(mode==='cloud'){sun.intensity=.75;ambient.intensity=3.05;sun.color.set('#f3f8ff');scene.background.set('#e6eaE7');sun.position.set(-10,18,15);}else if(mode==='evening'){sun.intensity=2.8;ambient.intensity=1.45;sun.color.set('#ffcd91');scene.background.set('#e9e6db');sun.position.set(-16,8,12);}else{sun.intensity=3;ambient.intensity=2.5;sun.color.set('#fff4de');scene.background.set('#e9ede7');sun.position.set(-10,18,15);}scene.fog.color.copy(scene.background);}
  function resize(){const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
  const observer=new ResizeObserver(resize);observer.observe(container);resize();view('perspective',true);
  renderer.setAnimationLoop(()=>{if(animation){const t=Math.min(1,(performance.now()-animation.start)/650),e=1-Math.pow(1-t,3);camera.position.lerpVectors(animation.from,animation.to,e);controls.target.lerpVectors(animation.fromTarget,new THREE.Vector3(0,3.6,0),e);if(t===1)animation=null;}controls.update();renderer.render(scene,camera);});
  document.getElementById('loading')?.remove();
  return {setColors(next){for(const k in materials)if(next[k])materials[k].color.set(next[k]);updateReveals();},view,lighting,renderer,scene,camera,materials,render(){renderer.render(scene,camera);},dispose(){observer.disconnect();renderer.setAnimationLoop(null);controls.dispose();renderer.dispose();}};
}
