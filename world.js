// A compact interpretation of the coastal gardens, granite villas and tree avenues of Badaguan.
export function buildWorld(THREE, scene) {
  let seed = 91368;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const between = (a, b) => a + random() * (b - a);
  const pick = array => array[Math.floor(random() * array.length)];
  const PI = Math.PI, TAU = PI * 2;
  const world = new THREE.Group();
  world.name = 'Badaguan coastal gardens';
  scene.add(world);

  function texture(size, paint, repeat = false) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    paint(canvas.getContext('2d'), size);
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    return t;
  }
  const plain = new THREE.MeshLambertMaterial({vertexColors:true});
  function mapped(map, options = {}) {
    return new THREE.MeshLambertMaterial({map, vertexColors:true, ...options});
  }
  function noise(ctx, size, strength) {
    const image = ctx.getImageData(0,0,size,size);
    for (let i=0;i<image.data.length;i+=4) {
      const v = between(-strength, strength);
      for (let c=0;c<3;c++) image.data[i+c] += v;
    }
    ctx.putImageData(image,0,0);
  }
  function surfaceTexture(color, flecks, detail) {
    return texture(256,(ctx,s)=>{
      ctx.fillStyle=color; ctx.fillRect(0,0,s,s);
      for(let i=0;i<3900;i++) {
        ctx.fillStyle=pick(flecks);
        ctx.fillRect(random()*s,random()*s,between(.4,3.3),between(.3,1.5));
      }
      noise(ctx,s,detail);
    },true);
  }
  const masonry = mapped(texture(512,(ctx,s)=>{
    ctx.fillStyle='#79796c'; ctx.fillRect(0,0,s,s);
    const palette=['#a4a296','#aaa797','#a6a59c','#a79c8d','#b8b4a4','#928f86','#b3afa1','#aca99c','#aaa59c'];
    const rowHeights=[48,50,60,39,55,46,62,57,50,45];
    let y=0;
    for(let r=0;r<rowHeights.length;r++) {
      const h=rowHeights[r], n=r%3===0?6:7, offset=r%2===0?0:42;
      for(let k=-1;k<n;k++) {
        const left=k*s/n+offset, right=(k+1)*s/n+offset-2;
        ctx.fillStyle=pick(palette); ctx.beginPath(); ctx.moveTo(left+3,y+3);
        ctx.lineTo(left+12,y+1); ctx.lineTo(right-6,y+between(1,3)); ctx.lineTo(right,y+7);
        ctx.lineTo(right-1,y+h-5); ctx.lineTo(right-6,y+h-2); ctx.lineTo(left+8,y+h-1);
        ctx.lineTo(left,y+h-7); ctx.closePath(); ctx.fill();
        ctx.strokeStyle='rgba(248,236,201,.28)'; ctx.beginPath(); ctx.moveTo(left+3,y+h-8);
        ctx.lineTo(left+3,y+6);ctx.lineTo(left+11,y+3);ctx.lineTo(right-7,y+3);ctx.stroke();
        for(let p=0;p<18;p++) {
          ctx.fillStyle=pick(['#8b8a7c55','#d6ceba50','#aaa9a555']);
          ctx.beginPath();ctx.ellipse(between(left+5,right-5),between(y+4,y+h-4),between(1,8),between(1,3),random(),0,TAU);ctx.fill();
        }
      }
      y+=h;
    }
    noise(ctx,s,10);
  },true));
  const stucco = mapped(surfaceTexture('#dfccac',['#fcf0d066','#aa977f55'],6));
  const earth = mapped(surfaceTexture('#777c4d',['#b0a863','#575f39','#8f914b','#9d8540'],10));
  const gravel = mapped(surfaceTexture('#ab9d84',['#d9c6a6','#827c6e','#aca080','#746d61'],8));
  const paving = mapped(texture(512,(ctx,s)=>{
    ctx.fillStyle='#8d8370';ctx.fillRect(0,0,s,s);
    for(let row=0;row<12;row++){
      const h=s/12,w=s/5;
      for(let k=-1;k<=5;k++){
        const x=k*w+(row%2)*w*.5,y=row*h;
        ctx.fillStyle=pick(['#b8ad97','#b1a58e','#b8ac94','#bdb19a','#ada38d','#b9af9a']);
        ctx.fillRect(x+1,y+1,w-2,h-2);
        ctx.fillStyle='#c5baa455';ctx.fillRect(x+2,y+2,w-4,1.7);
        ctx.fillStyle='#81796466';ctx.fillRect(x+2,y+h-3,w-4,1.2);
      }
    }
    noise(ctx,s,10);
  },true));
  const sand = mapped(surfaceTexture('#cebf99',['#a89b7b','#c9b490','#d9cba8'],5));
  const bark = mapped(texture(256,(ctx,s)=>{
    ctx.fillStyle='#74624e';ctx.fillRect(0,0,s,s);
    for(let i=0;i<220;i++){
      const x=random()*s, y=random()*s, w=between(2,20), h=between(10,65);
      ctx.fillStyle=pick(['#867356','#a3906f','#696049','#998461','#6e634a','#ab9977','#655944']);
      ctx.beginPath();ctx.moveTo(x,y);
      ctx.bezierCurveTo(x-w,y+h*.45,x+w*.5,y+h*.5,x-w*.35,y+h);
      ctx.bezierCurveTo(x+w*1.35,y+h*.66,x+w*.6,y+h*.23,x,y);ctx.fill();
    }
    for(let i=0;i<420;i++){
      const x=random()*s,y=random()*s,dy=between(5,46);
      ctx.strokeStyle=pick(['#4e463f55','#b2a18359','#403c2e33']);
      ctx.lineWidth=between(.7,1.7);
      ctx.beginPath();ctx.moveTo(x,y);
      ctx.bezierCurveTo(x+3,y+dy*.36,x-3,y+dy*.64,x+between(-2,3),y+dy);
      ctx.stroke();
    }
    noise(ctx,s,8);
  },true));
  const tiles = mapped(texture(256,(ctx,s)=>{
    ctx.fillStyle='#8b5c47';ctx.fillRect(0,0,s,s);
    for(let r=-1;r<12;r++) for(let k=-1;k<10;k++){
      const x=k*32+(r%2)*16,y=r*23;
      ctx.fillStyle=pick(['#ac7658','#b47e60','#bd8563','#a06a53','#a97156']);
      ctx.fillRect(x+1,y+1,30,20);
      ctx.fillStyle='#805743';ctx.fillRect(x+2,y+18,30,3);
      ctx.fillStyle='#d29a78';ctx.fillRect(x+3,y+2,3,16);
    }
    noise(ctx,s,5);
  },true),{side:THREE.DoubleSide});
  const leafMaterials = [
    ['#736024','#a68023','#cca435','#e0b63b','#f4cb4e','#ffdf78'],
    ['#586326','#798736','#959c42','#b2ac46','#c7be55','#dad279'],
    ['#854b20','#a96123','#ce8229','#e6a43b','#f4ba51','#fbd37c'],
    ['#384b28','#4c6232','#63783a','#798a41','#959c53','#b1ae6a']
  ].map((palette,index)=>mapped(texture(256,(ctx)=>{
    // Irregular sprays with open spaces instead of a continuous spherical crown.
    for(let branch=0;branch<9;branch++){
      const originX=between(60,181), originY=between(95,176);
      const direction=between(-2.9,-.24), length=between(41,98);
      for(let cluster=0;cluster<12;cluster++){
        const d=random()*length, lateral=between(-19,19);
        const x=originX+Math.cos(direction)*d+Math.cos(direction+PI*.5)*lateral;
        const y=originY+Math.sin(direction)*d+Math.sin(direction+PI*.5)*lateral;
        const radius=between(9,24);
        for(let l=0;l<42;l++){
          const theta=random()*TAU, spread=Math.sqrt(random())*radius;
          const px=x+Math.cos(theta)*spread,py=y+Math.sin(theta)*spread;
          const light=(136-py)*.011+between(-.3,5.1);
          ctx.fillStyle=palette[Math.max(0,Math.min(5,Math.floor(light)))];
          ctx.save();ctx.translate(px,py);ctx.rotate(between(-1.7,1.7));
          const w=between(1.6,4),h=between(1.1,3.2);
          ctx.beginPath();ctx.moveTo(-w,0);ctx.lineTo(-w*.4,-h*.26);ctx.lineTo(-w*.57,-h*.81);
          ctx.lineTo(0,-h*.44);ctx.lineTo(w*.27,-h);ctx.lineTo(w*.55,-h*.22);ctx.lineTo(w,0);
          ctx.lineTo(w*.25,h*.54);ctx.lineTo(-w*.25,h*.47);ctx.closePath();ctx.fill();ctx.restore();
        }
      }
    }
  }),{alphaTest:.40,side:THREE.DoubleSide,emissive:index===3?0x11180a:0x291a07}));
  const glassWindows = [false,true].map(arched => mapped(texture(256,(ctx,s)=>{
    const x=17, right=239, top=17, spring=arched?89:top;
    ctx.beginPath();ctx.moveTo(x,249);ctx.lineTo(x,spring);
    if(arched)ctx.bezierCurveTo(x,-7,right,-7,right,spring);
    else ctx.lineTo(right,top);
    ctx.lineTo(right,249);ctx.closePath();ctx.clip();
    ctx.fillStyle='#c6c0ac';ctx.fillRect(0,0,s,s);
    ctx.beginPath();ctx.moveTo(35,232);ctx.lineTo(35,spring+3);
    if(arched)ctx.bezierCurveTo(35,16,220,16,220,spring+3);
    else ctx.lineTo(220,top+13);
    ctx.lineTo(220,232);ctx.closePath();ctx.clip();
    const gradient=ctx.createLinearGradient(0,0,s*.7,s);
    gradient.addColorStop(0,'#a4b2b5');gradient.addColorStop(.34,'#7b9197');gradient.addColorStop(.61,'#52666b');gradient.addColorStop(1,'#343d33');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,s,s);
    for(let i=0;i<32;i++){
      ctx.strokeStyle='rgba(191,195,168,.13)';ctx.lineWidth=between(1,4);
      const xx=between(-50,260),yy=between(30,210);
      ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx+40, yy-50);ctx.stroke();
    }
    if(arched){
      ctx.lineWidth=4;ctx.strokeStyle='#d9cfb7';
      for(let a=0;a<=PI;a+=PI/4){
        ctx.beginPath();ctx.moveTo(128,91);ctx.lineTo(128+94*Math.cos(a),91-68*Math.sin(a));ctx.stroke();
      }
      ctx.beginPath();ctx.ellipse(128,91,29,23,0,PI,TAU);ctx.stroke();
    }
    for(const x of [75,126,177]){
      ctx.fillStyle='#5c5749';ctx.fillRect(x-2,94,7,147);
      ctx.fillStyle='#d0c5aa';ctx.fillRect(x-2,94,4,147);
    }
    for(const h of [91,140,187]){ctx.fillStyle='#564f43';ctx.fillRect(0,h,s,8);ctx.fillStyle='#d6ceb9';ctx.fillRect(0,h,s,4);}
  }),{alphaTest:.45,side:THREE.DoubleSide}));

  // Prefabricated primitives are batched by surface to keep the garden lightweight.
  const boxGeom = new THREE.BoxGeometry(1,1,1), planeGeom = new THREE.PlaneGeometry(1,1);
  const cylCache = new Map();
  function cylinderGeo(top,n) {
    const k=top+':'+n;
    if(!cylCache.has(k))cylCache.set(k,new THREE.CylinderGeometry(top,1,1,n,1));
    return cylCache.get(k);
  }
  const batches=new Map(), scratch=new THREE.Object3D(), p=new THREE.Vector3(), normal=new THREE.Vector3(), normalMat=new THREE.Matrix3();
  const color=new THREE.Color(), obstacles=[], trunks=[];
  function add(geom,mat,x,y,z,sx,sy,sz,tint=0xffffff,rx=0,ry=0,rz=0,uvX=1,uvY=1,quat=null) {
    if(!batches.has(mat))batches.set(mat,{p:[],n:[],uv:[],c:[],i:[]});
    const out=batches.get(mat), start=out.p.length/3;
    scratch.position.set(x,y,z);scratch.scale.set(sx,sy,sz);
    if(quat)scratch.quaternion.copy(quat);else scratch.rotation.set(rx,ry,rz,'YXZ');
    scratch.updateMatrix();normalMat.getNormalMatrix(scratch.matrix);color.set(tint);
    const a=geom.attributes;
    for(let i=0;i<a.position.count;i++){
      p.fromBufferAttribute(a.position,i).applyMatrix4(scratch.matrix);normal.fromBufferAttribute(a.normal,i).applyMatrix3(normalMat).normalize();
      out.p.push(p.x,p.y,p.z);out.n.push(normal.x,normal.y,normal.z);out.c.push(color.r,color.g,color.b);
      if(geom===boxGeom && mat.map && mat.map.wrapS===THREE.RepeatWrapping){
        if(Math.abs(normal.y)>.75)out.uv.push(p.x/uvX,p.z/uvY);
        else if(Math.abs(normal.x)>.75)out.uv.push(p.z/uvX,p.y/uvY);
        else out.uv.push(p.x/uvX,p.y/uvY);
      } else out.uv.push(a.uv.getX(i)*uvX,a.uv.getY(i)*uvY);
    }
    if(geom.index)for(let i=0;i<geom.index.count;i++)out.i.push(start+geom.index.getX(i));
    else for(let i=0;i<a.position.count;i++)out.i.push(start+i);
  }
  function box(x,y,z,w,h,d,mat=plain,col=0xffffff,angle=0,repeat=3){
    add(boxGeom,mat,x,y,z,w,h,d,col,0,angle,0,repeat,repeat);
  }
  function cyl(x,y,z,r,h,mat,col=0xffffff,top=1,sides=12){
    add(cylinderGeo(top,sides),mat,x,y,z,r,h,r,col,0,0,0,Math.max(1,r*2),Math.max(1,h/3));
  }
  const up=new THREE.Vector3(0,1,0), quaternion=new THREE.Quaternion();
  function limb(a,b,r1,r2,mat=bark,col=0xffffff){
    const v=new THREE.Vector3().subVectors(b,a);const len=v.length();
    quaternion.setFromUnitVectors(up,v.normalize());
    add(cylinderGeo(Math.max(.02,Math.round((r2/r1)*10)/10),8),mat,(a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2,r1,len,r1,col,0,0,0,1,Math.max(1,len/2),quaternion);
  }
  function plane(x,y,z,w,h,mat,col,rotation=0,tilt=0,roll=0){
    add(planeGeom,mat,x,y,z,w,h,1,col,tilt,rotation,roll);
  }
  function windowAt(x,bottom,z,w,h,yaw,arched=true) {
    plane(x,bottom+h/2,z,w,h,glassWindows[arched?1:0],0xffffff,yaw);
    box(x,bottom+.045,z,w*.99,.13,.30,plain,0xb9b29e,yaw);
  }

  const coast = z => 30 + Math.sin(z*.046)*2.2+Math.cos(z*.084)*1.1;
  function heightAt(x,z) {
    const dist=x-coast(z);
    return dist<=0?0:Math.max(-1.35,-dist*.18);
  }
  box(-51,-.29,-10,154,.55,240,earth,0xffffff,0,5);
  // A curved sandy foreshore joins the terraced garden to the Yellow Sea.
  const shoreGeometry=new THREE.BufferGeometry(), shorePos=[], shoreUv=[], shoreIx=[];
  for(let iz=0;iz<=100;iz++){
    const z=110-iz*2.4;
    [25,coast(z),coast(z)+4,coast(z)+9,coast(z)+23].forEach((x,j)=>{
      shorePos.push(x,heightAt(x,z)-.022,z);shoreUv.push(x/3,z/3);
      if(iz>0&&j>0){const k=iz*5+j;shoreIx.push(k-6,k-5,k,k-6,k,k-1);}
    });
  }
  shoreGeometry.setAttribute('position',new THREE.Float32BufferAttribute(shorePos,3));shoreGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(shoreUv,2));shoreGeometry.setIndex(shoreIx);shoreGeometry.computeVertexNormals();
  add(shoreGeometry,sand,0,0,0,1,1,1);

  // Wandering avenue and the path joining the three viewpoints.
  box(-6,.014,-10,9.4,.04,218,gravel,0xc5bdac,0,4);
  for(const x of [-11.7,-.3]) {
    box(x,.072,-10,1.85,.14,218,paving,0xffedce,0,2.7);
    box(x+(x< -6?1:-1)*.98,.107,-10,.20,.21,218,masonry,0xcfccb9,0,2);
  }
  box(13,.035,4,28,.08,4.7,gravel,0xe4d6b8,0,3);
  box(23,.025,-16,3.8,.07,162,gravel,0xe6d9bb,0,3);
  box(8,.043,-13,17,.09,3,gravel,0xdacbb5,0,3);

  function hipRoof(x,y,z,w,d,h,col=0xffffff){
    const ridge=Math.max(0,(w-d)*.5);
    const coords=[[-w/2,0,d/2],[w/2,0,d/2],[w/2,0,-d/2],[-w/2,0,-d/2],[-ridge,h,0],[ridge,h,0]];
    const position=[],uv=[];
    const faces=[[0,1,5],[0,5,4],[1,2,5],[2,3,4],[2,4,5],[3,0,4]];
    faces.forEach((face,idx)=>face.forEach(i=>{let v=coords[i];position.push(...v);uv.push((idx===2||idx===5?v[2]:v[0])/3,v[1]/2);}));
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(position,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();add(g,tiles,x,y,z,1,1,1,col);
  }
  const trim=0xbdb8a7;
  // Main house, round observation tower, oriel windows, and entry loggia.
  function villa() {
    const x=11,z=-25;
    box(x,.5,z,14.9,1,10.2,masonry,0xc0c0b1);
    box(x,4,z,14.3,7.1,9.8,masonry);
    box(x,7.6,z,14.65,.3,10,plain,trim);
    box(x,3.9,z,14.5,.17,9.95,plain,0xa6a28f);
    hipRoof(x,7.78,z,15.5,11.2,2.7,0xd6b29b);
    for(const xx of [5,8.3,11.8,15.9])for(const y of [1.05,4.45]){
      windowAt(xx,y,z+4.93,1.65,2.35,0);
      windowAt(xx,y,z-4.93,1.65,2.35,PI);
    }
    for(const zz of [-27.8,-24.8,-21.8])for(const y of [1.03,4.45]){
      windowAt(3.82,y,zz,1.55,2.35,-PI/2);
      windowAt(18.18,y,zz,1.55,2.35,PI/2);
    }
    const tx=12.6,tz=-20.7,r=2.65;
    cyl(tx,6.4,tz,r,12.8,masonry,0xfff9ee,1,32);
    for(const [y,rr,h] of [[.65,2.87,.68],[4.1,2.77,.20],[7.65,2.8,.31],[11.8,2.78,.30],[12.6,2.91,.56],[13,2.98,.17]]) {
      cyl(tx,y,tz,rr,h,masonry,0xe0dfce,1,32);
    }
    for(let n=0;n<12;n++){
      const a=TAU*n/12;
      box(tx+Math.sin(a)*2.72,13.45,tz+Math.cos(a)*2.72,.86,.84,.49,masonry,0xe2e0d1,a);
      box(tx+Math.sin(a)*2.72,13.88,tz+Math.cos(a)*2.72,.95,.13,.57,plain,trim,a);
    }
    for(let row=0;row<3;row++)for(let n=0;n<8;n++){
      const a=(n+.3)*TAU/8, w=row===2?1.05:1.24;
      windowAt(tx+Math.sin(a)*(r+.03),1.05+row*3.58,tz+Math.cos(a)*(r+.03),w,2.28,a);
    }
    // Tiled dormers and an enclosed chimney give the roof an inhabited silhouette.
    box(9.25,8.73,-23.1,3.55,1.68,2.15,masonry,0xe9dfcc);
    hipRoof(9.25,9.65,-23.1,4.13,2.7,.68,0xe2c9b1);
    for(const xx of [8.52,9.98])windowAt(xx,8.21,-22.0,1.2,1.29,0,false);
    box(15.22,9.93,-26.55,.90,2.42,.90,masonry,0xe4dccb);
    box(15.22,11.19,-26.55,1.13,.22,1.14,plain,trim);
    const bx=5.5,bz=-20.4;
    cyl(bx,3.25,bz,1.85,6.5,masonry,0xf1f0df,1,8);
    cyl(bx,6.56,bz,2.05,.28,plain,trim,1,8);
    cyl(bx,7.72,bz,2.14,2.1,tiles,0xdfb8a3,.02,8);
    for(let n=-2;n<3;n++){
      const a=n*PI/4+PI/8;
      for(const y of [1.03,3.9])windowAt(bx+Math.sin(a)*1.74,y,bz+Math.cos(a)*1.74,1.06,1.95,a);
    }
    box(8.6,3.48,-18.8,4.4,.42,3.3,masonry);
    box(8.6,3.75,-18.8,4.7,.18,3.53,plain,trim);
    for(const xx of [6.75,10.5]){
      cyl(xx,1.75,-17.49,.255,3.1,masonry);
      for(const y of [.32,3.16])box(xx,y,-17.49,.72,.35,.72,plain,trim);
    }
    for(const x of [6.49,10.71])box(x,4.10,-18.8,.14,.75,3.34,masonry);
    for(const x of [6.56,10.63])box(x,4.30,-17.15,.27,1.05,.28,masonry);
    for(let i=0;i<=8;i++)cyl(6.70+i*.475,4.19,-17.15,.071,.67,plain,trim);
    box(8.60,4.54,-17.15,4.31,.16,.26,masonry);
    for(let i=0;i<6;i++)box(8.6,.055+i*.065,-15.85-i*.27,4.04,.11+i*.13,.33,masonry,0xe6e3d4);
    for(const xx of [6.65,10.55])box(xx,.49,-16.56,.31,.8,1.9,masonry);
    obstacles.push([3.65,18.35,-30.1,-19.9],[9.9,15.3,-22,-17.95],[3.6,7.3,-21.5,-18.4]);
  }
  villa();
  function cottage(x,z,w,d,wallColor,roofColor){
    const h=between(4.4,6.4);
    box(x,.38,z,w+.55,.76,d+.55,masonry);
    box(x,h/2+.5,z,w,h,d,stucco,wallColor);
    box(x,h+.4,z,w+.4,.25,d+.4,plain,0xc9b899);
    hipRoof(x,h+.55,z,w+1.15,d+1.15,2.5,roofColor);
    box(x+w*.23,h+2.4,z-1,.72,2.45,.79,masonry);
    for(let i=0;i<3;i++)for(const y of [1,h*.61]) {
      const xx=x+(i-1)*w*.31;
      windowAt(xx,y,z+d/2+.025,1.24,h*.29,0,false);
      windowAt(xx,y,z-d/2-.025,1.24,h*.29,PI,false);
    }
    for(let i=-1;i<=1;i++)for(const y of [1,h*.61]) {
      windowAt(x+w*.5+.03,y,z+i*d*.30,1.22,h*.29,PI/2,false);
      windowAt(x-w*.5-.03,y,z+i*d*.30,1.22,h*.29,-PI/2,false);
    }
    obstacles.push([x-w/2-.18,x+w/2+.18,z-d/2-.18,z+d/2+.18]);
  }
  for(const [x,z,w,d,c,r] of [[-30,-18,12,8,0xf0dfc3,0xdcb09e],[-33,15,13,8,0xe7d6b9,0xe8b4a1],[-28,-54,16,9,0xb5c8b1,0xbba395],[-35,-84,10,7,0xe5d6c1,0xd5a695],[10,-56,12,8,0xe8caa8,0xe7c1ab],[8,-88,14,8,0xdfd8bd,0xcda997],[10,37,13,8,0xddceb3,0xb99a88],[-29,57,13,8,0xeeceb5,0xeac3a9]])cottage(x,z,w,d,c,r);
  // Mature crowns are assembled around forked, tapering limbs. Angular gaps in the
  // sprays let the sky show through when the viewer is underneath the avenue.
  const contact = new THREE.MeshBasicMaterial({map:texture(128,(ctx,s)=>{
    const grad=ctx.createRadialGradient(64,64,5,64,64,59);
    grad.addColorStop(0,'rgba(37,37,23,.36)');grad.addColorStop(.72,'rgba(49,46,32,.22)');grad.addColorStop(1,'rgba(74,71,42,0)');
    ctx.fillStyle=grad;ctx.fillRect(0,0,s,s);
  }),vertexColors:true,transparent:true,depthWrite:false});
  const shadowMat = new THREE.MeshBasicMaterial({map:texture(256,(ctx,s)=>{
    for(let k=0;k<1050;k++){
      const a=random()*TAU,r=Math.sqrt(random())*108,x=128+r*Math.cos(a),y=128+r*Math.sin(a);
      const w=between(3,11), grad=ctx.createRadialGradient(x,y,0,x,y,w);
      grad.addColorStop(0,'rgba(36,35,23,.23)');grad.addColorStop(1,'rgba(36,35,23,0)');
      ctx.fillStyle=grad;ctx.fillRect(x-w,y-w,w*2,w*2);
    }
  }),vertexColors:true,transparent:true,depthWrite:false});
  function groundStamp(x,y,z,w,d,mat,angle=0) {
    add(planeGeom,mat,x,y,z,w,d,1,0xffffff,-PI/2,angle,0);
  }
  const vec=(x,y,z)=>new THREE.Vector3(x,y,z);
  function tree(x,z,h,canopy,leafIndex) {
    const radius=h*.035, mat=leafMaterials[leafIndex], yaw=random()*TAU;
    const base=vec(x,-.16,z), joint=vec(x+between(-.66,.66),h*between(.28,.43),z+between(-.55,.55));
    const lower=vec(x+between(-.10,.10),h*.115,z+between(-.10,.10));
    limb(base,lower,radius*1.16,radius*.86);
    limb(lower,joint,radius*.87,radius*.63);
    trunks.push([x,z,radius+.17]);
    for(let i=0;i<4;i++){
      const a=yaw+i*PI/2;
      limb(vec(x+Math.sin(a)*radius*2.2,-.06,z+Math.cos(a)*radius*2.2),vec(x,.83,z),radius*.52,radius*.57);
    }
    for(let i=0;i<5;i++){
      const a=yaw+i*TAU/5+between(-.28,.28), reach=canopy*between(.55,.85);
      const fork=vec(joint.x+Math.cos(a)*reach*.65,h*between(.52,.63),joint.z+Math.sin(a)*reach*.65);
      const tip=vec(joint.x+Math.cos(a)*reach,h*between(.77,.95),joint.z+Math.sin(a)*reach);
      limb(joint,fork,radius*between(.42,.64),radius*.30);
      limb(fork,tip,radius*.33,radius*.08);
      for(let j=0;j<3;j++){
        const b=a+(j-1)*.8+between(-.3,.3), anchor=j===1?tip:fork;
        const dist=canopy*between(.28,.55), end=vec(anchor.x+Math.cos(b)*dist,anchor.y+h*between(.10,.22),anchor.z+Math.sin(b)*dist);
        limb(anchor,end,j===1?radius*.14:radius*.25,radius*.045);
        const width=canopy*between(1.12,1.74);
        for(let n=0;n<3;n++){
          const rr=between(-.43,.43);
          plane(end.x+between(-.35,.35),end.y+between(-.55,.45),end.z+between(-.5,.5),width,width*between(.72,1),mat,0xffffff,b+n*PI/3,between(-.67,.67),rr);
        }
      }
    }
    groundStamp(x,.099,z,3.6,3.6,contact,yaw);
    groundStamp(x+1.25,.102,z+2.35,canopy*2.8,canopy*2.2,shadowMat,yaw);
  }
  for(let z=-101;z<91;z+=9.7) {
    tree(-13.1+between(-.5,.4),z+between(-1,1),between(9.6,14.7),between(3.5,5.2),pick([0,1,2]));
    // Leave an opening that frames the historic tower from the entry path.
    if(z < -33 || z > 13 || (z > -12 && z < -6))tree(1.35+between(-.4,.4),z+.9,between(10,14),between(3.9,5),pick([0,1,2]));
  }
  for(const [x,z,h,canopy,l] of [[-1.4,10.8,14,5,0],[19,-28,11.5,4,1],[21,-37,10,4,3],[2.7,-35,12,4.6,0],[-21,-4,14,5.1,2],[17,13,9.3,4,3],[18,-5.5,6.1,2.35,3],[16.8,-40,13,4.4,1],[20,51,9.4,3.4,2],[-19,31,12,5.2,1]])tree(x,z,h,canopy,l);
  tree(12.5,-6.8,9.1,4.5,2);
  tree(19.4,-13.6,12.2,4.9,1);
  tree(-12.6,-4.4,10.3,4.6,0);
  for(let i=0;i<29;i++)tree(between(-68,-42),between(-105,90),between(8,17),between(3.8,6.2),pick([0,1,2,3]));
  for(let i=0;i<10;i++)tree(between(4,18),-111+between(-5,4),between(10,16),between(4,5),pick([0,1,3]));

  // Autumn ground cover. Each small fan-shaped leaf shares a single draw batch.
  const leafG=new THREE.CircleGeometry(1,5,0,PI*1.5);
  for(let i=0;i<3700;i++){
    const z=between(-105,91), along=random()<.74;
    const x=along?(random()<.5?-10.6+between(-1.7,2.4):-1.1+between(-2.65,2.1)):between(-22,23);
    const s=between(.042,.128);
    const sidewalk=(x>=-12.65&&x<=-10.72)||(x>=-1.23&&x<=.72);
    const y=sidewalk?.16:(x>=-10.7&&x<=-1.3?.039:.091);
    add(leafG,plain,x,y+.002,z,s,s*between(.60,.92),1,pick([0xd8a238,0xe7b44a,0xc68d39,0xd5b25a,0xe1c163,0xb9a04c]),-PI/2,random()*TAU,0);
  }
  const blade=new THREE.BufferGeometry();
  blade.setAttribute('position',new THREE.Float32BufferAttribute([-.5,0,0,.5,0,0,.35,1,.22],3));
  blade.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,.5,1],2));blade.computeVertexNormals();
  for(let i=0;i<780;i++){
    const z=between(-65,34), x=random()<.55?between(1.05,4.85):between(4,21);
    if(Math.abs(z-4)<2.55||Math.abs(z+13)<1.55)continue;
    const height=between(.08,.27);
    for(let n=0;n<6;n++)add(blade,plain,x+between(-.12,.12),.012,z+between(-.12,.12),between(.031,.062),height,1,pick([0x81813f,0x96904b,0x777f40,0x8f8644]),between(-.19,.26),random()*TAU,between(-.32,.32));
  }
  function shrub(x,z,h,w) {
    const mat=leafMaterials[pick([1,3,3])];
    for(let i=0;i<4;i++){
      plane(x+between(-w*.24,w*.24),h*between(.47,.65),z+between(-w*.25,w*.25),w*1.3,h*between(.88,1.22),mat,0xd2cea8,i*PI/4,between(-.51,.51),between(-.34,.34));
    }
    groundStamp(x,.098,z,w*1.5,w,contact);
  }
  for(let i=0;i<118;i++){
    const x=pick([between(-21,-14),between(17,21),between(24.8,28.6)]),z=between(-92,83);
    if(Math.abs(z-4)>3)shrub(x,z,between(.52,1.9),between(1.4,3.6));
  }
  // Layered perennials at the villa soften the masonry and screen the garden floor.
  for(const [ax,az,bx,bz,count] of [[3.7,-32,3.7,-17.1,15],[3.8,-11.0,3.9,-2.6,13],[3.8,-2.7,7.5,-2.8,8],[11.7,-2.5,20.1,-3.4,14],[6.6,-18.6,17.6,-19.1,18],[17.8,-17.5,20.1,-6.7,16]]){
    for(let k=0;k<count;k++){
      const t=k/(count-1),xx=ax+(bx-ax)*t+between(-.5,.48),zz=az+(bz-az)*t+between(-.32,.34);
      shrub(xx,zz,between(1.2,2.4),between(1.15,2.7));
    }
  }
  function bench(x,z,angle) {
    const board=(xx,y,zz,w,h,d,col)=>box(x+xx*Math.cos(angle)+zz*Math.sin(angle),y,z-xx*Math.sin(angle)+zz*Math.cos(angle),w,h,d,plain,col,angle);
    for(let i=0;i<4;i++)board(0,.55,-.23+i*.15,2.15,.085,.12,0x8d6547);
    for(let i=0;i<3;i++)board(0,.79+i*.18,-.27,2.15,.125,.08,0x997153);
    for(const xx of [-.76,.76]){
      for(const zz of [-.21,.21])board(xx,.25,zz,.09,.50,.09,0x414a3f);
      board(xx,.74,-.27,.075,1.02,.085,0x42483d);
      board(xx,.43,0,.13,.13,.62,0x414a3f);
    }
  }
  for(const z of [-62,-34,-8,17,58])bench(-12,z,PI/2);
  for(const z of [-40,-22,0,13,39])bench(24.5,z,PI/2);
  function lamp(x,z){
    const c=0x3b443b;
    cyl(x,.19,z,.25,.38,plain,c,.9);
    cyl(x,.57,z,.145,.46,plain,c,.80);
    cyl(x,1.75,z,.095,2.5,plain,c,.66);
    cyl(x,2.99,z,.17,.15,plain,c);
    cyl(x,3.17,z,.19,.28,plain,c,1.05,4);
    cyl(x,3.48,z,.21,.55,plain,0xffe2a2,1.46,4);
    for(let i=0;i<4;i++){
      const a=i*PI/2;
      limb(vec(x+Math.sin(a)*.212,3.2,z+Math.cos(a)*.212),vec(x+Math.sin(a)*.313,3.75,z+Math.cos(a)*.313),.022,.022,plain,c);
    }
    cyl(x,3.85,z,.43,.23,plain,c,.23,4);
    cyl(x,4.02,z,.053,.20,plain,c,.22);
  }
  for(const z of [-78,-55,-31,-7,16,39,64])lamp(-.9,z);
  for(const z of [-65,-37,-11,17,43])lamp(25.0,z);
  function fenceSegment(x,z1,z2){
    for(const y of [.67,1.25])box(x,y,(z1+z2)/2,.068,.064,z2-z1,plain,0x44483e);
    for(let z=z1;z<=z2;z+=.43){
      box(x,.93,z,.047,1.35,.047,plain,0x40463b);
      cyl(x,1.65,z,.068,.14,plain,0x44483e,.03,4);
    }
    for(let z=z1;z<=z2;z+=4){
      box(x,.83,z,.38,1.66,.38,masonry,0xd9d1bd);
      box(x,1.69,z,.50,.115,.50,plain,0xb4ac97);
    }
  }
  // Stone garden enclosure with open entries from the avenue and the seaward path.
  const ivy = leafMaterials[3];
  function gardenWall(x1,z1,x2,z2) {
    const dx=x2-x1,dz=z2-z1,len=Math.hypot(dx,dz),angle=Math.atan2(dx,dz);
    const x=(x1+x2)/2,z=(z1+z2)/2;
    box(x,.59,z,.49,1.17,len,masonry,0xe4d8bc,angle,2.6);
    box(x,1.20,z,.62,.15,len+.07,masonry,0xd7caae,angle,2.8);
    const sections=Math.max(1,Math.ceil(len/3.6));
    for(let i=0;i<=sections;i++){
      const t=i/sections,px=x1+dx*t,pz=z1+dz*t;
      box(px,.79,pz,.68,1.58,.70,masonry,0xfff2dc,angle,2.8);
      box(px,1.61,pz,.80,.15,.83,masonry,0xf5e4c9,angle);
      box(px,1.71,pz,.66,.09,.68,plain,0xb4a48b,angle);
    }
    // Creeping ivy hangs over the coping in local patches and catches the side-light.
    for(let patch=0;patch<Math.ceil(len*.43);patch++){
      const t=between(.08,.92),cx=x1+dx*t,cz=z1+dz*t;
      for(let i=0;i<5;i++){
        const spread=between(-.49,.49),side=random()<.5?-1:1;
        const px=cx+dx/len*spread+dz/len*.31*side,pz=cz+dz/len*spread-dx/len*.31*side;
        plane(px,between(1.02,1.34),pz,between(.36,.85),between(.40,.82),ivy,0xbcc387,angle+PI/2+between(-.32,.32),between(-.24,.24));
      }
    }
    obstacles.push([Math.min(x1,x2)-.35,Math.max(x1,x2)+.35,Math.min(z1,z2)-.35,Math.max(z1,z2)+.35]);
  }
  gardenWall(2.72,-36,2.72,-16.7);
  gardenWall(2.72,-10.65,2.72,-1.6);
  gardenWall(2.72,-1.6,7.1,-1.6);
  gardenWall(11.4,-1.6,20.5,-1.6);
  fenceSegment(-16,-85,-48);fenceSegment(-16,-40,0);fenceSegment(-16,9,38);

  // Qingdao's coastal granite, tides and the headlands across the bay.
  const rock=new THREE.IcosahedronGeometry(1,0), rockPalette=[0x776e62,0x958678,0x7e7970,0xa69a85,0x8a8272];
  for(let i=0;i<158;i++) {
    const z=between(-112,100),x=coast(z)+between(4,13),s=between(.18,1.48);
    add(rock,plain,x,heightAt(x,z)-.1,z,s*between(.8,1.55),s*.64,s*between(.8,1.75),pick(rockPalette),random(),random()*TAU,random()*.32);
  }
  for(let i=0;i<28;i++){
    const z=between(-110,94),x=between(-79,-65);
    add(rock,earth,x,-2.1,z,between(9,27),between(5,12),between(8,23),0x9da286,0,random()*PI,0);
  }
  function headland(x,z,width,height,depth,col) {
    const g=new THREE.SphereGeometry(1,24,12);
    const a=g.attributes.position;
    for(let i=0;i<a.count;i++){
      const xx=a.getX(i),zz=a.getZ(i),yy=a.getY(i);
      const ridge=.76+.18*Math.sin(xx*6+zz*4)+.10*Math.cos(xx*13-zz*3);
      a.setY(i,yy*ridge);
    }
    g.computeVertexNormals();add(g,plain,x,-1.6,z,width,height,depth,col);
  }
  headland(88,-129,60,11,14,0x869695);
  headland(124,-145,59,8.8,20,0x92a19f);
  headland(139,102,43,5.8,18,0xa5adaa);
  const seaShape=new THREE.PlaneGeometry(455,420,150,110);seaShape.rotateX(-PI/2);
  const seaUniforms=THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{
    uTime:{value:0},uShallow:{value:new THREE.Color(0x8ca9a3)},uDeep:{value:new THREE.Color(0x778f95)}
  }]);
  const seaMat=new THREE.ShaderMaterial({
    uniforms:seaUniforms,fog:true,
    vertexShader:`
      uniform float uTime;
      varying vec3 waterPos;
      #include <fog_pars_vertex>
      void main(){
        vec3 p=position;
        vec3 wp=(modelMatrix*vec4(p,1.)).xyz;
        p.y+=.041*sin(wp.x*1.8+wp.z*.33-uTime*1.4)+.025*sin(wp.z*.8+wp.x*1.2-uTime*.9);
        waterPos=(modelMatrix*vec4(p,1.)).xyz;
        vec4 mvPosition=modelViewMatrix*vec4(p,1.);
        gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader:`
      uniform float uTime;
      uniform vec3 uShallow,uDeep;
      varying vec3 waterPos;
      #include <fog_pars_fragment>
      void main(){
        vec2 p=waterPos.xz;
        float coast=30.+sin(p.y*.046)*2.2+cos(p.y*.084)*1.1;
        float depth=p.x-coast;
        float ripple=sin(p.x*5.+p.y*.47-uTime*1.6+sin(p.y*.65+uTime*.28)*1.7);
        float chop=sin(p.x*2.1+p.y*1.4-uTime*.7);
        vec3 c=mix(uShallow,uDeep,smoothstep(5.,42.,depth));
        float falloff=1.-smoothstep(20.,170.,distance(cameraPosition,waterPos));
        c+=ripple*.027*falloff;
        c+=vec3(.19,.18,.14)*smoothstep(.82,1.,ripple)*smoothstep(.03,.85,chop)*falloff;
        float breaker=sin(depth*2.3-uTime*1.35+sin(p.y*.7)*.6);
        c=mix(c,vec3(.75,.77,.65),.65*smoothstep(.50,1.,breaker)*(1.-smoothstep(5.8,8.6,depth)));
        gl_FragColor=vec4(c,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`
  });
  const sea=new THREE.Mesh(seaShape,seaMat);sea.position.set(249,-.88,-5);world.add(sea);

  for(const [mat,b] of batches) {
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(b.n,3));
    g.setAttribute('color',new THREE.Float32BufferAttribute(b.c,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(b.uv,2));g.setIndex(b.i);g.computeBoundingSphere();
    const mesh=new THREE.Mesh(g,mat);
    mesh.receiveShadow=!mat.transparent;
    // Decal shadows on the paths capture the soft penumbra of the large crowns.
    mesh.castShadow=mat===masonry||mat===tiles||mat===stucco||mat===bark||leafMaterials.includes(mat);
    if(mat===shadowMat||mat===contact){mesh.renderOrder=1;mat.polygonOffset=true;mat.polygonOffsetFactor=-1;}
    world.add(mesh);
  }
  function canWalk(x,z) {
    if(x < -61 || x>coast(z)+4.15 || z < -103 || z > 85)return false;
    if(obstacles.some(([left,right,back,front])=>x>=left&&x<=right&&z>=back&&z<=front))return false;
    return !trunks.some(([tx,tz,r])=>(tx-x)**2+(tz-z)**2<r*r);
  }
  function update(t){seaUniforms.uTime.value=t;}
  return {heightAt,canWalk,update};
}
