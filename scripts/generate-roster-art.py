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
liu|liu-bei|刘备|m|#8e302d|#392226|#d8b56a|sword|benevolent-mandate|crown|goatee
guan|guan-yu|关羽|m|#28644a|#112b2b|#d9bd79|guandao|azure-dragon-slash|winged|long
zhang|zhang-fei|张飞|m|#374852|#111b22|#bd9558|spear|tiger-roar|iron|full
zhao|zhao-yun|赵云|m|#8baebb|#293f55|#e0d8c3|spear|silver-pearls|plume|clean
zhuge|zhuge-liang|诸葛亮|m|#879987|#2d4846|#d7c59a|fan|eight-trigrams|scholar|goatee
huang|huang-zhong|黄忠|m|#b68a42|#3d5138|#e1c17c|bow|hundred-pace-arrow|archer|white
dia|diaochan|貂蝉|f|#9b6285|#392642|#e7c6df|dual-dagger|closed-moon|hairpin|none
cao|cao-cao|曹操|m|#515875|#252a3f|#c9aa6b|sword|wei-warlord|crown|short
zhou|zhou-yu|周瑜|m|#a94736|#4b2930|#e2c077|sword|red-cliff-fire|plume|clean
lvbu|lv-bu|吕布|m|#9d332f|#341e29|#e0b56b|halberd|sky-halberd|horned|long
diaowei|dian-wei|典韦|m|#816044|#342d2b|#c99a58|dual-axe|evil-hunter|iron|full
jiang|jiang-wei|姜维|m|#4c8192|#253c4d|#d5d7c5|spear|qilin-strategy|silver|short
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

BASE_SKILLS = {
"liu-bei":("仁德济世","为全体友军恢复生命并净化持续伤害，鼓舞士气。","我方全体"),
"guan-yu":("青龙偃月","选择两名敌军发动横斩，造成高额伤害并破甲。","敌方两名可选目标"),
"zhang-fei":("燕人咆哮","震击敌方全体，造成伤害、降低速度并削弱士气。","敌方全体"),
"zhao-yun":("七进七出","连续突击三次，低血量时伤害提高。","敌方最多三次追击"),
"zhuge-liang":("八阵图","布下奇门阵，对全体敌军造成谋略伤害。","敌方全体"),
"huang-zhong":("百步穿杨","锁定当前生命最低的敌人，造成高额远程伤害并破甲。","敌方最低生命目标"),
"diaochan":("闭月迷魂","迷惑一名敌军，使其眩晕并错失下一次行动。","敌方单体"),
"cao-cao":("魏武雄略","全体友军获得护盾、攻击强化与士气提升。","我方全体"),
"zhou-yu":("赤壁烈焰","火攻覆盖敌方全体，造成伤害并持续灼烧。","敌方全体"),
"lv-bu":("方天乱舞","挥动画戟连续发动三次打击，自动追击存活敌人。","敌方随机目标，最多三击"),
"dian-wei":("恶来护主","全体友军获得护盾，同时反击锁定敌人。","我方全体＋敌方单体"),
"jiang-wei":("麒麟奇谋","攻击一名敌人并减速，为全军回复能量并降低下一次技能消耗。","敌方单体＋我方全体")
}

