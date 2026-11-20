#!/usr/bin/env python3
"""Generate a consistent 50-general vector roster and combat sprite sheets."""
from pathlib import Path
import json, re

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "app/src/main/assets/characters/2d"
PORTRAITS = ART / "portraits"
ANIMS = ART / "animations"
SPRITES = ROOT / "game-assets/sprites"

# Existing Liu Bei, Guan Yu, Zhang Fei and Diao Chan are the visual standards.
# The other eight original male sprites are rebuilt with the same anatomy/linework system.
BASE_ROWS = """
liu|liu-bei|刘备|m|#8e302d|#392226|#d8b56a|sword|heal|crown|goatee
guan|guan-yu|关羽|m|#28644a|#112b2b|#d9bd79|guandao|dragon|winged|long
zhang|zhang-fei|张飞|m|#374852|#111b22|#bd9558|spear|roar|iron|full
zhao|zhao-yun|赵云|m|#8baebb|#293f55|#e0d8c3|spear|dragon|plume|clean
zhuge|zhuge-liang|诸葛亮|m|#879987|#2d4846|#d7c59a|fan|formation|scholar|goatee
huang|huang-zhong|黄忠|m|#b68a42|#3d5138|#e1c17c|bow|arrow|archer|white
dia|diaochan|貂蝉|f|#9b6285|#392642|#e7c6df|dual-dagger|charm|hairpin|none
cao|cao-cao|曹操|m|#515875|#252a3f|#c9aa6b|sword|shield|crown|short
zhou|zhou-yu|周瑜|m|#a94736|#4b2930|#e2c077|sword|fire|plume|clean
lvbu|lv-bu|吕布|m|#9d332f|#341e29|#e0b56b|halberd|storm|horned|long
diaowei|dian-wei|典韦|m|#816044|#342d2b|#c99a58|dual-axe|ironstorm|iron|full
jiang|jiang-wei|姜维|m|#4c8192|#253c4d|#d5d7c5|spear|tiger|silver|short
"""
# id|name|title|role|troop|skill|skill description|biography|weapon|fx|armor|cloth|accent|gender|headgear|beard
EXTRA_ROWS = """
machao|马超|锦马超|骑将|骑兵|西凉突骑|银枪连续突刺敌阵，对前排造成高额伤害并降低防御。|西凉锦衣铁骑之首，枪法迅疾，擅长正面冲锋。|spear|wind|#d9e4e8|#354d68|#c5a36a|m|plume|short
weiyan|魏延|汉中悍将|先锋|步兵|狂骨裂阵|挥动大刀横扫敌阵，对目标造成伤害并施加流血。|勇猛刚烈，守汉中多年，善于险地突击。|saber|blood|#69716a|#222c2c|#b58b55|m|iron|full
pangtong|庞统|凤雏|军师|弓兵|凤雏涅槃|引燃凤羽谋阵，对敌军造成范围伤害并持续灼烧。|外貌不羁而智计深远，善于以奇谋破局。|fan|phoenix|#b18b55|#4d3533|#e4c47b|m|scholar|goatee
fazheng|法正|孝直谋臣|谋士|弓兵|睚眦定计|识破敌方弱点，对单体造成谋略伤害并降低攻击。|善于审时度势，出奇制胜，为蜀汉谋取汉中。|scroll|thunder|#687d72|#263a37|#c1a46d|m|scholar|short
xushu|徐庶|单福|游侠|骑兵|剑心破阵|拔剑突进，对目标造成伤害并使其短暂迟缓。|先以剑术游侠行走江湖，后以谋略辅佐刘备。|sword|wind|#748b91|#263c49|#d0bd8a|m|headband|short
madai|马岱|西凉骁骑|游骑|骑兵|雁门追风|策马疾刺敌军后排，对目标造成伤害并追击。|沉稳果决，继承西凉骑兵的突袭战法。|spear|wind|#7d8b73|#34483a|#c2a16a|m|plume|short
guanping|关平|忠勇副将|先锋|骑兵|青锋断浪|以长刀劈开敌阵，对单体造成伤害并破甲。|忠勇沉稳，继承关氏刀法，善于护卫主将。|saber|water|#4d785b|#1e3831|#d1b36e|m|winged|short
guanxing|关兴|少将军|骑将|骑兵|青龙继志|挥刀追击两名敌人，造成伤害并降低防御。|承父之志，刀法凌厉，擅长追击溃军。|guandao|dragon|#3f7558|#203e35|#d0b36c|m|plume|short
zhangbao|张苞|虎头将军|猛将|枪兵|丈八破军|双手挺枪猛烈突刺，造成伤害并震退敌阵。|勇烈如父，惯用长枪冲锋陷阵。|spear|roar|#4b5055|#20262a|#c08f58|m|iron|full
zhangliao|张辽|威震逍遥津|先锋|骑兵|逍遥津突袭|骑枪冲锋突破敌阵，对一列敌人造成伤害。|威震江东的魏国名将，善用骑兵奇袭。|spear|storm|#53616f|#202a36|#d1b36c|m|winged|short
zhanghe|张郃|巧变名将|游骑|骑兵|长驱巧变|长枪连续变招，对随机目标造成两次伤害。|善于审势用兵，枪法多变，进退有度。|spear|wind|#6b617b|#302b42|#c9ad73|m|plume|moustache
xuhuang|徐晃|周亚夫之风|重将|步兵|断粮破阵|大斧重劈目标，造成伤害并破甲。|治军严整，擅长稳步推进和切断敌军粮道。|axe|earth|#9a8058|#3f4036|#d3b578|m|iron|short
xuchu|许褚|虎痴|护卫|步兵|虎侯震山|重锤砸地震击敌阵，对全体造成伤害并减速。|力大无穷，忠勇护主，身披厚重铁甲。|hammer|roar|#80644b|#332c27|#c29b5f|m|iron|full
xiahou-dun|夏侯惇|独眼苍狼|猛将|骑兵|拔矢啖睛|挥刀爆发反击，对单体造成重击并流血。|独眼名将，作战悍勇，身披深蓝重甲。|saber|blood|#3f566c|#202c3c|#c09b63|m|iron|short
xiahou-yuan|夏侯渊|妙才|神射|弓兵|定军神速|快速连射三箭，优先打击生命最低的敌人。|以行军迅速和远程精准闻名，善于奔袭。|bow|arrow|#78866a|#344333|#d4b46e|m|plume|short
guojia|郭嘉|奉孝|军师|弓兵|遗计定局|展开谋略阵势，对敌方全体造成谋略伤害。|才思敏捷，常以预判与奇计左右战局。|fan|formation|#657b82|#263b42|#c7b987|m|scholar|goatee
xunyu|荀彧|王佐之才|军师|弓兵|王佐筹谋|为友军恢复生命并提升攻击，稳定全军阵线。|深谋远虑，擅长后勤、人才选拔和战略规划。|scroll|heal|#a7a28a|#454d40|#d8c895|m|scholar|short
simayi|司马懿|冢虎|谋士|弓兵|鹰视狼顾|释放暗影奇谋，对敌方造成伤害并施加中毒。|隐忍深沉，善于布局和把握敌军破绽。|staff|shadow|#55445f|#252336|#b9a4c4|m|hood|long
caoren|曹仁|天人将军|护卫|步兵|固若金汤|举盾护卫全军，赋予护盾并反击来犯之敌。|勇于守城，善于稳固阵地和保护友军。|shield|shield|#546b7b|#253746|#cfb273|m|iron|short
caopi|曹丕|文皇帝|统帅|骑兵|魏嗣承天|剑势凝成雷光，对目标造成伤害并降低士气。|文武兼备，善于统御军政与整合势力。|sword|thunder|#b3b7b5|#3c4953|#d6bf88|m|crown|short
yuejin|乐进|先登|先锋|步兵|先登陷阵|短兵突击敌阵，造成伤害并施加流血。|体格精悍，常率先登城破阵。|saber|flame|#a16f4d|#3e3431|#d1a76c|m|iron|short
yujin|于禁|毅重|护卫|步兵|持军有度|结成坚固防线，为全体友军添加护盾。|军纪严明，擅长训练和组织防御阵线。|shield|shield|#68777a|#2d3a40|#c5af78|m|iron|short
sunce|孙策|小霸王|猛将|骑兵|霸王冲阵|爆发霸王之势，突进后对目标造成雷霆重击。|少年英豪，勇猛果敢，善于快速扩张江东。|saber|lightning|#9f493d|#45282a|#d7b16b|m|plume|short
sunquan|孙权|江东之主|统帅|弓兵|江东号令|号令友军提升攻击并获得护盾。|善于平衡江东世族与军政，稳固江东基业。|sword|shield|#477f79|#243d3e|#d4b779|m|crown|short
luxun|陆逊|儒将之杰|军师|弓兵|火烧连营|火焰覆盖敌阵，对全体造成伤害并持续灼烧。|年轻儒将，善于火攻和诱敌深入。|fan|fire|#718c83|#344a46|#dfc17a|m|scholar|short
lvmeng|吕蒙|白衣渡江|先锋|步兵|白衣奇袭|以短刀奇袭目标，造成伤害并使其迟缓。|勤学善战，善于伪装突袭和快速夺城。|sword|shadow|#667d6f|#2c403a|#c7ac70|m|headband|short
ganning|甘宁|锦帆游侠|游骑|步兵|锦帆夜袭|双刀交错斩击两次，对敌造成伤害并流血。|锦帆贼出身，行动迅捷，善于夜袭水战。|dual-blade|thunder|#3e6376|#1d3444|#d3ae6a|m|headband|braid
taishici|太史慈|神亭酣战|先锋|弓兵|神亭破敌|弓弦连发强力箭矢，对目标造成高额伤害。|箭术精湛，忠义守信，勇于单骑赴战。|bow|arrow|#778b98|#2d4253|#d7b77c|m|plume|short
huanggai|黄盖|老将先登|护卫|步兵|苦肉诈降|引爆火攻器械，对敌方造成范围伤害并灼烧。|东吴老将，熟悉水战和火攻器械。|hammer|fire|#98714d|#49342d|#d7b46d|m|iron|white
lusu|鲁肃|榻上策|谋士|弓兵|榻上定策|布下护阵，为友军恢复能量并生成护盾。|宽厚持重，善于联盟外交与长远战略。|scroll|shield|#819280|#37453e|#d5bf88|m|scholar|short
sunshangxiang|孙尚香|弓腰姬|游骑|骑兵|枭姬连弩|连弩齐射，对随机敌人造成三段远程伤害。|英气飒爽，擅长弓弩与骑射，不让须眉。|bow|arrow|#ad4b54|#603044|#edc6a0|f|phoenix|none
daqiao|大乔|江东国色|谋士|弓兵|江东花影|花影环绕友军，恢复生命并驱散异常状态。|温婉端雅，善于安抚军心和稳定后方。|fan|charm|#d79ca8|#694a68|#efd8b7|f|flower|none
xiaoqiao|小乔|国色天香|谋士|弓兵|流火双扇|双扇舞出流火，对敌军造成范围伤害。|灵动聪慧，舞姿轻盈，以火扇扰乱敌阵。|fan|fire|#dc8a91|#743f65|#f2c6a4|f|ribbon|none
zhenji|甄宓|洛神|谋士|弓兵|洛水惊鸿|召唤洛水冰华，对敌方造成伤害并减速。|气质清雅，善于诗赋与抚慰人心。|ribbon|ice|#91b5c7|#3e5870|#e5d7ba|f|water|none
huangyueying|黄月英|机关奇才|军师|弓兵|木牛流马|召唤机关护卫，为全军生成护盾。|聪慧多才，精通机关、器械与奇门术数。|mechanism|shield|#a8b39b|#526b5e|#e0c89a|f|gear|none
wangyi|王异|烈女|游骑|骑兵|忠烈断刃|双刃迅疾突袭，对目标造成伤害并流血。|坚韧果决，善于谋划反击，守护家国。|dual-blade|blood|#8f4851|#3d2d3c|#d5a878|f|veil|none
mayunlu|马云禄|西凉女将|先锋|骑兵|银月枪舞|银枪旋舞突击，对敌阵造成伤害并击退。|西凉女将，骑术精湛，枪法凌厉。|spear|dragon|#6c8c91|#344b59|#e0c49a|f|plume|none
ganfuren|甘夫人|昭烈皇后|谋士|弓兵|母仪护佑|以仁慈之光保护友军，为全队恢复生命。|温良坚毅，辅佐刘备安定蜀汉后方。|fan|heal|#c7b59a|#6b5b4c|#f0dfbb|f|flower|none
"""

