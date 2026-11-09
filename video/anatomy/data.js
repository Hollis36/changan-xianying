// Coordinates locate the artistic model, never survey dimensions.
export const fps=30,duration=192;
export const palette={stone:'#77766d',brick:'#8a7159',jade:'#414d45',red:'#8c483d',gold:'#956f4f',wood:'#805944',light:'#626b60'};
export const paper='#faf9f6',ink='#292d29',accent='#805944';
const item=(name,note,tag,anchor,distance,extra={})=>({name,note,tag,anchor,distance,...extra});
export const buildings=[
 {id:'bell',title:'钟楼',subtitle:'砖木相接，重檐层叠',poem:['层檐叠影立城中，','四面长街接晚风。','一杵清音穿巷陌，','余声渐远入秋空。'],overview:{target:[0,15,0],position:[38.08,30.68,63.84]},items:[
 item('砖砌台基',['方形高台，托起上方楼阁。'],1,[6,3.2,12],27),
 item('券洞',['拱券围出门洞。','台基内部的通道十字相交。'],2,[0,5.55,12.05],18),
 item('红漆檐柱',['檐下木柱沿廊排列，','承托上部木构。'],3,[8.15,9.8,8.15],12),
 item('额枋',['横向联系柱头的木构件。'],5,[2,11.68,8.15],13),
 item('斗拱',['斗与拱层叠出挑，','位于柱头与檐部之间。'],4,[8.15,12.15,8.15],5.6,{radius:1.6}),
 item('平座栏杆',['二层外挑平台的围护，','沿楼身四周展开。'],6,[4,17.35,7.7],15),
 item('三重檐 · 四角攒尖顶',['三道屋檐逐层收起，','四面屋坡汇向顶部。'],7,[0,27,5.6],52,{target:[0,20,0]}),
 item('宝顶',['攒尖屋顶上方的顶饰，','收束整座建筑的轮廓。'],8,[0,31.1,0],9)
 ]},
 {id:'pagoda',title:'大雁塔',subtitle:'以砖仿木，七层收分',poem:['砖檐叠起接清秋，','雁影无声过塔头。','万里经书归此地，','慈恩月色满层楼。'],overview:{target:[0,17,0],position:[33.92,26.54,61.48]},items:[
 item('塔基',['塔身下方的基座，','形成建筑落地的边界。'],1,[5,.5,7.5],24),
 item('砖砌塔身',['砖墙围成方形塔体，','砖缝呈现砌筑层次。'],9,[3,3.4,6.3],13),
 item('券门',['塔身每层四面中央开券门，','洞口上部呈拱形。'],2,[0,9.3,5.8],12),
 item('砖砌隐柱',['墙面凸出的竖向砖构件，','模拟木柱划分立面。'],10,[3.8,8.6,5.8],10),
 item('仿木阑额',['横向砖带联系隐柱上端，','以砖表现木构的形制。'],11,[2.7,10.6,5.8],9),
 item('叠涩出檐',['砖层逐层向外挑出，','形成塔层之间的檐口。'],12,[3,11.05,6],10),
 item('塔身收分',['由下而上逐层收窄，','形成向上内收的轮廓。'],9,[4.5,19,4.5],59,{target:[0,17,0],contour:true}),
 item('塔顶',['砖砌顶部逐级收拢，','结束七层塔身。'],13,[0,34.6,0],12)
 ]},
 {id:'gate',title:'永宁门',subtitle:'城台承楼，券洞通行',poem:['城门向晚接归程，','雉堞临风暮色平。','旧日烽烟随雁远，','今宵灯火照人行。'],overview:{target:[0,12,0],position:[38,28,70]},items:[
 item('城台',['承托城楼的高台，','与两侧城墙连成整体。'],1,[9,3.2,6.5],28),
 item('拱券门洞',['砖砌拱券围成通道，','从城台下方穿过。'],2,[0,5.6,6.55],20),
 item('垛墙与垛口',['凸起的墙段为垛墙，','相邻墙段间留出垛口。'],14,[16.8,8.1,6.4],14,{second:{name:'垛口',anchor:[17.7,8.1,6.4]}}),
 item('红漆檐柱',['沿外檐排列的木柱，','组成城楼的柱列。'],3,[8.625,9.8,4.6],12),
 item('额枋',['横向木构联系柱头，','与柱列共同形成框架。'],5,[7,11.32,4.6],12),
 item('斗拱',['柱头上方的叠置木构，','向外承托檐部。'],4,[8.625,11.9,4.6],5.6,{radius:1.6}),
 item('重檐屋面',['模型以两重檐，','概括城楼的屋面层次。'],7,[5,21.5,6],48,{target:[0,19,0]}),
 item('正脊',['屋顶最高处的水平脊线，','连接两端脊饰。'],15,[3,25.85,0],22)
 ]}
];
export const smooth=v=>{const x=Math.max(0,Math.min(1,v));return x*x*(3-2*x);};
// Cut frames follow measured orchestral attacks, rounded to the nearest 30 fps frame.
export const cutFrames=[0, 242, 424, 588, 827, 1009, 1173, 1366, 1532, 1758, 1997, 2179, 2343, 2582, 2764, 2928, 3121, 3287, 3513, 3706, 3872, 4098, 4337, 4519, 4683, 4876, 5042, 5268, 5461, 5627, 5760];
export const shots=cutFrames.slice(0,-1).map((startFrame,n)=>({startFrame,endFrame:cutFrames[n+1],index:Math.floor(n/10),kind:n%10===0?'intro':n%10===9?'outro':'detail',itemIndex:n%10-1}));
export const chapterStarts=[cutFrames[0]/fps,cutFrames[10]/fps,cutFrames[20]/fps,duration];
export function shotAt(t){
 const frame=Math.max(0,Math.min(duration*fps-1,Math.floor(t*fps+1e-6)));
 const shot=shots.find(s=>frame>=s.startFrame&&frame<s.endFrame),building=buildings[shot.index];
 return {...shot,building,item:shot.kind==='detail'?building.items[shot.itemIndex]:undefined,local:Math.max(0,t-shot.startFrame/fps),shotDuration:(shot.endFrame-shot.startFrame)/fps};
}