def parse_base():
    out=[]
    for line in BASE_ROWS.strip().splitlines():
        i,slug,name,gender,armor,cloth,accent,weapon,fx,head,beard=line.split("|")
        skill,desc,skillRange=BASE_SKILLS[slug]
        out.append(dict(id=i,slug=slug,name=name,gender=gender,armor=armor,cloth=cloth,accent=accent,weapon=weapon,fx=fx,head=head,beard=beard,
                        skill=skill,desc=desc,skillRange=skillRange))
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
PHYSIQUE_DATA = json.loads((ROOT / "app/src/main/assets/characters/2d/character-identity.json").read_text(encoding="utf-8"))["characters"]
EXTRA_SKILLS = {
"machao":("西凉突骑","银枪引动三段骑势，先刺穿敌方前锋，再追击其身后目标；首击破甲，末击追加冲锋伤害。","敌方前排两名目标","xiliang-charge"),
"weiyan":("狂骨裂阵","大刀沿斜线撕开一名敌将的防线；若目标已受伤，则追加重击并为魏延回复少量生命。","敌方单体；受伤目标追加重击","blood-maw"),
"pangtong":("凤雏涅槃","以自身少量生命点燃凤羽奇阵，随后对敌方全体造成谋略伤害；若我方有人倒下，凤火额外提升。","敌方全体；我方减员时强化","phoenix-rebirth"),
"fazheng":("睚眦定计","锁定敌方当前攻击最高者，施加破甲与缴械；其下一次行动结束后再受到一次谋略伤害。","敌方攻击最高单体","weakpoint-mark"),
"xushu":("剑心破阵","拔剑疾进斩击目标，并以剑势封住其兵刃；目标迟缓且缴械，徐庶获得临时护盾。","敌方单体＋自身护盾","sword-rift"),
"madai":("雁门追风","绕过敌方前排，专取后排弓弩手；若没有远程单位，则追击生命最低的敌人。","敌方后排优先单体","rear-hunt"),
"guanping":("青锋断浪","以长刀正面破盾，先削除目标护盾，再造成高额斩击并破甲。","敌方护盾最高单体","river-break"),
"guanxing":("青龙继志","承袭关家刀法，对两名敌将发动先后追斩；第二刀若命中同一目标则追加破甲。","敌方两名不同目标","dragon-inherit"),
"zhangbao":("丈八破军","双手挺矛猛击地面，震退敌阵前排并使其迟缓；前排不足两人时集中重刺。","敌方前排全体","snake-spear"),
"zhangliao":("逍遥津突袭","骑兵长驱直入，横穿敌阵打击一整列；若击倒目标，敌军士气额外下降。","敌方一列目标","swift-cavalry"),
"zhanghe":("长驱巧变","连续变换枪路，先佯攻再回马刺；三次攻击分别针对不同存活目标。","敌方随机三名目标","feint-step"),
"xuhuang":("断粮破阵","抡起大斧重劈敌方防御最高者，造成破阵伤害并持续破甲。","敌方防御最高单体","siege-axe"),
"xuchu":("虎侯震山","重锤砸地形成三圈震荡，对全体敌人造成震击；中央目标额外眩晕。","敌方全体；中央目标眩晕","tiger-earthquake"),
"xiahou-dun":("拔矢啖睛","以伤换势，夏侯惇损失少量生命后发动复仇重斩；自身生命越低，伤害越高。","敌方单体；自身低血量强化","one-eye-reckoning"),
"xiahou-yuan":("定军神速","连射三箭，分别追踪生命最低、攻击最高和随机敌人，箭矢不会重复锁定同一目标。","敌方最多三名不同目标","triple-arrow"),
"guojia":("遗计定局","预先落下三枚命运棋子，随机标记三名敌人；其各自下一次行动前触发额外谋略伤害。","敌方随机三名目标；延迟触发","fate-ambush"),
"xunyu":("王佐筹谋","为生命比例最低的友军恢复生命并净化异常，再提升全军攻击；不重复治疗已满血单位。","我方最低生命比例单体＋全军攻击增益","kingmaker-aegis"),
"simayi":("鹰视狼顾","暗影扑向当前能量最高的敌将，偷取其行动气势并施加中毒；司马懿同时回复能量。","敌方能量最高单体＋自身回能","wolf-shadow"),
"caoren":("固若金汤","曹仁架起盾阵，优先为前排友军构筑重盾；本回合承受的首次攻击伤害大幅降低。","我方前排防护","iron-wall"),
"caopi":("魏嗣承天","以帝王诏令压制敌方主将，造成雷霆伤害并缴械；敌方士气随之下降。","敌方主将优先单体","imperial-edict"),
"yuejin":("先登陷阵","乐进以短兵抢入敌阵，专攻生命最低的前排；若目标生命低于四分之一则追加处决伤害。","敌方前排最低生命单体","first-breach"),
"yujin":("持军有度","于禁整肃军纪，全军获得防御强化与薄层护盾；我方已有护盾越少，增益越强。","我方全体防守增益","formation-lock"),
"sunce":("霸王冲阵","孙策以霸王之势突进，击穿目标并提升自身攻击；击倒敌人时立即获得额外能量。","敌方单体＋自身攻击强化","overlord"),
"sunquan":("江东号令","孙权发出中军号令，使全军恢复能量并提升士气；弓弩单位额外获得攻击提升。","我方全体能量与士气","jiangdong-command"),
"luxun":("火烧连营","陆逊引火焚烧敌方阵地，造成持续灼烧；敌人若已灼烧，火势蔓延至相邻目标。","敌方全体；灼烧可蔓延","burning-camp"),
"lvmeng":("白衣奇袭","吕蒙伪装突入敌后，对后排造成突袭伤害并眩晕最脆弱的远程目标。","敌方后排；远程目标优先眩晕","white-cloak"),
"ganning":("锦帆夜袭","甘宁双刀夜袭两名后排目标，先斩其能量再造成伤害；对弓弩单位追加流血。","敌方后排两名目标","night-raid"),
"taishici":("神亭破敌","太史慈张弓蓄力，对单体射出贯穿箭；若目标护盾被击破，箭势穿透至另一名敌人。","敌方单体；破盾后穿透","shen-ting"),
"huanggai":("苦肉诈降","黄盖引爆火攻器械，自身承受少量反噬，对全体敌人造成火器伤害并施加灼烧。","敌方全体＋自身反噬","fire-vessel"),
"lusu":("榻上定策","鲁肃为当前生命最低的友军献策，恢复其生命与能量，并为其添加厚盾。","我方最低生命单体","taying-plan"),
"sunshangxiang":("枭姬连弩","孙尚香以连弩快速三连射，优先锁定三个不同敌人；每箭命中后提升自身闪避势头。","敌方最多三名不同目标","crossbow-volley"),
"daqiao":("江东花影","大乔以花影安抚军心，净化全体友军异常状态，并重点治疗生命比例最低者。","我方全体净化＋单体治疗","flower-recovery"),
"xiaoqiao":("流火双扇","小乔双扇交替舞出两道火弧，分别攻击两名敌人；同一目标不可同时承受两道主焰。","敌方两名不同目标","twin-fan"),
"zhenji":("洛水惊鸿","甄宓引洛水寒潮冻结敌阵，造成谋略伤害并迟缓全体；当前已迟缓者有概率眩晕。","敌方全体；迟缓目标有机会眩晕","luoshui-freeze"),
"huangyueying":("木牛流马","黄月英召出机关木牛，为全军补充护盾与能量；护盾最低的友军获得额外机关护卫。","我方全体＋薄盾友军强化","wooden-cattle"),
"wangyi":("忠烈断刃","王异以双刃进行两次反击式斩击；若自身生命低于一半，第二刀必定暴击并吸取部分伤害。","敌方单体两段；低血量强化","vengeful-blade"),
"mayunlu":("银月枪舞","马云禄旋枪扫击敌方前排，随后突刺最远处目标；两段攻击使用不同距离与倍率。","敌方前排＋最远目标","silver-moon"),
"ganfuren":("母仪护佑","甘夫人守护生命最低的友军，为其恢复生命并赋予一次濒死保护护盾；若无重伤者则保护主将。","我方濒危单体保护","maternal-aegis")
}
for hero in EXTRAS:
    if hero["slug"] not in EXTRA_SKILLS:
        raise ValueError(f"missing unique skill for {hero['slug']}")
    hero["skill"],hero["desc"],hero["skillRange"],hero["fx"]=EXTRA_SKILLS[hero["slug"]]