def parse_base():
    out=[]
    for line in BASE_ROWS.strip().splitlines():
        i,slug,name,gender,armor,cloth,accent,weapon,fx,head,beard=line.split("|")
        out.append(dict(id=i,slug=slug,name=name,gender=gender,armor=armor,cloth=cloth,accent=accent,weapon=weapon,fx=fx,head=head,beard=beard))
    return out

def parse_extras():
    out=[]
    for n,line in enumerate(EXTRA_ROWS.strip().splitlines(),1):
        i,name,title,role,troop,skill,desc,bio,weapon,fx,armor,cloth,accent,gender,head,beard=line.split("|")
        out.append(dict(id=i,slug=i,name=name,title=title,role=role,troop=troop,skill=skill,desc=desc,bio=bio,
                        weapon=weapon,fx=fx,armor=armor,cloth=cloth,accent=accent,gender=gender,head=head,beard=beard,
                        rarity=5 if n%4 else 4,atk=70+(n*7)%31,defense=44+(n*5)%34,hp=520+(n*31)%250,energy=4 if n%5==0 else 3,face="⚔️"))
    return out

BASE = parse_base()
EXTRAS = parse_extras()
ALL_ART = BASE + EXTRAS
KEEP_BASE = {"liu-bei","guan-yu","zhang-fei","diaochan"}

