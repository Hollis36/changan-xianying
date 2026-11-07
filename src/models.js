// Procedural architectural interpretations, not survey reconstructions.
import { architecturalDetails } from './details.js';
export const landmarks = [
  {id:'bell',name:'钟楼',en:'THE BELL TOWER',era:'明 · 洪武十七年',year:'1384',type:'重檐三滴水 · 四角攒尖',description:'四条长街，在此交汇。\n钟楼立在中央。',height:'36 m',coords:'34.2600° N / 108.9422° E',tag:'城市的时间原点'},
  {id:'pagoda',name:'大雁塔',en:'GIANT WILD GOOSE PAGODA',era:'唐 · 永徽三年始建',year:'652',type:'七层方形 · 楼阁式砖塔',description:'七层砖檐，层层叠起。\n塔身向上逐渐收窄。',height:'约 64 m',coords:'大慈恩寺 · 西安',tag:'通向盛唐的垂直诗篇'},
  {id:'gate',name:'永宁门',en:'YONGNING GATE',era:'西安城墙 · 南门',year:'长安',type:'城台与城楼 · 重檐意象',description:'城楼立在城墙上。\n门洞从城台下穿过。',height:'城楼意象',coords:'南城墙 · 西安',tag:'一座城的迎宾之门'}
];

function random(seed) {
  return () => {seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15,1 | seed); t ^= t + Math.imul(t ^ t >>> 7,61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296;};
}
const palette = {stone:[.52,.57,.55],brick:[.64,.52,.38],jade:[.40,.65,.59],red:[.75,.29,.20],gold:[.82,.69,.43],wood:[.57,.37,.24],light:[.67,.72,.67]};