if len({hero["skill"] for hero in EXTRAS}) != len(EXTRAS):
    raise ValueError("new general skill names must all be unique")
if len({hero["fx"] for hero in EXTRAS}) != len(EXTRAS):
    raise ValueError("new general skill FX identifiers must all be unique")
ALL_ART = BASE + EXTRAS
for hero in ALL_ART:
    hero["physique"] = PHYSIQUE_DATA[hero["slug"]]
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

def _rgb(hex_color):
    return tuple(int(hex_color[i:i+2],16) for i in (1,3,5))

def _hex(rgb):
    return "#"+"".join(f"{max(0,min(255,int(v))):02x}" for v in rgb)

def _mix(a,b,t):
    aa=_rgb(a); bb=_rgb(b)
    return _hex(tuple(aa[i]*(1-t)+bb[i]*t for i in range(3)))

def _dark(c,t=0.25):
    return _mix(c,"#11171b",t)

def _light(c,t=0.3):
    return _mix(c,"#fff0d0",t)

def weapon_svg_detailed(h, female=False):
    steel="url(#blade)" if female else "url(#steel)"
    gold="url(#metal)" if female else "url(#gold)"
    accent=h["accent"]
    ink="#30271f" if female else "#191d1d"
    wood="#553a2b"
    w=h["weapon"]
    # Every weapon sits behind the drawing but uses the same material highlights and thick outline as the reference sprites.
    if w in ("spear","spear-long"):
        return f'''<g id="weapon">
<path d="M696 924 L696 160" stroke="{ink}" stroke-width="29" stroke-linecap="round"/><path d="M696 924 L696 160" stroke="{wood}" stroke-width="17" stroke-linecap="round"/><path d="M691 888 L691 270" stroke="{gold}" stroke-width="5" opacity=".75"/>
<path d="M696 58 Q650 126 696 224 Q742 126 696 58Z" fill="{steel}" stroke="{ink}" stroke-width="10"/><path d="M696 79 L696 204" stroke="#fff4df" stroke-width="8"/><path d="M664 187 L728 187 L716 225 L676 225Z" fill="{gold}" stroke="{ink}" stroke-width="7"/><path d="M696 221 L696 285" stroke="{accent}" stroke-width="8"/><path d="M663 290 Q696 316 729 290" fill="none" stroke="{gold}" stroke-width="7"/>
</g>'''
    if w in ("guandao","halberd"):
        blade='''<path d="M696 174 Q756 104 770 146 Q783 214 714 274 Q726 224 696 174Z"'''
        return f'''<g id="weapon">
<path d="M696 944 L696 170" stroke="{ink}" stroke-width="30" stroke-linecap="round"/><path d="M696 944 L696 170" stroke="{wood}" stroke-width="17" stroke-linecap="round"/><path d="M691 900 L691 288" stroke="{gold}" stroke-width="5" opacity=".8"/>
{blade} fill="{steel}" stroke="{ink}" stroke-width="10"/><path d="M710 178 Q753 143 758 155" fill="none" stroke="#fff4df" stroke-width="8"/><path d="M689 219 Q651 183 636 220 Q639 270 699 282" fill="{gold}" stroke="{ink}" stroke-width="8"/><path d="M679 262 L718 276 L705 305 L674 288Z" fill="{gold}" stroke="{ink}" stroke-width="6"/><path d="M696 301 L696 345" stroke="{accent}" stroke-width="9"/>
</g>'''
    if w in ("sword","saber"):
        return f'''<g id="weapon">
<path d="M696 610 L696 200" stroke="{ink}" stroke-width="25" stroke-linecap="round"/><path d="M696 590 L696 206 Q665 154 684 83 Q701 145 724 188 L707 590Z" fill="{steel}" stroke="{ink}" stroke-width="9"/><path d="M694 120 L700 550" stroke="#fff4df" stroke-width="7" opacity=".85"/><path d="M650 590 Q696 568 742 590 L734 615 Q696 642 658 615Z" fill="{gold}" stroke="{ink}" stroke-width="8"/><path d="M680 625 L711 625 L711 754 L680 754Z" fill="{wood}" stroke="{ink}" stroke-width="7"/><path d="M680 651 L711 678 M680 690 L711 717" stroke="{accent}" stroke-width="7"/><path d="M696 752 L696 782" stroke="{gold}" stroke-width="9"/>
</g>'''
    if w=="bow":
        return f'''<g id="weapon">
<path d="M704 136 Q826 473 704 850" fill="none" stroke="{ink}" stroke-width="25"/><path d="M704 136 Q826 473 704 850" fill="none" stroke="{wood}" stroke-width="15"/><path d="M704 136 L704 850" stroke="{steel}" stroke-width="5"/><path d="M704 136 L704 850" stroke="#fff4df" stroke-width="2"/><path d="M666 506 L792 465" stroke="{ink}" stroke-width="13"/><path d="M674 503 L785 467" stroke="{steel}" stroke-width="6"/><path d="M780 462 L821 454 L795 487Z" fill="{steel}" stroke="{ink}" stroke-width="5"/><path d="M703 220 L748 206 M703 757 L748 771" stroke="{gold}" stroke-width="9"/>
</g>'''
    if w in ("fan","scroll"):
        return f'''<g id="weapon">
<path d="M686 648 Q594 500 640 378 Q687 416 704 451 Q728 379 757 364 Q791 494 686 648Z" fill="{steel}" stroke="{ink}" stroke-width="9"/><path d="M686 648 L640 378 M686 648 L704 451 M686 648 L757 364 M686 648 L782 448" fill="none" stroke="{gold}" stroke-width="7"/><path d="M686 648 L694 754" stroke="{wood}" stroke-width="16" stroke-linecap="round"/><path d="M673 648 Q687 663 702 648" fill="none" stroke="{accent}" stroke-width="8"/>
</g>'''
    if w in ("dual-dagger","dual-blade","dual-axe"):
        return f'''<g id="weapon">
<path d="M654 540 L621 349 L662 404 L682 348 L688 540Z" fill="{steel}" stroke="{ink}" stroke-width="8"/><path d="M645 532 L693 542 L690 562 L642 555Z" fill="{gold}" stroke="{ink}" stroke-width="6"/><path d="M635 559 L665 590 L645 689 L619 675Z" fill="{wood}" stroke="{ink}" stroke-width="6"/>
<path d="M740 540 L710 349 L750 404 L771 348 L776 540Z" fill="{steel}" stroke="{ink}" stroke-width="8"/><path d="M728 532 L779 542 L776 562 L725 555Z" fill="{gold}" stroke="{ink}" stroke-width="6"/>
</g>'''
    if w=="axe":
        return f'''<g id="weapon">
<path d="M696 925 L696 184" stroke="{ink}" stroke-width="29"/><path d="M696 925 L696 184" stroke="{wood}" stroke-width="17"/><path d="M700 166 Q774 112 792 179 Q792 257 711 304 Q720 231 700 166Z" fill="{steel}" stroke="{ink}" stroke-width="10"/><path d="M715 180 Q766 150 778 177" fill="none" stroke="#fff4df" stroke-width="7"/><path d="M678 218 L720 232 L711 264 L674 249Z" fill="{gold}" stroke="{ink}" stroke-width="7"/>
</g>'''
    if w=="hammer":
        return f'''<g id="weapon">
<path d="M696 925 L696 188" stroke="{ink}" stroke-width="29"/><path d="M696 925 L696 188" stroke="{wood}" stroke-width="17"/><path d="M620 126 Q696 86 773 126 L780 260 Q696 298 612 260Z" fill="{steel}" stroke="{ink}" stroke-width="11"/><path d="M636 151 L756 151 M629 195 L763 195 M640 238 L752 238" stroke="{gold}" stroke-width="9"/><path d="M696 120 L696 270" stroke="{accent}" stroke-width="8"/>
</g>'''
    if w=="shield":
        return f'''<g id="weapon">
<path d="M696 290 Q778 268 814 316 L804 640 Q760 722 696 670 Q632 722 588 640 L578 316 Q614 268 696 290Z" fill="{steel}" stroke="{ink}" stroke-width="11"/><path d="M696 324 L696 667 M612 354 L780 354 M606 416 L786 416 M611 480 L781 480 M625 548 L767 548" stroke="{gold}" stroke-width="9"/><path d="M696 390 L731 458 L696 526 L661 458Z" fill="{accent}" stroke="{ink}" stroke-width="7"/>
</g>'''
    if w=="ribbon":
        return f'''<g id="weapon">
<path d="M690 624 Q814 530 762 390 Q721 286 804 176 M690 624 Q790 686 785 820" fill="none" stroke="{ink}" stroke-width="30" stroke-linecap="round"/><path d="M690 624 Q814 530 762 390 Q721 286 804 176 M690 624 Q790 686 785 820" fill="none" stroke="{accent}" stroke-width="18" stroke-linecap="round"/><path d="M690 624 Q814 530 762 390 Q721 286 804 176" fill="none" stroke="#fff0df" stroke-width="5"/>
</g>'''
    if w=="mechanism":
        return f'''<g id="weapon">
<path d="M696 925 L696 210" stroke="{ink}" stroke-width="24"/><path d="M696 925 L696 210" stroke="{wood}" stroke-width="14"/><path d="M620 220 L696 172 L773 220 L696 268Z" fill="{steel}" stroke="{ink}" stroke-width="9"/><circle cx="696" cy="220" r="27" fill="none" stroke="{gold}" stroke-width="10"/><circle cx="696" cy="220" r="8" fill="{accent}"/><path d="M696 183 L696 257 M658 220 L734 220" stroke="{gold}" stroke-width="6"/>
</g>'''
    return f'''<g id="weapon">
<path d="M696 925 L696 192" stroke="{ink}" stroke-width="27"/><path d="M696 925 L696 192" stroke="{wood}" stroke-width="16"/><path d="M696 108 Q650 161 696 222 Q742 161 696 108Z" fill="{steel}" stroke="{ink}" stroke-width="9"/><path d="M696 125 L696 207" stroke="#fff4df" stroke-width="6"/><path d="M672 232 L720 232" stroke="{gold}" stroke-width="8"/>
</g>'''