def esc(s):
    return str(s).replace("&","&amp;").replace("<","&lt;").replace(">","&gt;").replace('"',"&quot;")

def headgear(h):
    kind=h["head"]
    if kind=="crown":
        return '<path d="M342 165 L350 102 L382 135 L400 92 L420 135 L452 102 L460 165Z" fill="url(#metal)" stroke="url(#ink)" stroke-width="9"/><path d="M354 150 Q400 168 448 150" fill="none" stroke="'+h["accent"]+'" stroke-width="9"/>'
    if kind in ("winged","iron"):
        return '<path d="M328 180 Q302 126 326 92 Q354 102 369 143 L400 108 L431 143 Q446 102 474 92 Q498 126 472 180Z" fill="url(#armor)" stroke="url(#ink)" stroke-width="10"/><path d="M338 155 Q400 132 462 155 L452 185 Q400 171 348 185Z" fill="url(#metal)" stroke="url(#ink)" stroke-width="7"/>'
    if kind=="plume":
        return '<path d="M342 165 Q323 112 368 91 Q395 111 402 144 Q419 84 459 79 Q475 130 448 173Z" fill="url(#armor)" stroke="url(#ink)" stroke-width="9"/><path d="M402 142 Q429 76 455 52 Q460 108 431 151Z" fill="'+h["accent"]+'" stroke="url(#ink)" stroke-width="6"/>'
    if kind=="horned":
        return '<path d="M340 177 Q322 130 340 103 Q360 112 374 146 L400 124 L426 146 Q440 112 460 103 Q478 130 460 177Z" fill="url(#armor)" stroke="url(#ink)" stroke-width="10"/><path d="M348 126 Q300 58 322 40 Q367 69 371 122 M452 126 Q500 58 478 40 Q433 69 429 122" fill="none" stroke="url(#metal)" stroke-width="13"/>'
    if kind=="scholar":
        return '<path d="M318 177 Q326 110 400 98 Q474 110 482 177 Q400 196 318 177Z" fill="url(#cloth)" stroke="url(#ink)" stroke-width="9"/><path d="M342 149 Q400 124 458 149" fill="none" stroke="'+h["accent"]+'" stroke-width="7"/>'
    if kind=="archer":
        return '<path d="M328 168 Q318 104 400 88 Q482 104 472 168 L446 178 Q400 154 354 178Z" fill="url(#armor)" stroke="url(#ink)" stroke-width="9"/><path d="M360 111 Q400 84 440 111" fill="none" stroke="'+h["accent"]+'" stroke-width="8"/>'
    if kind=="hood":
        return '<path d="M324 190 Q306 74 400 65 Q494 74 476 190 L448 214 Q400 186 352 214Z" fill="url(#cloth)" stroke="url(#ink)" stroke-width="10"/>'
    if kind=="headband":
        return '<path d="M326 157 Q400 128 474 157 L466 190 Q400 169 334 190Z" fill="url(#cloth)" stroke="url(#ink)" stroke-width="8"/>'
    if kind=="hairpin":
        return '<path d="M336 150 Q340 78 400 86 Q460 78 464 150 L451 184 Q400 165 349 184Z" fill="url(#hair)" stroke="url(#ink)" stroke-width="8"/><path d="M450 93 Q501 58 510 104 Q475 129 451 126Z" fill="'+h["accent"]+'" stroke="url(#ink)" stroke-width="6"/><circle cx="454" cy="116" r="10" fill="#f3d8a2"/>'
    if kind=="flower":
        return '<path d="M340 160 Q347 88 400 88 Q453 88 460 160 L448 190 Q400 172 352 190Z" fill="url(#hair)" stroke="url(#ink)" stroke-width="8"/><g fill="'+h["accent"]+'" stroke="url(#ink)" stroke-width="4"><circle cx="456" cy="109" r="17"/><circle cx="476" cy="98" r="11"/><circle cx="443" cy="88" r="11"/></g>'
    if kind=="ribbon":
        return '<path d="M340 160 Q350 82 400 86 Q450 82 460 160 L449 192 Q400 172 351 192Z" fill="url(#hair)" stroke="url(#ink)" stroke-width="8"/><path d="M450 122 Q502 102 520 158 Q484 154 462 175" fill="none" stroke="'+h["accent"]+'" stroke-width="12"/>'
    if kind=="water":
        return '<path d="M340 162 Q348 80 400 88 Q452 80 460 162 L448 192 Q400 173 352 192Z" fill="url(#hair)" stroke="url(#ink)" stroke-width="8"/><path d="M458 110 Q502 79 513 128 Q480 143 458 150Z" fill="#b9dce4" stroke="url(#ink)" stroke-width="5"/>'
    if kind=="gear":
        return '<path d="M340 162 Q350 86 400 88 Q450 86 460 162 L448 190 Q400 173 352 190Z" fill="url(#hair)" stroke="url(#ink)" stroke-width="8"/><circle cx="456" cy="111" r="18" fill="none" stroke="'+h["accent"]+'" stroke-width="8"/><circle cx="456" cy="111" r="5" fill="'+h["accent"]+'"/>'
    if kind=="phoenix":
        return '<path d="M340 163 Q348 83 400 88 Q452 83 460 163 L449 190 Q400 174 351 190Z" fill="url(#hair)" stroke="url(#ink)" stroke-width="8"/><path d="M437 110 Q458 52 496 45 Q483 93 456 129 M447 122 Q490 90 520 100 Q491 132 454 145" fill="none" stroke="'+h["accent"]+'" stroke-width="9"/>'
    if kind=="veil":
        return '<path d="M340 160 Q350 82 400 88 Q450 82 460 160 L448 190 Q400 173 352 190Z" fill="url(#hair)" stroke="url(#ink)" stroke-width="8"/><path d="M350 146 Q300 192 316 278 M450 146 Q500 192 484 278" fill="none" stroke="'+h["cloth"]+'" stroke-width="16"/>'
    return '<path d="M328 170 Q330 95 400 90 Q470 95 472 170Z" fill="url(#armor)" stroke="url(#ink)" stroke-width="9"/>'

