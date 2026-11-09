from pathlib import Path
import json, shutil, subprocess, math, textwrap, os
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A3,A4
from reportlab.lib.utils import ImageReader
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'output/boards'; TMP=OUT/'work'; SH=Path(__file__).resolve().parent/'inputs'
for directory in [TMP,OUT/'02_报名与说明',OUT/'04_创作依据与核验']:
 directory.mkdir(parents=True,exist_ok=True)

pdfmetrics.registerFont(TTFont('Song',os.environ.get('CHANGAN_SONG_FONT','/System/Library/Fonts/Supplemental/Songti.ttc')))
pdfmetrics.registerFont(TTFont('Hei',os.environ.get('CHANGAN_HEI_FONT','/System/Library/Fonts/Supplemental/Arial Unicode.ttf')))
BG='#faf9f6'; INK='#292d29'; OCHRE='#805944'; MUTED='#686b62'; LINE='#dddcd5'
def txt(c,s,x,y,size=12,font='Hei',color=INK):
 c.setFillColor(HexColor(color)); c.setFont(font,size); c.drawString(x,y,s)
def wrap(s,width,size,font='Hei'):
 lines=[];line=''
 for ch in s:
  if ch=='\n' or pdfmetrics.stringWidth(line+ch,font,size)>width:
   lines.append(line);line='' if ch=='\n' else ch
  else:line+=ch
 if line:lines.append(line)
 return lines
def para(c,s,x,y,width,size=12,lead=21,color=INK,font='Hei'):
 for line in wrap(s,width,size,font):txt(c,line,x,y,size,font,color);y-=lead
 return y

def imgfit(c,path,x,y,w,h):
 im=Image.open(path); iw,ih=im.size; scale=min(w/iw,h/ih);dw,dh=iw*scale,ih*scale
 c.drawImage(str(path),x+(w-dw)/2,y+(h-dh)/2,dw,dh,mask='auto')
def rule(c,x,y,w):c.setStrokeColor(HexColor(LINE));c.setLineWidth(.5);c.line(x,y,x+w,y)
def base(c,w,h,n,subtitle):
 c.setFillColor(HexColor(BG));c.rect(0,0,w,h,fill=1,stroke=0)
 txt(c,'西安 · 古建',48,h-57,12,'Song');txt(c,subtitle,48,h-82,9,color=MUTED)
 txt(c,f'{n:02d} / 04',w-95,h-59,9,color=MUTED);rule(c,45,h-105,w-90)
 txt(c,'程序化艺术重构，非实测模型。',48,32,9,color=MUTED)

POEMS=[('钟楼',['层檐叠影立城中，','四面长街接晚风。','一杵清音穿巷陌，','余声渐远入秋空。']),('大雁塔',['砖檐叠起接清秋，','雁影无声过塔头。','万里经书归此地，','慈恩月色满层楼。']),('永宁门',['城门向晚接归程，','雉堞临风暮色平。','旧日烽烟随雁远，','今宵灯火照人行。'])]

# Short, descriptive copy; screenshots retain the actual interface wording.
boards=[
 {'title':'长安显影','lead':'钟楼、大雁塔、永宁门。\n沿着轮廓，看建筑如何组成。'},
 {'title':'从屋檐，到台基','lead':'屋面覆在楼身上，柱梁在檐下相接，\n券洞从台基中穿过。'},
 {'title':'看见秩序','lead':'柱列重复，塔身收分。\n走过城门，视野随之改变。'},
 {'title':'三座建筑，在城中的位置','lead':'从钟楼向南，是永宁门。\n大雁塔在更南处，偏向东侧。'}
]
(OUT/'04_创作依据与核验/视觉设计理念.md').write_text('''# 秩序留白

建筑先出现，文字随后说明所见。三首原创题诗引入建筑意象，构件与关系说明保持准确、简短。版面以准确的边界和间距承接建筑的轮廓。

珠光白（#faf9f6）为背景，墨绿与赭石延续建筑的材料感。色彩服务于辨识，细线只划分阅读次序。每条线与每块留白都经过校准，不新增装饰。

宋体标题与清晰的说明文字拉开层级。短句按语义换行，避免在一句话中堆叠对象；字号、行距与图像比例共同控制阅读速度。

构件用并列的短句描述，空间关系用具体动作说明。操作提示独立排在次要层级，模型限制留在对应页，不挤入主标题。

所有主体画面仍来自现有作品。通过反复核对字距、基线、边距与上下文，使排版更安静，也让图像承担更多表达。
''',encoding='utf-8')
pdf=OUT/'02_报名与说明/长安显影-四张展板预览.pdf';c=canvas.Canvas(str(pdf),pagesize=A3);c.setTitle('长安显影 | 珠光白题诗展板');c.setAuthor('');w,h=A3
# Overview: a single lead, then three small entry points.
base(c,w,h,1,'点云交互展览 / 总览')
txt(c,boards[0]['title'],48,h-194,52,'Song');para(c,boards[0]['lead'],50,h-239,w-100,15,26,color=MUTED)
imgfit(c,SH/'triptych.png',30,320,w-60,565)
rule(c,48,265,w-96)
for i,(title,poem) in enumerate(POEMS):
 x=48+i*254;txt(c,title,x,232,23,'Song')
 for j,line in enumerate(poem):txt(c,line,x,193-j*26,15,'Song',MUTED)