def apply_character_identity(source,h,base_slug):
    p=h["physique"]
    slug=h["slug"]
    female=h["gender"]=="f"
    dx=40 if base_slug=="guan-yu" else (15 if female else 0)
    brow=p.get("brows","平直略收")
    eyes=p.get("eyes","沉稳")
    brow_paths={
        "浓密倒八字":'<path d="M372 218 Q402 192 426 216 M454 216 Q483 191 508 218" fill="none" stroke="#211815" stroke-width="13" stroke-linecap="round"/>',
        "浓而压眼":'<path d="M372 220 Q405 195 429 218 M452 218 Q481 195 508 220" fill="none" stroke="#211815" stroke-width="12" stroke-linecap="round"/>',
        "剑眉":'<path d="M372 218 L426 205 L433 218 M452 218 L507 205 L512 218" fill="none" stroke="#2b211d" stroke-width="8" stroke-linecap="round"/>',
        "细长舒展":'<path d="M374 217 Q401 199 430 214 M451 214 Q480 199 506 217" fill="none" stroke="#332522" stroke-width="5" stroke-linecap="round"/>',
        "浓而斜":'<path d="M372 223 L425 202 M453 202 L507 223" fill="none" stroke="#211816" stroke-width="11" stroke-linecap="round"/>',
        "平直略收":'<path d="M374 214 Q404 205 430 214 M451 214 Q478 205 506 214" fill="none" stroke="#332522" stroke-width="7" stroke-linecap="round"/>',
        "细弯眉":'<path d="M376 216 Q402 195 431 215 M450 215 Q479 195 504 216" fill="none" stroke="#553b36" stroke-width="4" stroke-linecap="round"/>',
        "柔和弯眉":'<path d="M376 216 Q402 198 431 216 M450 216 Q478 198 504 216" fill="none" stroke="#73504a" stroke-width="4" stroke-linecap="round"/>',
        "短粗眉":'<path d="M377 217 L426 208 M454 208 L503 217" fill="none" stroke="#251b18" stroke-width="10" stroke-linecap="round"/>',
        "稀疏细长眉":'<path d="M376 216 Q404 209 429 216 M451 216 Q476 209 503 216" fill="none" stroke="#5d4b42" stroke-width="4" stroke-linecap="round"/>'
    }
    eye_marks={
        "丹凤眼、眼尾上挑":'<path d="M378 244 Q401 252 429 236 Q403 231 378 244Z M452 236 Q480 252 503 244 Q478 231 452 236Z" fill="none" stroke="#291d19" stroke-width="5"/>',
        "圆睁怒目":'<ellipse cx="404" cy="242" rx="16" ry="12" fill="none" stroke="#211a17" stroke-width="5"/><ellipse cx="478" cy="242" rx="16" ry="12" fill="none" stroke="#211a17" stroke-width="5"/>',
        "鹰视、眼窝深":'<path d="M379 244 Q404 226 430 245 Q406 259 379 244Z M451 245 Q478 226 503 244 Q477 259 451 245Z" fill="none" stroke="#2a201d" stroke-width="5"/><path d="M380 235 L429 229 M453 229 L502 235" stroke="#2a201d" stroke-width="4"/>',
        "冷峻审视":'<path d="M379 246 Q405 232 430 244 M451 244 Q477 232 503 246" fill="none" stroke="#2a211f" stroke-width="6"/>',
        "柔媚但有决断":'<path d="M378 245 Q404 229 430 245 Q405 257 378 245Z M451 245 Q477 229 503 245 Q477 257 451 245Z" fill="none" stroke="#61403e" stroke-width="4"/>'
    }
    marks=""
    if p.get("faceShape") in ("宽方脸","短宽脸","宽圆方脸","宽额方脸"):
        marks+='<path d="M365 260 Q378 287 402 296 M478 296 Q502 287 515 260" fill="none" stroke="#8d5a47" stroke-width="5" opacity=".45"/>'
    if slug in ("cao-cao","simayi","huang-zhong","huanggai"):
        marks+='<path d="M393 193 Q410 185 427 193 M453 193 Q471 185 488 193" fill="none" stroke="#936c56" stroke-width="3" opacity=".65"/>'
    if slug=="xiahou-dun":
        marks+='<path d="M453 226 Q478 211 504 228 L507 263 Q478 282 453 262Z" fill="#261d1b" stroke="#151313" stroke-width="5"/><path d="M454 226 L504 260" stroke="#b48b61" stroke-width="5"/>'
    elif slug=="dian-wei":
        marks+='<path d="M365 271 L382 284 M510 271 L493 284" stroke="#3a2924" stroke-width="7" stroke-linecap="round"/><path d="M382 188 L394 197 M477 197 L490 188" stroke="#211815" stroke-width="8"/>'
    elif slug=="weiyan":
        marks+='<path d="M469 254 L488 273 L476 293" fill="none" stroke="#9c5845" stroke-width="5"/><path d="M381 202 L422 214" stroke="#2a1f1b" stroke-width="7"/>'
    elif slug=="sunshangxiang":
        marks+='<path d="M380 218 L430 207 M450 207 L500 218" fill="none" stroke="#342422" stroke-width="7"/><path d="M385 246 Q405 232 430 244 M450 244 Q475 232 495 246" fill="none" stroke="#382321" stroke-width="5"/>'
    elif slug=="pangtong":
        marks+='<path d="M361 235 Q396 221 425 238 M455 238 Q485 221 518 235" fill="none" stroke="#261e19" stroke-width="9"/>'
    face=f'<g transform="translate({dx} 0)">{brow_paths.get(brow,brow_paths["平直略收"])}{eye_marks.get(eyes,"")}{marks}</g>'
    hstyle=p.get("headStyle","")
    crests={
        "凤翅紫金冠":'<path d="M402 113 Q384 61 350 45 Q355 102 397 142 M480 142 Q528 98 550 43 Q551 107 493 132" fill="#9d332f" stroke="#dfb56e" stroke-width="8"/><path d="M440 62 L456 20 L472 62" fill="none" stroke="#e8c579" stroke-width="9"/>',
        "黑铁双翎盔":'<path d="M392 116 Q348 57 331 47 Q340 117 401 149 M480 145 Q535 65 564 52 Q557 128 492 154" fill="#1b2428" stroke="#a68a56" stroke-width="8"/>',
        "银盔白翎":'<path d="M430 101 Q435 29 481 13 Q495 73 463 119Z" fill="#e1e6e5" stroke="#586b72" stroke-width="7"/><path d="M448 101 L478 38" stroke="#fff" stroke-width="5"/>',
        "西凉银盔红缨":'<path d="M434 104 Q435 28 482 18 Q501 79 464 127Z" fill="#d4d9d6" stroke="#574d3c" stroke-width="7"/><path d="M462 120 Q481 42 521 29 Q502 107 473 138Z" fill="#9c3030" stroke="#e2b76c" stroke-width="6"/>',
        "魏王冠":'<path d="M394 119 L402 64 L430 87 L442 41 L456 87 L482 64 L490 119Z" fill="#302d3a" stroke="#d0ae68" stroke-width="8"/><path d="M410 111 L474 111" stroke="#b78d4e" stroke-width="7"/>',
        "纶巾":'<path d="M390 124 Q405 71 442 73 Q479 71 494 124 Q441 143 390 124Z" fill="#d9d2bd" stroke="#665b4a" stroke-width="7"/>',
        "魏文帝冠":'<path d="M393 112 L405 62 L441 81 L476 62 L488 112Z" fill="#4b515b" stroke="#c6ab71" stroke-width="8"/>',
        "吴王冠":'<path d="M393 116 L405 64 L441 84 L476 64 L487 116Z" fill="#2e594f" stroke="#d7b66e" stroke-width="8"/>',
        "江东儒将冠":'<path d="M392 120 Q400 71 441 75 Q482 71 490 120 Q441 136 392 120Z" fill="#9d7960" stroke="#dfc185" stroke-width="7"/>',
        "锦帆头巾与铃饰":'<path d="M389 128 Q399 86 444 83 Q486 85 495 128" fill="none" stroke="#b18a50" stroke-width="12"/><g fill="#e1be70" stroke="#31251d" stroke-width="4"><circle cx="400" cy="125" r="8"/><circle cx="480" cy="125" r="8"/></g>',
        "凤钗高髻":'<path d="M452 84 Q492 33 522 57 Q510 97 471 115Z" fill="#b76c9d" stroke="#d6ba82" stroke-width="6"/><circle cx="466" cy="99" r="9" fill="#eddaa8"/>',
        "花钿与简洁高髻":'<g fill="#e3b0a8" stroke="#77536a" stroke-width="4"><circle cx="470" cy="106" r="12"/><circle cx="488" cy="92" r="7"/><circle cx="451" cy="88" r="7"/></g>',
        "双扇花饰与束发":'<path d="M455 98 Q500 38 525 69 Q503 108 469 124Z" fill="#d08f9b" stroke="#77536a" stroke-width="6"/>',
        "洛水珠冠":'<path d="M401 105 Q442 63 483 105" fill="none" stroke="#b7d8e5" stroke-width="9"/><g fill="#d7eef4"><circle cx="440" cy="75" r="8"/><circle cx="420" cy="86" r="6"/><circle cx="460" cy="86" r="6"/></g>',
        "机关师发冠与护目饰":'<path d="M395 111 L409 72 L441 87 L475 72 L489 111Z" fill="#74866c" stroke="#d1bb81" stroke-width="7"/><circle cx="442" cy="90" r="12" fill="none" stroke="#d9bc70" stroke-width="5"/>'
    }
    head=f'<g transform="translate({dx} 0)">{crests.get(hstyle,"")}</g>'
    outfit=""
    if slug=="sunshangxiang":
        source=re.sub(r'<g fill="none" stroke-linecap="round">.*?</g>',"",source,count=1,flags=re.S)
        outfit='''<g id="sunshangxiang-practical-archer" stroke-linejoin="round" stroke-linecap="round">
<path d="M333 637 Q391 654 439 637 L424 905 L388 959 L334 931Z M442 637 Q493 652 528 635 L467 931 L432 960 L421 904Z" fill="#29353b" stroke="#151b20" stroke-width="11"/>
<path d="M334 671 Q383 692 429 669 L414 733 Q376 748 343 724Z M444 669 Q488 692 526 668 L503 725 Q465 750 431 733Z" fill="#48575d" stroke="#bd9d65" stroke-width="8"/>
<path d="M328 374 Q398 349 469 374 L484 503 Q400 537 315 503Z" fill="#6b4841" stroke="#1d2325" stroke-width="12"/><path d="M344 390 Q400 367 456 390 L462 477 Q400 502 338 477Z" fill="#9a4946" stroke="#dfbd83" stroke-width="8"/><path d="M400 380 L400 498 M344 435 L456 435" stroke="#dfbd83" stroke-width="7"/>
<path d="M300 381 Q326 350 354 377 L366 451 L334 478 L298 439Z M446 377 Q474 350 501 381 L503 439 L467 478 L434 451Z" fill="#56666b" stroke="#1b2528" stroke-width="10"/>
<path d="M270 470 Q292 452 315 472 L300 550 L276 553Z M525 470 Q548 452 570 472 L564 553 L540 550Z" fill="#9d774d" stroke="#1a2226" stroke-width="9"/><path d="M278 490 L306 494 M544 490 L565 494" stroke="#ead19a" stroke-width="7"/>
<path d="M322 535 Q400 560 478 535 L470 607 Q400 635 330 607Z" fill="#4a3431" stroke="#1b2226" stroke-width="9"/><path d="M335 557 Q400 578 465 557 L458 591 Q400 611 342 591Z" fill="#b08b54" stroke="#2b2520" stroke-width="6"/>
<path d="M340 905 L390 920 L374 981 L316 976Z M432 920 L482 905 L508 976 L449 981Z" fill="#252a2c" stroke="#111719" stroke-width="10"/>
<path d="M318 971 L380 971 L385 995 L305 995Z M445 971 L509 971 L522 995 L438 995Z" fill="#1c2022" stroke="#8a6c43" stroke-width="8"/>
</g>'''
    source=source.replace("</svg>",face+head+outfit+"</svg>")
    sx=float(p.get("widthScale",1.0)); sy=float(p.get("heightScale",1.0))
    if not (0.72<=sx<=1.42 and 0.84<=sy<=1.12):
        raise ValueError(f"unsafe physique proportions for {slug}: {sx}/{sy}")
    wrap=f'<g transform="translate(400 1000) scale({sx:.4f} {sy:.4f}) translate(-400 -1000)">'
    defs_end=source.find("</defs>")+len("</defs>")
    end=source.rfind("</svg>")
    if defs_end<len("</defs>") or end<defs_end: raise ValueError(f"SVG definitions missing for {slug}")
    source=source[:end]+"</g>"+source[end:]
    source=source[:defs_end]+wrap+source[defs_end:]
    return source