def weapon_svg(h):
    w=h["weapon"]
    pole='<path d="M565 150 L558 865" stroke="#684a31" stroke-width="17" stroke-linecap="round"/><path d="M558 180 L564 760" stroke="#c69a58" stroke-width="4"/>'
    grip='<path d="M544 532 L580 532 M544 575 L580 575" stroke="#d5b36d" stroke-width="8"/>'
    if w in ("spear","spear-long"):
        return pole+grip+'<path d="M565 78 Q535 126 565 178 Q595 126 565 78Z" fill="url(#metal)" stroke="url(#ink)" stroke-width="7"/><path d="M565 174 L565 223" stroke="'+h["accent"]+'" stroke-width="9"/>'
    if w in ("guandao","halberd"):
        return '<path d="M590 110 L523 865" stroke="#67482f" stroke-width="18" stroke-linecap="round"/><path d="M584 120 Q642 76 650 138 Q641 205 570 230 Q592 182 584 120Z" fill="url(#metal)" stroke="url(#ink)" stroke-width="8"/><path d="M570 183 Q532 157 514 202 Q526 244 570 230" fill="none" stroke="url(#metal)" stroke-width="15"/>'+grip
    if w in ("sword","saber"):
        return '<path d="M566 515 L566 188 Q586 145 577 102 Q557 145 548 188 L548 515Z" fill="url(#metal)" stroke="url(#ink)" stroke-width="8"/><path d="M526 512 Q566 530 590 512 L595 533 Q566 555 522 535Z" fill="url(#accent)" stroke="url(#ink)" stroke-width="7"/><path d="M556 535 L556 625 Q566 650 578 625 L578 535Z" fill="#553b2c" stroke="url(#ink)" stroke-width="6"/><path d="M566 626 L566 680" stroke="'+h["accent"]+'" stroke-width="10"/>'
    if w=="bow":
        return '<path d="M604 160 Q725 420 604 790 Q650 490 604 160Z" fill="none" stroke="#744c32" stroke-width="18"/><path d="M604 160 L604 790" stroke="url(#metal)" stroke-width="4"/><path d="M590 552 L710 495" stroke="#d6c7a0" stroke-width="7"/><path d="M700 485 L736 482 L712 510Z" fill="url(#metal)" stroke="url(#ink)" stroke-width="4"/><path d="M610 275 L675 252 M614 685 L674 708" stroke="'+h["accent"]+'" stroke-width="8"/>'
    if w=="fan":
        return '<path d="M560 584 Q498 484 525 396 Q558 424 566 454 Q587 393 607 386 Q630 466 560 584Z" fill="url(#cloth)" stroke="url(#ink)" stroke-width="8"/><path d="M560 584 L525 396 M560 584 L566 454 M560 584 L607 386 M560 584 L630 448" fill="none" stroke="url(#metal)" stroke-width="6"/><path d="M558 580 L567 660" stroke="#6a4c34" stroke-width="12"/>'
    if w=="dual-dagger" or w=="dual-blade" or w=="dual-axe":
        left='<path d="M240 545 L220 335 L252 385 L270 329 L267 545Z" fill="url(#metal)" stroke="url(#ink)" stroke-width="7"/><path d="M236 535 L274 548 L270 567 L232 556Z" fill="#6b4a32" stroke="url(#ink)" stroke-width="5"/>'
        right='<path d="M603 545 L584 335 L618 385 L637 329 L632 545Z" fill="url(#metal)" stroke="url(#ink)" stroke-width="7"/><path d="M598 535 L638 548 L633 567 L594 556Z" fill="#6b4a32" stroke="url(#ink)" stroke-width="5"/>'
        if w=="dual-axe":
            left='<path d="M230 545 L230 390 L191 345 Q165 415 213 456 L192 480 L230 490Z" fill="url(#metal)" stroke="url(#ink)" stroke-width="8"/>'
            right='<path d="M610 545 L610 390 L649 345 Q675 415 627 456 L648 480 L610 490Z" fill="url(#metal)" stroke="url(#ink)" stroke-width="8"/>'
        return left+right
    if w=="axe":
        return pole+grip+'<path d="M550 185 L620 132 Q684 188 618 268 L558 241Z" fill="url(#metal)" stroke="url(#ink)" stroke-width="9"/>'
    if w=="hammer":
        return pole+grip+'<path d="M516 142 Q563 108 614 142 L621 224 Q564 244 510 224Z" fill="url(#metal)" stroke="url(#ink)" stroke-width="10"/><path d="M538 164 L595 164 M538 196 L595 196" stroke="'+h["accent"]+'" stroke-width="8"/>'
    if w=="shield":
        return '<path d="M563 342 Q640 320 686 366 L680 519 Q636 594 565 532Z" fill="url(#armor)" stroke="url(#ink)" stroke-width="10"/><path d="M580 382 L665 382 M580 420 L665 420 M580 458 L665 458" stroke="url(#metal)" stroke-width="8"/><path d="M623 383 L623 515" stroke="'+h["accent"]+'" stroke-width="12"/>'
    if w=="ribbon":
        return '<path d="M560 580 Q705 470 629 342 Q572 248 690 172 M560 580 Q690 610 704 720" fill="none" stroke="'+h["accent"]+'" stroke-width="24" stroke-linecap="round"/><path d="M560 580 Q705 470 629 342 Q572 248 690 172" fill="none" stroke="#f8e5d5" stroke-width="5"/>'
    if w=="mechanism":
        return pole+'<path d="M520 215 L610 170 L660 245 L570 290Z" fill="url(#armor)" stroke="url(#ink)" stroke-width="9"/><circle cx="590" cy="235" r="30" fill="none" stroke="url(#metal)" stroke-width="10"/><path d="M590 205 L590 265 M560 235 L620 235" stroke="'+h["accent"]+'" stroke-width="8"/>'
    if w=="staff" or w=="scroll":
        return pole+'<path d="M536 154 Q565 116 594 154 L588 194 Q565 214 542 194Z" fill="url(#metal)" stroke="url(#ink)" stroke-width="7"/><path d="M544 170 L586 170" stroke="'+h["accent"]+'" stroke-width="7"/>'
    return pole+grip+'<path d="M565 90 L537 160 L565 210 L593 160Z" fill="url(#metal)" stroke="url(#ink)" stroke-width="7"/>'