txt(c,'三景题诗 / AI 辅助原创',48,66,9,color=MUTED)
c.showPage()
# Anatomy: explanatory layer separated from the three object descriptions.
base(c,w,h,2,'构件 / 钟楼')
txt(c,boards[1]['title'],48,h-185,42,'Song');para(c,boards[1]['lead'],50,h-226,w-100,15,25,color=MUTED)
imgfit(c,SH/'02-anatomy.png',30,460,w-60,410)
for i,(title,body) in enumerate([('屋面与宝顶','三重屋檐，逐层展开。'),('木构与栏杆','立柱之间，横梁相接。'),('台基与券洞','楼身立在台基上，通道从下方穿过。')]):
 y=418-i*94;rule(c,48,y+27,w-96);txt(c,f'0{i+1}',48,y,10,color=OCHRE);txt(c,title,88,y,23,'Song');txt(c,body,88,y-31,13,color=MUTED)
txt(c,'操作  /  点选一组构件，可单独观看或合拢。',48,112,10,color=MUTED)
txt(c,'分层用于讲解，不表示历史施工顺序。',48,86,10,color=MUTED);c.showPage()
# Order: direct naming; formula details remain in the work.
base(c,w,h,3,'秩序 / 三种空间关系')
txt(c,boards[2]['title'],48,h-185,42,'Song');para(c,boards[2]['lead'],50,h-226,w-100,15,25,color=MUTED)
for i,(shot,title,cap) in enumerate([('04-order-bell.png','钟楼 · 重复','柱列依次排开，横梁连接其间。'),('06-pagoda.png','大雁塔 · 收分','砖檐划出层次，塔身逐层收窄。'),('08-gate-in.png','永宁门 · 开合','进入门洞，视线向前收束。')]):
 y=626-i*226;imgfit(c,SH/shot,42,y,475,220);txt(c,title,548,y+141,22,'Song');para(c,cap,548,y+105,240,12,22,color=MUTED)
txt(c,'操作  /  切换图层或移动滑块；公式与来源点击展开。',48,102,10,color=MUTED)
txt(c,'关系取自艺术模型，不作为实测或审美评价。',48,77,10,color=MUTED);c.showPage()
# Map: two-line title and a complete map, without a second menu or slogan.
base(c,w,h,4,'地理 / 中轴与三景')
txt(c,'三座建筑，',48,h-181,41,'Song');txt(c,'在城中的位置',48,h-232,41,'Song')
imgfit(c,SH/'10-map-full.png',48,282,w-96,650)
para(c,boards[3]['lead'],48,230,w-96,19,31,font='Song')
para(c,'建筑位置采用公开坐标。道路、城墙与轴线为示意，\n不是唐长安城复原图或导航图。',48,128,w-96,10,19,color=MUTED);c.showPage();c.save()
subprocess.run(['pdftoppm','-r','300','-png',str(pdf),str(TMP/'board')],check=True)
for i in range(1,5):
 im=Image.open(TMP/f'board-{i}.png').convert('RGB');im.save(OUT/f'02_报名与说明/长安显影-A3展板{i:02d}.jpg',quality=93,dpi=(300,300),subsampling=0)


print(OUT)