def body_svg(h, index):
    female=h["gender"]=="f"
    if female:
        base_slug="diaochan"
    elif h.get("beard") in ("white","full","moustache","braid"):
        base_slug="zhang-fei"
    elif h.get("beard")=="long":
        base_slug="guan-yu"
    else:
        base_slug="liu-bei"
    source=(ART/(base_slug+".svg")).read_text(encoding="utf-8")
    # Preserve the approved three-men / Diao Chan illustration style: their exact silhouettes,
    # anatomy, layered armor, face construction, hands and line weights become the shared master.
    armor=h["armor"]; cloth=h["cloth"]; accent=h["accent"]
    if female:
        primary={
            "#f2d8df":_light(armor,.42),"#9d719d":armor,"#5d405f":_dark(armor,.24),"#2b263e":_dark(cloth,.18),
            "#dca6d2":_light(cloth,.42),"#9d6283":cloth,"#e7bad6":_light(armor,.30),"#a77aab":armor,
            "#f2d6e0":_light(armor,.32),"#d7a7c8":_light(cloth,.28),"#3d2943":_dark(cloth,.2),
            "#251f34":_dark(cloth,.34),"#37283c":_dark(cloth,.12),"#49344b":_dark(cloth,.08),
            "#4c3547":_dark(cloth,.15)
        }
    elif base_slug=="liu-bei":
        primary={
            "#ed9a70":_light(armor,.48),"#b64b38":armor,"#7b2b29":_dark(armor,.24),"#391b1d":_dark(cloth,.18),
            "#c25b45":_light(armor,.22),"#87352e":armor,"#3e2022":_dark(cloth,.22),"#e18b67":_light(armor,.36),
            "#d17759":_light(armor,.18),"#5a2928":_dark(armor,.28),"#8e3028":_dark(armor,.10),
            "#8e342e":armor,"#8b302a":_dark(armor,.2)
        }
    elif base_slug=="guan-yu":
        primary={
            "#b5d69a":_light(armor,.5),"#6b9d70":armor,"#28634c":_dark(armor,.2),"#102e2a":_dark(cloth,.18),
            "#527c5b":_light(armor,.2),"#244e40":_dark(armor,.28),"#0b2425":_dark(cloth,.24),"#76a878":_light(armor,.38),
            "#3d7956":armor,"#1d4c3c":_dark(armor,.26),"#102c2b":_dark(cloth,.12)
        }
    else:
        primary={
            "#8d9695":_light(armor,.38),"#47545a":armor,"#202b31":_dark(armor,.23),"#0b1419":_dark(cloth,.2),
            "#3e4a4d":_dark(armor,.08),"#1b252a":_dark(cloth,.12),"#29343a":_dark(armor,.22),"#111a1e":_dark(cloth,.28),
            "#080f14":_dark(cloth,.34),"#de805d":_light(armor,.25),"#8c332b":armor,"#401d20":_dark(armor,.24)
        }
    # Re-tint all original gold accents to the general's insignia color, retaining rich metallic highlights.
    gold_pairs={
        "#fff0b7":_light(accent,.70),"#e0bb70":_light(accent,.20),"#a67536":_dark(accent,.20),
        "#f1d68e":_light(accent,.38),"#6e4722":_dark(accent,.38),"#e6c77f":_light(accent,.16),
        "#ebcd88":_light(accent,.32),"#f6d99a":_light(accent,.42),"#f1d895":_light(accent,.35),
        "#fff1b0":_light(accent,.68),"#d9b76c":_light(accent,.18),"#a87936":_dark(accent,.18),
        "#f0d58c":_light(accent,.35),"#68441f":_dark(accent,.4),"#c59b54":_light(accent,.08),
        "#80602f":_dark(accent,.28),"#edcd84":_light(accent,.35),"#c48a42":_dark(accent,.08)
    }
    for old,new in {**primary,**gold_pairs}.items():
        source=source.replace(old,new)
    # Remove the template's signature weapon and insert the correct weapon for this general.
    if female:
        source=re.sub(r'<g><path d="M668 717.*?</g>',weapon_svg_detailed(h,True),source,count=1,flags=re.S)
    else:
        source=re.sub(r'<!--\s*(?:Twin swords behind the lord|polearm behind the body|long spear and iron head)\s*-->\s*<g>.*?</g>',
                      weapon_svg_detailed(h,False),source,count=1,flags=re.S|re.I)
    # Clean-shaven heroes do not inherit Liu Bei's moustache and short beard.
    if not female and h.get("beard") in ("clean","none"):
        source=re.sub(r'<!--\s*(?:neat moustache and short beard|moustache and legendary long beard|huge moustache and forked beard)\s*-->.*?(?=<!--|</svg>)',
                      "",source,count=1,flags=re.S|re.I)
    # An individual insignia is placed into the chest plate; silhouette and gold lamellar detail stay intact.
    fx=h.get("fx","")
    if fx in ("fire","phoenix","flame"):
        sigil=f'<path d="M440 510 Q409 544 436 575 Q472 552 440 510Z" fill="{accent}" stroke="#30241d" stroke-width="6"/><path d="M440 522 Q428 548 444 556" fill="none" stroke="#fff0c8" stroke-width="5"/>'
    elif fx in ("heal","shield"):
        sigil=f'<path d="M440 505 L473 540 L440 575 L407 540Z" fill="{accent}" stroke="#30241d" stroke-width="6"/><path d="M440 520 L440 560 M420 540 L460 540" stroke="#fff0c8" stroke-width="5"/>'
    elif fx in ("dragon","tiger","wind","storm","lightning","ironstorm","water"):
        sigil=f'<path d="M410 532 Q432 505 459 527 Q477 548 448 563 Q425 574 416 551 Q430 543 443 552 Q454 550 449 539" fill="none" stroke="{accent}" stroke-width="10" stroke-linecap="round"/><circle cx="460" cy="526" r="5" fill="#fff0c8"/>'
    elif fx in ("charm","ice"):
        sigil=f'<path d="M440 505 Q455 528 477 540 Q455 552 440 575 Q425 552 403 540 Q425 528 440 505Z" fill="{accent}" stroke="#30241d" stroke-width="6"/><circle cx="440" cy="540" r="8" fill="#fff0c8"/>'
    else:
        sigil=f'<path d="M440 506 L474 540 L440 574 L406 540Z" fill="{accent}" stroke="#30241d" stroke-width="6"/><path d="M440 516 L440 564 M416 540 L464 540" stroke="#fff0c8" stroke-width="5"/>'
    if female:
        accessory=h.get("head","")
        if accessory in ("flower","hairpin"):
            sigil_head=f'<g stroke="{accent}" stroke-width="5" fill="none"><circle cx="545" cy="168" r="16"/><circle cx="545" cy="168" r="5"/><path d="M545 143 L545 131 M520 168 L508 168 M570 168 L582 168"/></g>'
        elif accessory in ("ribbon","veil"):
            sigil_head=f'<path d="M520 165 Q600 130 620 205 Q580 197 550 225" fill="none" stroke="{accent}" stroke-width="12" stroke-linecap="round"/>'
        elif accessory in ("plume","phoenix"):
            sigil_head=f'<path d="M520 174 Q548 95 590 82 Q580 145 550 184Z" fill="{accent}" stroke="#30241f" stroke-width="6"/><path d="M545 164 L580 107" stroke="#fff2d9" stroke-width="5"/>'
        else:
            sigil_head=f'<path d="M520 157 Q560 123 594 157 L574 187 L535 187Z" fill="{accent}" stroke="#30241f" stroke-width="6"/>'
        source=source.replace("</svg>",sigil_head+sigil+"</svg>")
    else:
        source=source.replace("</svg>",sigil+"</svg>")
    source=apply_character_identity(source,h,base_slug)
    label=esc(h["name"])
    source=re.sub(r'<title>.*?</title>',f'<title>{label} · 2D 立绘</title>',source,count=1,flags=re.S)
    source=re.sub(r'<desc>.*?</desc>',f'<desc>按刘关张基准线稿绘制，结合史料与新三国演员身材参照；头脸、盔甲、武器和体态各自独立。</desc>',source,count=1,flags=re.S)
    return source

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
    if fx in ("dragon","tiger","wind","storm","lightning","ironstorm","water"):
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
                            atk=h["atk"],hp=h["hp"],energy=h["energy"],skill=h["skill"],desc=h["desc"],skillRange=h["skillRange"],
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
    write(ART/"physique-reference.json",json.dumps({"schemaVersion":1,"description":"Actor measurements are visual stand-ins, not historical measurements. Unknown measurements remain null.","characters":PHYSIQUE_DATA},ensure_ascii=False,indent=2))
    attack_count=len(list(ANIMS.glob("*-attack.svg")))
    skill_count=len(list(ANIMS.glob("*-skill.svg")))
    assert attack_count==50 and skill_count==50, (attack_count,skill_count)
    assert len({h["skill"] for h in ALL_ART})==50, "all fifty generals must have unique skill names"
    assert len({h["fx"] for h in ALL_ART})==50, "all fifty generals must have unique skill frame effects"
    print(f"Generated 50 generals ({manifest['male']} male, {manifest['female']} female), 50 portraits, 100 four-frame action sheets.")

if __name__=="__main__":
    main()