def body_svg(h, index):
    female=h["gender"]=="f"
    armor=h["armor"]; cloth=h["cloth"]; accent=h["accent"]
    skin="#f2c7a5" if female else "#e5b18c"
    ink="#171d22"
    style=index%6
    if female:
        body='<path d="M346 344 Q400 322 454 344 L474 554 Q496 706 557 913 Q402 970 243 913 Q304 706 326 554Z" fill="url(#cloth)" stroke="url(#ink)" stroke-width="11"/><path d="M351 372 Q400 345 449 372 L456 518 Q400 554 344 518Z" fill="url(#armor)" stroke="url(#ink)" stroke-width="9"/><path d="M362 392 Q400 376 438 392 L442 470 Q400 488 358 470Z" fill="url(#metal)" stroke="url(#ink)" stroke-width="6"/>'+'<path d="M354 414 Q374 390 398 418 Q422 390 446 414" fill="none" stroke="'+accent+'" stroke-width="7"/><path d="M400 416 L400 490" fill="none" stroke="url(#metal)" stroke-width="5"/>'
        arms='<path d="M344 365 Q311 372 296 411 L266 495 Q260 524 286 540 L312 522 L335 448 L371 417Z" fill="url(#cloth)" stroke="url(#ink)" stroke-width="10"/><path d="M456 365 Q489 372 504 411 L534 495 Q540 524 514 540 L488 522 L465 448 L429 417Z" fill="url(#cloth)" stroke="url(#ink)" stroke-width="10"/>'
        hands='<path d="M269 510 Q282 501 297 511 L313 532 Q317 548 303 557 L287 551 L277 562 Q262 560 258 545Z" fill="url(#skin)" stroke="url(#ink)" stroke-width="7"/><path d="M531 510 Q518 501 503 511 L487 532 Q483 548 497 557 L513 551 L523 562 Q538 560 542 545Z" fill="url(#skin)" stroke="url(#ink)" stroke-width="7"/><path d="M278 531 L292 546 M506 531 L520 546" stroke="#a66d5b" stroke-width="4" fill="none"/>'
        hair='<path d="M342 182 Q310 302 292 470 Q320 535 352 484 L367 293 M458 182 Q490 302 508 470 Q480 535 448 484 L433 293Z" fill="url(#hair)" stroke="url(#ink)" stroke-width="10"/>'
        extra='<path d="M330 505 Q400 560 470 505 L501 865 Q400 930 299 865Z" fill="none" stroke="'+accent+'" stroke-width="9"/><path d="M320 568 Q400 610 480 568 M302 660 Q400 711 498 660 M277 780 Q400 834 523 780" fill="none" stroke="url(#metal)" stroke-width="6"/>'
    else:
        body='<path d="M314 345 Q400 308 486 345 L508 572 Q496 694 474 815 L326 815 Q304 694 292 572Z" fill="url(#cloth)" stroke="url(#ink)" stroke-width="12"/><path d="M335 355 Q400 322 465 355 L482 526 Q400 573 318 526Z" fill="url(#armor)" stroke="url(#ink)" stroke-width="11"/>'
        if style==0:
            chest='<path d="M340 378 Q400 348 460 378 L470 456 Q400 494 330 456Z" fill="url(#metal)" stroke="url(#ink)" stroke-width="7"/><path d="M333 425 Q400 454 467 425 M330 460 Q400 492 470 460 M337 495 Q400 523 463 495" fill="none" stroke="'+accent+'" stroke-width="9"/>'
        elif style==1:
            chest='<path d="M340 376 Q400 345 460 376 L478 470 L400 525 L322 470Z" fill="url(#metal)" stroke="url(#ink)" stroke-width="8"/><path d="M400 374 L400 515 M342 425 L458 425 M333 467 L467 467" fill="none" stroke="'+accent+'" stroke-width="8"/>'
        elif style==2:
            chest='<path d="M335 374 Q400 345 465 374 L473 505 Q400 532 327 505Z" fill="url(#metal)" stroke="url(#ink)" stroke-width="8"/><path d="M344 397 Q400 420 456 397 M338 436 Q400 461 462 436 M334 477 Q400 503 466 477" fill="none" stroke="'+accent+'" stroke-width="8"/>'
        elif style==3:
            chest='<path d="M340 370 L460 370 L482 470 L400 531 L318 470Z" fill="url(#metal)" stroke="url(#ink)" stroke-width="8"/><path d="M350 390 L450 390 L462 455 L400 500 L338 455Z" fill="url(#armor)" stroke="'+accent+'" stroke-width="7"/><path d="M400 389 L400 505" stroke="url(#metal)" stroke-width="7"/>'
        elif style==4:
            chest='<path d="M338 376 Q400 346 462 376 L468 510 Q400 542 332 510Z" fill="url(#metal)" stroke="url(#ink)" stroke-width="8"/><path d="M350 397 Q400 421 450 397 L444 469 Q400 493 356 469Z" fill="url(#armor)" stroke="'+accent+'" stroke-width="7"/><g fill="'+accent+'" stroke="url(#ink)" stroke-width="4"><circle cx="365" cy="414" r="9"/><circle cx="400" cy="429" r="10"/><circle cx="435" cy="414" r="9"/></g><path d="M350 478 Q400 506 450 478" fill="none" stroke="url(#metal)" stroke-width="7"/>'
        else:
            chest='<path d="M334 379 Q400 344 466 379 L478 500 Q400 543 322 500Z" fill="url(#metal)" stroke="url(#ink)" stroke-width="8"/><path d="M350 397 L450 397 L465 466 L400 515 L335 466Z" fill="url(#armor)" stroke="'+accent+'" stroke-width="7"/><path d="M355 420 L445 420 M342 463 L458 463 M400 397 L400 505" fill="none" stroke="url(#metal)" stroke-width="7"/><path d="M365 441 L435 481 M435 441 L365 481" fill="none" stroke="'+accent+'" stroke-width="5"/>'
        body+=chest
        arms='<path d="M321 359 Q286 366 269 411 L241 485 Q236 516 263 535 L294 520 L318 448 L355 416Z" fill="url(#armor)" stroke="url(#ink)" stroke-width="11"/><path d="M479 359 Q514 366 531 411 L559 485 Q564 516 537 535 L506 520 L482 448 L445 416Z" fill="url(#armor)" stroke="url(#ink)" stroke-width="11"/><path d="M252 473 Q279 463 299 487 L290 532 L263 546 Q244 529 245 505Z M548 473 Q521 463 501 487 L510 532 L537 546 Q556 529 555 505Z" fill="url(#metal)" stroke="url(#ink)" stroke-width="8"/>'
        hands='<path d="M251 518 Q266 506 283 519 L299 541 Q302 557 288 568 L273 559 L261 570 Q246 565 242 549Z" fill="url(#skin)" stroke="url(#ink)" stroke-width="7"/><path d="M549 518 Q534 506 517 519 L501 541 Q498 557 512 568 L527 559 L539 570 Q554 565 558 549Z" fill="url(#skin)" stroke="url(#ink)" stroke-width="7"/><path d="M254 542 L270 557 M546 542 L530 557" stroke="#9a644d" stroke-width="4" fill="none"/>'
        extra='<path d="M326 548 Q400 579 474 548 L462 684 Q400 715 338 684Z" fill="url(#armor)" stroke="url(#ink)" stroke-width="9"/><path d="M337 568 Q400 594 463 568 M341 605 Q400 629 459 605 M346 643 Q400 664 454 643" fill="none" stroke="'+accent+'" stroke-width="7"/>'
        hair='<path d="M342 176 Q329 243 350 287 L331 338 Q303 308 311 215 Q310 138 371 115Z M458 176 Q471 243 450 287 L469 338 Q497 308 489 215 Q490 138 429 115Z" fill="url(#hair)" stroke="url(#ink)" stroke-width="9"/>'
    # Cape and common lower-body structure.
    cape='<path d="M320 352 Q242 395 218 564 L251 788 Q300 747 345 696 L400 730 L455 696 Q500 747 549 788 L582 564 Q558 395 480 352 L445 407 L400 430 L355 407Z" fill="url(#cloth)" stroke="url(#ink)" stroke-width="10"/><path d="M246 548 Q282 570 318 545 M554 548 Q518 570 482 545" fill="none" stroke="'+accent+'" stroke-width="8"/>'
    legs='<path d="M326 680 Q400 716 474 680 L458 878 L424 931 L362 931 L342 878Z" fill="url(#armor)" stroke="url(#ink)" stroke-width="11"/><path d="M341 742 Q400 768 459 742 L450 828 Q400 852 350 828Z" fill="url(#cloth)" stroke="'+accent+'" stroke-width="7"/><path d="M350 872 L422 872 L433 950 Q400 969 333 950Z" fill="url(#metal)" stroke="url(#ink)" stroke-width="9"/><path d="M333 950 Q380 964 433 950 L445 982 Q380 1000 315 982Z" fill="#211f20" stroke="url(#ink)" stroke-width="8"/>'
    if female:
        legs='<path d="M330 670 Q400 700 470 670 L552 916 Q400 982 248 916Z" fill="url(#cloth)" stroke="url(#ink)" stroke-width="11"/><path d="M350 710 Q400 740 450 710 L485 899 Q400 944 315 899Z" fill="url(#armor)" stroke="'+accent+'" stroke-width="8"/><path d="M400 704 L400 917" stroke="url(#metal)" stroke-width="6"/>'
    beard_kind=h["beard"]
    beard=""
    if not female and beard_kind not in ("none","clean"):
        beard_path={
            "short":'<path d="M354 270 Q400 321 446 270 L438 315 Q400 352 362 315Z"/>',
            "goatee":'<path d="M370 278 Q400 312 430 278 Q426 345 400 362 Q374 345 370 278Z"/>',
            "long":'<path d="M355 270 Q400 320 445 270 L442 398 Q400 466 358 398Z"/>',
            "full":'<path d="M346 262 Q400 326 454 262 L470 350 Q445 432 400 448 Q355 432 330 350Z"/>',
            "white":'<path d="M355 270 Q400 320 445 270 L440 390 Q400 432 360 390Z"/>',
            "moustache":'<path d="M360 270 Q380 250 400 274 Q420 250 440 270 Q422 299 400 284 Q378 299 360 270Z"/>',
            "braid":'<path d="M354 270 Q400 320 446 270 L438 360 Q400 414 362 360Z"/>'
        }.get(beard_kind,"")
        bfill="#e1d4bd" if beard_kind=="white" else "#211d1c"
        beard=beard_path.replace("/>",' fill="'+bfill+'" stroke="url(#ink)" stroke-width="7"/>')
        if beard_kind=="braid":
            beard+='<path d="M400 364 Q414 402 398 442" fill="none" stroke="'+accent+'" stroke-width="8"/>'
    face='<path d="M350 166 Q350 112 400 108 Q450 112 450 166 L446 254 Q436 304 400 320 Q364 304 354 254Z" fill="url(#skin)" stroke="url(#ink)" stroke-width="9"/><path d="M354 221 Q400 243 446 221" fill="none" stroke="#c88468" stroke-width="4" opacity=".65"/><path d="M368 206 Q385 190 395 205 M405 205 Q415 190 432 206" fill="none" stroke="#30201d" stroke-width="8" stroke-linecap="round"/><path d="M368 225 Q382 207 396 225 Q382 243 368 225Z M404 225 Q418 207 432 225 Q418 243 404 225Z" fill="#fff0df" stroke="#3b2928" stroke-width="5"/><g fill="#292126"><ellipse cx="382" cy="225" rx="5" ry="8"/><ellipse cx="418" cy="225" rx="5" ry="8"/></g><path d="M369 216 L362 210 M431 216 L438 210" fill="none" stroke="#332326" stroke-width="4"/><path d="M400 222 L390 257 Q400 266 410 257" fill="none" stroke="#a96f58" stroke-width="5"/><path d="M382 278 Q400 286 418 278" fill="none" stroke="#8d5145" stroke-width="5"/><path d="M338 198 Q326 225 348 244 M462 198 Q474 225 452 244" fill="none" stroke="url(#skin)" stroke-width="12"/>'
    if female:
        face=face.replace('Q400 286 418 278','Q400 282 418 278')
        face+='<g fill="#d88992" opacity=".28"><circle cx="358" cy="257" r="10"/><circle cx="442" cy="257" r="10"/></g><path d="M385 284 Q400 293 415 284" fill="none" stroke="#a74f63" stroke-width="4"/>'
        hair+='<path d="M352 180 Q370 149 398 154 Q430 150 448 181" fill="none" stroke="'+h["accent"]+'" stroke-width="9"/>'
    else:
        hair+='<path d="M356 153 Q400 110 444 153 L438 183 Q400 159 362 183Z" fill="url(#hair)" stroke="url(#ink)" stroke-width="7"/>'
    helmet=headgear(h)
    if female:
        shoulders='<path d="M340 354 Q300 346 286 386 L318 428 L354 399 M460 354 Q500 346 514 386 L482 428 L446 399" fill="url(#armor)" stroke="url(#ink)" stroke-width="8"/><path d="M344 365 Q400 342 456 365" fill="none" stroke="url(#metal)" stroke-width="8"/>'
        collar='<path d="M360 345 Q400 385 440 345 L432 403 Q400 430 368 403Z" fill="url(#metal)" stroke="url(#ink)" stroke-width="7"/>'
    else:
        shoulders='<path d="M330 352 Q285 328 268 378 L304 446 L349 414Z M470 352 Q515 328 532 378 L496 446 L451 414Z" fill="url(#metal)" stroke="url(#ink)" stroke-width="9"/><path d="M280 384 Q309 356 333 391 M520 384 Q491 356 467 391" fill="none" stroke="'+accent+'" stroke-width="8"/>'
        collar='<path d="M354 332 Q400 360 446 332 L438 382 Q400 415 362 382Z" fill="url(#metal)" stroke="url(#ink)" stroke-width="8"/>'
    rows=[]
    for y in (414,452,490,528):
        width=58+(y-414)//5
        rows.append(f'<path d="M{400-width} {y} Q400 {y+17} {400+width} {y} L{400+width-7} {y+26} Q400 {y+43} {400-width+7} {y+26}Z" fill="url(#armor)" stroke="{accent}" stroke-width="5"/>')
    emblem='<path d="M400 405 L420 433 L400 462 L380 433Z" fill="'+accent+'" stroke="url(#ink)" stroke-width="5"/><circle cx="400" cy="433" r="8" fill="url(#metal)"/>'
    if female:
        emblem='<path d="M400 403 Q430 426 400 456 Q370 426 400 403Z" fill="'+accent+'" stroke="url(#ink)" stroke-width="5"/><circle cx="400" cy="429" r="9" fill="url(#metal)"/>'
    rivets='<g fill="#f1d99a" stroke="url(#ink)" stroke-width="3"><circle cx="343" cy="446" r="6"/><circle cx="457" cy="446" r="6"/><circle cx="350" cy="489" r="5"/><circle cx="450" cy="489" r="5"/></g>'
    if h["beard"]=="white": hair=hair.replace('url(#hair)','url(#hair)')
    defs=f'''<defs>
<linearGradient id="armor" x1="0" y1="0" x2="1" y2="1"><stop stop-color="{h["accent"]}"/><stop offset=".22" stop-color="{armor}"/><stop offset=".62" stop-color="{cloth}"/><stop offset="1" stop-color="#171d22"/></linearGradient>
<linearGradient id="cloth" x1="0" y1="0" x2="1" y2="1"><stop stop-color="{cloth}"/><stop offset=".55" stop-color="{h["cloth"]}"/><stop offset="1" stop-color="#171d22"/></linearGradient>
<linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff0c7"/><stop offset=".3" stop-color="{accent}"/><stop offset=".7" stop-color="#8a653b"/><stop offset="1" stop-color="#30251c"/></linearGradient>
<linearGradient id="skin" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffe0c0"/><stop offset=".65" stop-color="{skin}"/><stop offset="1" stop-color="#a96e5a"/></linearGradient>
<linearGradient id="hair" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#51403a"/><stop offset=".45" stop-color="#211e20"/><stop offset="1" stop-color="#090e12"/></linearGradient>
<linearGradient id="ink"><stop stop-color="#24201e"/><stop offset="1" stop-color="#0d1318"/></linearGradient><linearGradient id="accent"><stop stop-color="{accent}"/><stop offset="1" stop-color="#5f472e"/></linearGradient>
</defs>'''
    title=f'<title>{esc(h["name"])} · 独立全身立绘</title><desc>统一厚涂质感线稿、完整双臂与双手结构、分层胸甲和专属武器。</desc>'
    # Render weapon behind the arms so the grip sits in the palm rather than floating beside it.
    wide='<g transform="translate(-100 0) scale(1.25 1)">'
    content='<ellipse cx="400" cy="984" rx="180" ry="15" fill="#101719" opacity=".18"/>'+wide+cape+'</g><g transform="translate(22 0)">'+weapon_svg(h)+'</g>'+wide+legs+body+arms+shoulders+collar+''.join(rows)+emblem+rivets+extra+hair+'<path d="M360 334 Q400 354 440 334" fill="none" stroke="'+accent+'" stroke-width="8"/>'+face+beard+helmet+hands+'</g>'
    if female:
        content+='<g transform="translate(-100 0) scale(1.25 1)"><g fill="'+accent+'" stroke="url(#ink)" stroke-width="4"><circle cx="338" cy="265" r="9"/><circle cx="462" cy="265" r="9"/></g><path d="M355 294 Q400 309 445 294" fill="none" stroke="#f8e0d3" stroke-width="4" opacity=".8"/></g>'
    else:
        content+='<path d="M345 203 Q360 188 380 197 M420 197 Q440 188 455 203" fill="none" stroke="#171819" stroke-width="7"/>'
    return f'<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">{title}{defs}<g stroke-linejoin="round" stroke-linecap="round">{content}</g></svg>'

