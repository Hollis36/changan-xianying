// WGS84 landmark anchors. Context lines are deliberately schematic, not surveyed.
export const places=[
 {id:'bell',number:'01',name:'钟楼',lon:108.94238,lat:34.26101,color:'#c38970',source:'https://zh.wikipedia.org/wiki/西安钟楼'},
 {id:'gate',number:'03',name:'永宁门',lon:108.94235,lat:34.25314,color:'#9caf9c',source:'https://zh.wikipedia.org/wiki/永宁门'},
 {id:'pagoda',number:'02',name:'大雁塔',lon:108.9593361,lat:34.2197694,color:'#bdab7e',source:'https://zh.wikipedia.org/wiki/大雁塔'}
];
export const referenceLatitude=34.25,pixelsPerKm=175;
export const kmPerDegreeLat=111.195,kmPerDegreeLon=111.195*Math.cos(referenceLatitude*Math.PI/180);
export function project(lon,lat){return [890+(lon-places[0].lon)*kmPerDegreeLon*pixelsPerKm,390+(34.284-lat)*kmPerDegreeLat*pixelsPerKm];}
export function distanceKm(a,b){const rad=Math.PI/180,dlat=(b.lat-a.lat)*rad,dlon=(b.lon-a.lon)*rad;
 const h=Math.sin(dlat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dlon/2)**2;
 return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));}
export const gates=[
 {name:'安远门 · 北门',lon:108.94259,lat:34.27778},
 {name:'安定门 · 西门',lon:108.92041,lat:34.26097},
 {name:'长乐门 · 东门',lon:108.96647,lat:34.26085}
];
export const mapScope='建筑锚点按 WGS84 经纬度定位；城墙以四门方位作概括，道路与中轴线为示意。点云肖像不按占地比例绘制。本图表现明清古城与现今城南的关系，不是唐长安城复原图或导航图。';