export function generateModel(id, density = 1, seed = 1384, materialPalette = palette) {
  if (!landmarks.some(m=>m.id === id)) throw new Error(`Unknown landmark: ${id}`);
  density = Math.max(.15,Math.min(1.6,Number(density)||1));
  const rand = random(seed), positions=[],colors=[],partIds=[];
  let partId=2;
  const step = .17 / Math.sqrt(density);
  const put=(x,y,z,mat='stone',boost=1)=>{
    partIds.push(partId);
    const c=materialPalette[mat]??palette[mat], light=(.63+rand()*.5)*boost;
    positions.push(x+(rand()-.5)*.027,y+(rand()-.5)*.027,z+(rand()-.5)*.027);
    colors.push(...c.map(v=>Math.min(1,v*light)));
  };
  function surface(fn,uCount,vCount,mat,filter) {
    const nu=Math.max(2,Math.round(uCount/step)), nv=Math.max(2,Math.round(vCount/step));
    for(let i=0;i<=nu;i++) for(let j=0;j<=nv;j++) {
      const p=fn(i/nu,j/nv);
      if(!filter || filter(...p)) put(...p,mat);
    }
  }
  function box(x,y,z,w,h,d,mat='stone',filter,top=true) {
    surface((u,v)=>[x-w/2+u*w,y+v*h,z+d/2],w,h,mat,filter);
    surface((u,v)=>[x+w/2-u*w,y+v*h,z-d/2],w,h,mat,filter);
    surface((u,v)=>[x-w/2,y+v*h,z-d/2+u*d],d,h,mat,filter);
    surface((u,v)=>[x+w/2,y+v*h,z+d/2-u*d],d,h,mat,filter);
    if(top)surface((u,v)=>[x-w/2+u*w,y+h,z-d/2+v*d],w,d,mat,filter);
  }
  function line(a,b,mat='light',thickness=1) {
    const length=Math.hypot(...a.map((v,i)=>b[i]-v));
    for(let t=0;t<=1;t+=step*.65/Math.max(.01,length)) {
      for(let k=0;k<thickness;k++) put(...a.map((v,i)=>v+(b[i]-v)*t+(rand()-.5)*.045),mat,1.12);
    }
  }
  function pillar(x,z,y,h,r=.19,mat='red') {
    surface((u,v)=>[x+r*Math.cos(u*Math.PI*2),y+v*h,z+r*Math.sin(u*Math.PI*2)],r*6.28,h,mat);
    box(x,y-.12,z,r*3,.2,r*3,'stone');
    box(x,y+h-.1,z,r*3.4,.28,r*3.4,'gold');
  }
  const detail=architecturalDetails({put,line,box,step});
  function roof(y,outerX,outerZ,innerX,innerZ,rise) {
    const previousPart=partId;partId=0;
    for(let side=0;side<4;side++) {
      const even=side%2===0, ow=even?outerX:outerZ, od=even?outerZ:outerX;
      const iw=even?innerX:innerZ, idepth=even?innerZ:innerX;
      const fn=(u,t)=>{
        const a=u*2-1, width=ow+(iw-ow)*t, depth=od+(idepth-od)*t;
        const height=y+rise*Math.pow(t,1.65)+.95*Math.pow(Math.abs(a),7)*Math.pow(1-t,3);
        const tile=.085*Math.cos(u*Math.round(ow*8)*Math.PI*2);
        const px=a*width, pz=depth;
        return side===0?[px,height+tile,pz]:side===1?[pz,height+tile,-px]:side===2?[-px,height+tile,-pz]:[-pz,height+tile,px];
      };
      surface(fn,ow*2,Math.hypot(ow-iw,rise),'jade');
      for(let k=0;k<=Math.round(ow*8);k++) {
        const u=k/Math.round(ow*8);
        for(let t=0;t<=1;t+=step*.9/Math.max(rise,ow-iw)) put(...fn(u,t),'light',.9);
        // Circular tile ends and individual rafter tips along every eave.
        const p=fn(u,0);
        for(let a=0;a<Math.PI*2;a+=.35){
          const du=Math.cos(a)*.075,dy=Math.sin(a)*.075-.10;
          put(p[0]+(even?du:0),p[1]+dy,p[2]+(even?0:du),'gold',.85);
        }
        if(k%3===0){const q=fn(u,.16);line([p[0],p[1]-.25,p[2]],[q[0],q[1]-.25,q[2]],'red',2);}
      }
      for(let u=0;u<=1;u+=step/(ow*2)) {
        const p=fn(u,0); put(...p,'gold',1.15); put(p[0],p[1]-.16,p[2],'red');
      }
      for(let t=0;t<=1;t+=.009) {
        const p=fn(0,t);put(p[0],p[1]+.12,p[2],'gold',1.25);
      }
      // Raised ridge caps and small stylised ridge ornaments.
      for(let t=.13;t<.52;t+=.12){const p=fn(0,t);box(p[0],p[1]+.12,p[2],.17,.25,.17,'gold');}
      const corner=fn(0,0);detail.eaveBell(corner[0],corner[1]-.2,corner[2]);
    }
    partId=previousPart;
  }
  function rails(y,halfX,halfZ) {
    for(let s=0;s<4;s++) {
      const horizontal=s%2===0, length=horizontal?halfX:halfZ, depth=horizontal?halfZ:halfX;
      const point=(u,h)=>horizontal?[u,y+h,(s===0?1:-1)*depth]:[(s===1?1:-1)*depth,y+h,u];
      for(const h of [.15,.62,1.04]) line(point(-length,h),point(length,h),'red');
      for(let x=-length;x<=length;x+=.72) line(point(x,0),point(x,1.1),'gold');
      for(let x=-length;x<length-.5;x+=.72){line(point(x,.25),point(x+.65,.59),'red');line(point(x,.59),point(x+.65,.25),'red');}
    }
  }
  function hall(y,w,d,h,columns=5) {
    const hx=w/2,hz=d/2;
    // Framed openings replace the opaque inner box; all four elevations are detailed.
    for(let s=0;s<4;s++){
      const width=(s%2?d:w)*.7,depth=(s%2?w:d)*.351;
      const bays=columns-1,bay=width/bays;
      for(let b=0;b<bays;b++)detail.lattice(s,depth,-width/2+bay*(b+.5),y+.3,bay*.88,h-.8);
    }
    for(let i=0;i<columns;i++) {
      const x=-hx+i*w/(columns-1);
      for(const z of [-hz,hz]) {
        pillar(x,z,y,h,.21);
        detail.bracket(x,z,y+h-.85,.85);
      }
    }
    for(let j=1;j<columns-1;j++) for(const x of [-hx,hx]){const z=-hz+j*d/(columns-1);pillar(x,z,y,h);detail.bracket(x,z,y+h-.85,.85);}
    for(const z of [-hz,hz]) box(0,y+h-.36,z,w,.26,.35,'gold');
    for(const x of [-hx,hx]) box(x,y+h-.36,0,.35,.26,d,'gold');
    // Alternating painted lozenges on the beam fascia.
    for(let s=0;s<4;s++){const width=s%2?d:w,depth=(s%2?w:d)/2+.18;
      for(let u=-width/2+.4;u<width/2-.3;u+=.8){const p=(a,b)=>detail.face(s,u+a,y+h-.23+b,depth);
        line(p(-.28,0),p(0,.12),'jade');line(p(0,.12),p(.28,0),'gold');line(p(.28,0),p(0,-.12),'jade');line(p(0,-.12),p(-.28,0),'gold');}}
  }
  function passage(x,y,r=2.25,spring=3.3) {
    return Math.abs(x)<r && (y<spring || (x*x+(y-spring)**2<r*r));
  }
  function arch(z,baseY=0,r=2.25,spring=3.3) {
    for(let shell=0;shell<4;shell++) {
      const rr=r+shell*.14;
      for(let a=0;a<=Math.PI;a+=.012) put(Math.cos(a)*rr,baseY+spring+Math.sin(a)*rr,z,'light');
      for(const x of [-rr,rr]) line([x,baseY,z],[x,baseY+spring,z],'light');
    }
  }
  if(id==='bell') {
    box(0,-.5,0,25,.5,25);
    detail.masonry(0,24,24,6.6,{opening:(u,y)=>passage(u,y)});
    for(let s=0;s<4;s++)detail.archFrame(s,12.03,0,2.25,3.3);
    // Cross-vault surfaces are genuinely open, not painted onto a solid block.
    for(const z of [-12.05,12.05]) arch(z);
    for(let z=-11.8;z<=11.8;z+=step*1.5) for(let a=0;a<=Math.PI;a+=.025) {
      const x=Math.cos(a)*2.25, yy=3.3+Math.sin(a)*2.25;
      if(Math.abs(z)>2.25) put(x,yy,z,'stone',.7);
    }
    box(0,6.6,0,24.5,.34,24.5,'light'); partId=1; rails(6.94,11.7,11.7);
    hall(7,16.3,16.3,5.65,5);
    roof(12.7,11.25,11.25,6.6,6.6,3.65);
    box(0,16.5,0,16.2,.25,16.2,'red'); rails(16.75,7.7,7.7);
    hall(16.7,12.5,12.5,4.2,5);
    roof(21.0,9.3,9.3,4.9,4.9,3.1);
    hall(24.05,8.8,8.8,1.25,4);
    roof(25.3,7.9,7.9,.22,.22,5.0);
    partId=0;
    pillar(0,0,30.3,1.65,.18,'gold');
    for(let y=30.3;y<31.5;y+=.15) surface((u,v)=>[Math.cos(u*6.28)*(.35-(y-30.3)*.15),y+v*.04,Math.sin(u*6.28)*(.35-(y-30.3)*.15)],2.2,.1,'gold');
    // Red plaque above the south doorway.
    partId=1;
    box(0,10.2,8.27,2.3,.95,.08,'red');
  } else if(id==='pagoda') {
    box(0,-.65,0,17,.65,17,'stone');box(0,0,0,15,.65,15,'light');
    let y=.65;
    for(let level=0;level<7;level++) {
      const half=6.4-level*.56, h=level===0?5.6:4.05;
      detail.masonry(y,half*2,half*2,h,{mat:'brick',opening:(u,v)=>passage(u,v,.68,1.4),taper:.15,brick:.72,row:.24});
      for(let s=0;s<4;s++)detail.archFrame(s,half-.05,y,.68,1.4,'brick');
      for(let s=0;s<4;s++) for(let p=-half+.6;p<half-.3;p+=1.25) {
        if(Math.abs(p)<.85) continue;
        if(s%2===0) box(p,y,(s===0?1:-1)*(half-.03),.18,h,.17,'brick');
        else box((s===1?1:-1)*(half-.03),y,p,.17,h,.18,'brick');
      }
      for(let k=0;k<4;k++) box(0,y+h+k*.12,0,half*2+.1+k*.12,.10,half*2+.1+k*.12,'brick',undefined,false);
      for(let s=0;s<4;s++)for(let u=-half+.25;u<half;u+=.42){const p=detail.face(s,u,y+h-.16,half);box(p[0],p[1],p[2],.16,.22,.16,'brick');}
      y+=h+.52;
    }
    // Brick pagoda cap: a shallow masonry crown, without a timber pavilion roof.
    for(let k=0;k<7;k++)box(0,y+k*.1,0,5.8-k*.65,.1,5.8-k*.65,'brick',undefined,false);
    pillar(0,0,y+.7,.8,.12,'brick');
  } else {
    box(0,-.5,0,47,.5,16,'stone');
    detail.masonry(0,44,13,7,{opening:(u,y,s)=>(s===0||s===2)&&passage(u,y,2.6,3),brick:1.15,row:.34});
    for(const z of [-6.55,6.55]) arch(z,0,2.6,3);
    for(const s of [0,2])detail.archFrame(s,6.58,0,2.6,3);
    for(let z=-6.4;z<=6.4;z+=step)for(let a=0;a<=Math.PI;a+=.04)put(Math.cos(a)*2.6,3+Math.sin(a)*2.6,z,'stone',.7);
    box(0,7,0,44.4,.35,13.4,'light');
    for(let x=-21;x<=21;x+=1.8) for(const z of [-6.4,6.4]){box(x,7.35,z,1.1,1.15,.55,'stone');box(x,8.5,z,1.22,.12,.68,'light');}
    hall(7.6,23,9.2,4.7,9);
    roof(12.5,13.8,7.5,9.1,3.3,4.05);
    hall(16.45,18,6,3.9,7);
    roof(20.5,11.8,6.8,6.1,.17,5.2);
    line([-6.4,25.85,0],[6.4,25.85,0],'gold',3);
    for(const x of [-6.3,6.3]) pillar(x,0,25.7,1.3,.17,'gold');
    rails(7.4,13,5.8);
  }
  // Deterministic shuffle permits unbiased density reduction using drawRange.
  for(let i=positions.length/3-1;i>0;i--) {
    const j=Math.floor(rand()*(i+1));
    [partIds[i],partIds[j]]=[partIds[j],partIds[i]];
    for(let k=0;k<3;k++) {
      [positions[i*3+k],positions[j*3+k]]=[positions[j*3+k],positions[i*3+k]];
      [colors[i*3+k],colors[j*3+k]]=[colors[j*3+k],colors[i*3+k]];
    }
  }
  return {positions:new Float32Array(positions),colors:new Float32Array(colors),partIds:new Uint8Array(partIds)};
}