def portrait_svg(body,h):
    m=re.search(r'<svg[^>]*>(.*)</svg>',body,re.S)
    inner=m.group(1) if m else ''
    view="180 66 440 500" if h["gender"]=="f" else "170 52 460 510"
    return f'<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="{view}"><title>{esc(h["name"])}头像</title>{inner}</svg>'

def attack_mark(h,frame):
    a=[.10,.55,1,.35][frame]; w=h["weapon"]; c=h["accent"]
    if w in ("spear","spear-long"): p='M250 480 Q420 505 720 330'
    elif w in ("bow",): p='M555 470 Q690 420 760 360 M565 500 L780 500'
    elif w in ("fan","scroll"): p='M530 530 Q680 360 725 485 M540 535 Q650 420 680 560'
    elif w in ("dual-dagger","dual-blade","dual-axe"): p='M255 425 Q400 300 560 435 M255 565 Q410 690 600 535'
    elif w in ("hammer","axe","shield","mechanism"): p='M300 560 Q480 300 690 430'
    else: p='M285 570 Q470 290 730 430'
    return f'<path d="{p}" fill="none" stroke="{c}" stroke-width="{18 if frame==2 else 11}" stroke-linecap="round" opacity="{a}"/><path d="{p}" fill="none" stroke="#fff0c8" stroke-width="4" stroke-linecap="round" opacity="{a*.7}"/>'

