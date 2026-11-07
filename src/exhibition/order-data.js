// Coordinates describe src/models.js's artistic geometry, never measured heritage data.
export const bellColumns=[-8.15,-4.075,0,4.075,8.15];
export const pagodaLayers=Array.from({length:7},(_,i)=>({
 index:i+1,width:12.8-i*1.12,y:i===0?.65:6.77+(i-1)*4.57,height:i===0?5.6:4.05
}));
export const gateWalls=[[-22,-2.6,-6.5,6.5],[2.6,22,-6.5,6.5]];

export function rayWallDistance(origin,direction,range){
 let nearest=range;
 for(const wall of gateWalls){
  let near=0,far=range;
  for(let axis=0;axis<2;axis++){
   const min=wall[axis*2],max=wall[axis*2+1],o=origin[axis],d=direction[axis];
   if(Math.abs(d)<1e-9){if(o<min||o>max){far=-1;break;}continue;}
   const a=(min-o)/d,b=(max-o)/d;
   near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));
  }
  if(far>=near&&far>=0)nearest=Math.min(nearest,near);
 }
 return nearest;
}

export function gateView(progress){
 const t=Number.isFinite(progress)?Math.max(0,Math.min(1,progress)):0;
 const origin=[0,20-40*t],boundary=[];
 const range=24,halfAngle=Math.PI*40/180;
 for(let i=0;i<=100;i++){
  const angle=-halfAngle+2*halfAngle*i/100,direction=[Math.sin(angle),-Math.cos(angle)];
  const distance=rayWallDistance(origin,direction,range);
  boundary.push([origin[0]+direction[0]*distance,origin[1]+direction[1]*distance]);
 }
 const polygon=[origin,...boundary];let twiceArea=0;
 for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length];twiceArea+=a[0]*b[1]-b[0]*a[1];}
 return {origin,boundary,area:Math.abs(twiceArea)/2,range,halfAngle};
}

export const orderTopics={
 bell:{name:'钟楼',title:'重复与连接',lead:'柱列依次排开。\n横梁把间隔连成整体。',steps:['柱间重复','梁柱连接'],
  pose:{target:[0,14,0],position:[26,24,64]},
  captions:['沿一列立柱，辨认重复的间隔。','把相邻柱头连接起来，看一间如何接着一间。'],
  formula:'xᵢ = x₀ + i · b',definition:'xᵢ 是第 i 根柱的位置，b 是这一列的间距。',
  explanation:'在当前模型中，首层正面以五根柱形成四个相等间隔。赭色竖线标出柱位，横线显示连接关系。切换图层，比较单元的重复与整体的形成。',
  scope:'这里展示当前艺术模型的首层柱列，不是钟楼实测柱网。等距关系来自生成规则，不能据此推定历史营造模数；连线也不表示完整受力路径。',
  sources:[{title:'Li Hui ·《营造法式》中材、栔、分的作用（2013）',url:'https://doi.org/10.3130/aija.78.1171',note:'提供模数与构件关系的研究背景，不是本钟楼尺寸的来源。'},{title:'Stiny 与 Mitchell · The Palladian Grammar（1978）',url:'https://doi.org/10.1068/b050005',note:'说明如何以生成规则理解形式；不能证明一种规则必然产生美。'}]},
 pagoda:{name:'大雁塔',title:'递进与收分',lead:'砖檐划出层次。\n塔身向上逐层收窄。',steps:['层层叠起','逐层收分'],
  pose:{target:[0,17,0],position:[22,23,67]},
  captions:['移动层级，比较上下相邻的轮廓。','从基部向上看，层宽逐渐缩小。'],
  formula:'qₖ = wₖ₊₁ / wₖ',definition:'wₖ 是第 k 层的宽度，qₖ 比较相邻两层的宽度。',
  explanation:'细线标出七层塔身基部的轮廓。滑动选择一层，观察它在整体中的位置。当前模型按固定宽度差收窄，因此相邻层的宽度比并不恒定。',
  scope:'层宽取自当前程序艺术模型，以第一层为 1 归一化；不表示大雁塔实测尺寸，也不证明原建筑采用等差、等比或黄金比例设计。',
  sources:[{title:'Ostwald 与 Vaughan · The Fractal Dimension of Architecture（2016）',url:'https://doi.org/10.1007/978-3-319-32426-5',note:'提供多尺度形式分析的方法背景；本演示没有计算分形维数或美感评分。'}]},
 gate:{name:'永宁门',title:'路径与开合',lead:'从门外，走进门洞。\n视野收束，再向前展开。',steps:['门外','门中','门内'],
  pose:{target:[0,7,0],position:[37,48,61]},
  captions:['面向门洞，墙体遮挡两侧的视线。','进入门洞，可见区域沿前方收束。','越过城台，前方的视野重新展开。'],
  formula:'V(p) = { q ∈ Ω : [p, q] ⊂ Ω }',definition:'Ω 是可见范围内的自由平面，p 是观察点；V(p) 收集与 p 之间没有墙体遮挡的点。',
  explanation:'移动观察点，赭色扇面随墙体遮挡改变。这里固定向前观看，视角为 80°，视距固定，只比较同一设定下的开合；它不是全方向、无限视距的视域。',
  scope:'以当前模型城台与门洞作二维平面示意，没有复原完整瓮城、真实通行路线或垂直遮挡。几何范围使用模型单位，不能作为现场导览或实测视域。',
  sources:[{title:'Benedikt · To Take Hold of Space: Isovists and Isovist Fields（1979）',url:'https://doi.org/10.1068/b060047',note:'视域分析的方法来源。可见区域的大小不直接代表空间美感。'}]}
};
