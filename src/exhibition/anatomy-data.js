// Descriptions are paraphrases. Grouping and offsets are an exhibition device, not survey data.
export const anatomyParts=[
 {id:0,name:'屋面与宝顶',short:'屋面',en:'ROOF & FINIAL',color:'#91b6a6',offset:17,
  lead:'三重屋檐，逐层收起。',
  text:'屋檐向四面伸出，顶端收于宝顶。沿着轮廓往下看，可以数出三重檐；楼身实际为两层。',
  fact:'形制：三重檐、四角攒尖顶。',
  model:'这里将屋面、脊饰、檐铃与宝顶合为一组，便于辨认轮廓；不展示完整的屋盖内部构造。',sources:['form','gazette']},
 {id:1,name:'木构与栏杆',short:'木构',en:'TIMBER & GALLERIES',color:'#c08a6f',offset:1.5,
  lead:'立柱之间，横梁相接。',
  text:'柱与梁组成楼阁骨架，门窗在其间展开。檐下可见斗拱，楼身四周的回廊与栏杆围出边界。',
  fact:'结构：梁柱通过榫卯连接；围护与承重各有分工。',
  model:'本组包含柱、梁、斗拱、门窗、楼面与栏杆。柱网、菱格和彩绘经过艺术化简化，不能用于判断实物节点或受力。',sources:['structure','form']},
 {id:2,name:'台基与券洞',short:'台基',en:'BASE & PASSAGES',color:'#a7b1aa',offset:-4,
  lead:'方形台基，托起楼阁。',
  text:'台基四面开出券洞，通道在内部十字相交。砖面围住高台，洞口上方的弧线勾出拱券。',
  fact:'构造：研究文献记载台基内为夯土，外侧砌砖。',
  model:'模型表现台基外表与券洞轮廓，没有还原夯土内部、台阶及全部通道细节。',sources:['structure','form']}
];
export const anatomySources={
 gazette:{title:'钟楼',publisher:'西安市地方志办公室',date:'2024-05-27',type:'地方志资料',
  url:'https://xadfz.xa.gov.cn/xadq/rwxa/1794984167304376322.html',
  supports:'支持始建年代、砖木结构及基座、楼体、宝顶的整体组成。',
  bibliographic:'资料出自《西安市志（1991—2010）第三卷经济（上）·旅游分志》。'},
 form:{title:'西安钟楼形制结构',publisher:'西安科普网 · 西安市科学技术馆',date:'2022-04-25',type:'建筑形制资料',
  url:'https://www.xakpw.com/single/23539',
  supports:'支持两层楼身、三重檐、回廊与平座、斗拱及十字形券洞等形制描述。',
  bibliographic:'页面注明来源为西安市政协文化文史和学习委员会《西安文化遗产辑录》，赵荣、李郁主编。'},
 structure:{title:'考虑土—结构相互作用的西安钟楼地震反应分析',publisher:'孟昭博、吴敏哲等 · 西安建筑科技大学',date:'2008-12',type:'研究论文 · PDF',
  url:'https://pubs.cstam.org.cn/data/article/wee/preview/pdf/wee_sjdzgc200804023.pdf',
  supports:'第1页引言说明台基夯土与砖砌外部、十字券洞、木柱与梁架及榫卯连接。本展仅引用构造描述。',
  bibliographic:'《世界地震工程》24卷4期，125—129页。论文中的地震分析结果不用于评价本模型。'}
};
export const anatomyOverview={target:[0,22,0],position:[67,43,88]};