def skill_mark(h,frame):
    fx=h["fx"]; c=h["accent"]; a=[.18,.52,1,.42][frame]
    if fx in ("fire","phoenix","flame"):
        return f'<g opacity="{a}" fill="none" stroke="#ff8d4d" stroke-width="16" stroke-linecap="round"><path d="M260 660 Q220 520 320 430 Q290 540 390 550 Q420 440 505 360 Q485 560 620 620"/><path d="M330 700 Q400 610 470 700"/></g><circle cx="400" cy="500" r="190" fill="none" stroke="{c}" stroke-width="7" opacity="{a}"/>'
    if fx in ("heal","shield"):
        return f'<g opacity="{a}" fill="none" stroke="{c}" stroke-width="11"><circle cx="400" cy="500" r="{115+frame*24}"/><circle cx="400" cy="500" r="{70+frame*18}"/><path d="M400 340 L400 660 M240 500 L560 500"/></g><path d="M400 390 Q450 450 400 510 Q350 450 400 390Z" fill="{c}" opacity="{a*.6}"/>'
    if fx in ("charm","ice"):
        return f'<g opacity="{a}" fill="none" stroke="{c}" stroke-width="12"><path d="M400 320 Q510 390 470 510 Q440 605 335 565 Q250 530 280 430 Q300 370 360 372"/><path d="M400 390 L430 450 L400 510 L370 450Z"/></g><g fill="{c}" opacity="{a}"><circle cx="280" cy="350" r="14"/><circle cx="530" cy="390" r="12"/><circle cx="320" cy="650" r="10"/></g>'
    if fx in ("dragon","tiger","wind","storm","lightning"):
        return f'<g opacity="{a}" fill="none" stroke="{c}" stroke-width="14" stroke-linecap="round"><path d="M200 570 Q300 320 480 390 Q660 460 570 640 Q500 760 350 640 Q260 565 400 480 Q510 405 610 510"/><path d="M240 690 Q400 800 620 650"/></g><path d="M540 355 L620 300 L590 395Z" fill="{c}" opacity="{a}"/>'
    if fx in ("formation","shadow","thunder","earth"):
        return f'<g opacity="{a}" fill="none" stroke="{c}" stroke-width="9"><circle cx="400" cy="500" r="190"/><circle cx="400" cy="500" r="125"/><path d="M400 300 L575 600 L225 600Z M225 400 L575 400 L400 700Z"/><path d="M400 310 L400 690 M230 500 L570 500"/></g>'
    if fx=="arrow":
        return f'<g opacity="{a}" stroke="{c}" fill="none" stroke-width="13"><path d="M190 630 L700 380 M280 690 L730 470 M320 510 L670 250"/><path d="M680 370 L740 360 L710 415Z" fill="{c}"/></g>'
    if fx=="blood":
        return f'<g opacity="{a}" fill="none" stroke="#b94b43" stroke-width="17"><path d="M260 340 Q400 470 320 610 Q410 570 460 700 Q540 560 660 520"/><circle cx="400" cy="500" r="145"/></g>'
    return f'<g opacity="{a}" fill="none" stroke="{c}" stroke-width="12"><circle cx="400" cy="500" r="160"/><path d="M400 300 Q540 500 400 700 Q260 500 400 300Z"/></g>'

def sprite_sheet(body,h,mode):
    m=re.search(r'<svg[^>]*>(.*)</svg>',body,re.S)
    inner=m.group(1) if m else ''
    frames=[]
    transforms=(["translate(0 0)","translate(-10 -8) rotate(-3 400 840)","translate(28 -16) rotate(7 400 840)","translate(-4 0) rotate(-1 400 840)"] if mode=="attack" else ["translate(0 0)","translate(0 -18) scale(1.02)","translate(0 -28) scale(1.06)","translate(0 -2) scale(1.01)"])
    for i,tr in enumerate(transforms):
        mark=attack_mark(h,i) if mode=="attack" else skill_mark(h,i)
        frames.append(f'<g transform="translate({i*800} 0)"><g transform="{tr}"><svg x="0" y="0" width="800" height="1000" viewBox="0 0 800 1000">{inner}</svg></g>{mark}</g>')
    label="普通攻击四帧" if mode=="attack" else "专属战技四帧"
    return f'<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="3200" height="1000" viewBox="0 0 3200 1000"><title>{esc(h["name"])}·{label}</title>'+''.join(frames)+'</svg>'

def write(path,text):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(text,encoding="utf-8")

def main():
    assert len(ALL_ART)==50, f"expected 50 generals, got {len(ALL_ART)}"
    # New playable generals are exported as data without disturbing existing save ids.
    extras_js=[]
    extra_ids={}
    meta={}
    for idx,h in enumerate(ALL_ART):
        slug=h["slug"]
        h.setdefault("title","")
        if slug not in KEEP_BASE:
            body=body_svg(h,idx)
            write(ART/(slug+".svg"),body)
            portrait=portrait_svg(body,h)
            write(PORTRAITS/(slug+".svg"),portrait)
        else:
            body=(ART/(slug+".svg")).read_text(encoding="utf-8")
            portrait=(PORTRAITS/(slug+".svg")).read_text(encoding="utf-8")
        write(ANIMS/(slug+"-attack.svg"),sprite_sheet(body,h,"attack"))
        write(ANIMS/(slug+"-skill.svg"),sprite_sheet(body,h,"skill"))
        folder=SPRITES/slug.replace("-","_")
        write(folder/(slug.replace("-","_")+"_idle.svg"),body)
        write(folder/(slug.replace("-","_")+"_portrait.svg"),portrait)
        write(folder/(slug.replace("-","_")+"_attack.svg"),sprite_sheet(body,h,"attack"))
        write(folder/(slug.replace("-","_")+"_skill.svg"),sprite_sheet(body,h,"skill"))
        meta[h["id"]]=dict(art=slug,weapon=h["weapon"],skillFx=h["fx"],female=h["gender"]=="f")
        if h in EXTRAS:
            extra_ids[h["id"]]=slug
            hero_entry=dict(id=h["id"],name=h["name"],title=h["title"],rarity=h["rarity"],role=h["role"],troop=h["troop"],
                            atk=h["atk"],hp=h["hp"],energy=h["energy"],skill=h["skill"],desc=h["desc"],
                            face=h["face"],bio=h["bio"],weapon=h["weapon"],skillFx=h["fx"])
            hero_entry["def"]=h["defense"]
            extras_js.append(hero_entry)
    js="window.EXTRA_HEROES="+json.dumps(extras_js,ensure_ascii=False,separators=(",",":"))+";\n"
    js+="window.EXTRA_HERO_ART_IDS="+json.dumps(extra_ids,ensure_ascii=False,separators=(",",":"))+";\n"
    js+="window.HERO_ANIM_META="+json.dumps(meta,ensure_ascii=False,separators=(",",":"))+";\n"
    write(ART/"roster-extra.js",js)
    manifest=dict(total=len(ALL_ART),male=sum(h["gender"]=="m" for h in ALL_ART),female=sum(h["gender"]=="f" for h in ALL_ART),
                  heroes=[dict(id=h["id"],name=h["name"],art=h["slug"],gender=h["gender"],weapon=h["weapon"],skillFx=h["fx"]) for h in ALL_ART])
    write(ART/"roster-manifest.json",json.dumps(manifest,ensure_ascii=False,indent=2))
    attack_count=len(list(ANIMS.glob("*-attack.svg")))
    skill_count=len(list(ANIMS.glob("*-skill.svg")))
    assert attack_count==50 and skill_count==50, (attack_count,skill_count)
    print(f"Generated 50 generals ({manifest['male']} male, {manifest['female']} female), 50 portraits, 100 four-frame action sheets.")

if __name__=="__main__":
    main()
