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
    if brow not in brow_paths:
        if any(k in brow for k in ("浓","粗","厚","灰白")) and any(k in brow for k in ("挑","斜","上扬","外挑")):
            brow_paths[brow]=brow_paths["浓而斜"]
        elif any(k in brow for k in ("细","修长","长直","弯","舒展")):
            brow_paths[brow]=brow_paths["细长舒展"]
        elif any(k in brow for k in ("挑","上扬","外挑","高挑")):
            brow_paths[brow]=brow_paths["剑眉"]
        elif any(k in brow for k in ("浓","粗","厚","灰白")):
            brow_paths[brow]=brow_paths["短粗眉"]
        else:
            brow_paths[brow]=brow_paths["平直略收"]
    if eyes not in eye_marks:
        if any(k in eyes for k in ("圆睁","怒目","凶悍","勇猛","憨直")):
            eye_marks[eyes]=eye_marks["圆睁怒目"]
        elif any(k in eyes for k in ("鹰","锐利","冷峻","警觉","多疑","逼人","外放")):
            eye_marks[eyes]=eye_marks["鹰视、眼窝深"]
        elif any(k in eyes for k in ("温婉","温和","慈爱","柔媚","清亮","灵动","含蓄")):
            eye_marks[eyes]=eye_marks["柔媚但有决断"]
        else:
            eye_marks[eyes]=eye_marks["冷峻审视"]
    if any(k in p.get("faceShape","") for k in ("长脸","长方","长椭圆","窄长","清瘦","修长")):
        marks+='<path d="M370 255 Q376 290 402 306 M508 255 Q502 290 478 306" fill="none" stroke="#8d5a47" stroke-width="4" opacity=".42"/>'
    if any(k in p.get("faceShape","") for k in ("老年","苍老")) or slug in ("huang-zhong","huanggai","simayi"):
        marks+='<path d="M384 199 Q406 190 426 199 M454 199 Q475 190 495 199 M382 265 Q388 276 395 280 M502 265 Q496 276 489 280" fill="none" stroke="#8c6858" stroke-width="4" opacity=".65"/>'
    face=f'<g transform="translate({dx} 0)">{brow_paths[brow]}{eye_marks[eyes]}{marks}</g>'
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
    crests.update({
        "双戟护额铁盔":'<path d="M402 126 Q350 70 322 32 Q337 116 398 155 M480 155 Q542 84 568 35 Q565 122 490 148" fill="#343333" stroke="#c3a46c" stroke-width="9"/><path d="M422 100 L440 54 L458 100Z" fill="#8b473b" stroke="#171b1c" stroke-width="6"/>',
        "老将铁盔":'<path d="M383 131 Q390 64 444 60 Q500 64 510 131 L488 149 L405 149Z" fill="#8a9391" stroke="#393d3a" stroke-width="8"/><path d="M415 70 Q440 38 465 70" fill="none" stroke="#e4e3d9" stroke-width="11"/>',
        "蜀汉银青头盔":'<path d="M390 130 L405 60 L445 83 L483 60 L498 130Z" fill="#667f86" stroke="#d4c39b" stroke-width="8"/><path d="M444 83 Q465 20 500 14 Q505 73 459 117Z" fill="#d7ded9" stroke="#56656b" stroke-width="6"/>',
        "黑铁狼纹盔":'<path d="M385 132 Q396 63 445 65 Q496 63 507 132Z" fill="#252d32" stroke="#9d875f" stroke-width="8"/><path d="M400 109 L445 73 L490 109 L445 135Z" fill="#4a5254" stroke="#161c20" stroke-width="6"/><path d="M420 105 L445 85 L470 105" fill="none" stroke="#c6a768" stroke-width="5"/>',
        "略旧的谋士巾冠":'<path d="M390 125 Q405 86 445 88 Q480 87 494 125 L480 141 L405 141Z" fill="#625c4d" stroke="#b79c6d" stroke-width="6"/><path d="M398 121 L484 121" stroke="#3c3b35" stroke-width="5"/>',
        "低调文士冠":'<path d="M397 127 Q408 82 445 85 Q481 82 492 127 L480 138 L408 138Z" fill="#3c4d47" stroke="#c8ad76" stroke-width="6"/>',
        "简式头巾":'<path d="M390 132 Q406 88 445 93 Q484 88 500 132" fill="none" stroke="#54534b" stroke-width="13"/><path d="M405 115 L483 115" stroke="#b79f6d" stroke-width="4"/>',
        "青龙纹青年盔":'<path d="M390 129 L405 68 L445 83 L485 68 L500 129Z" fill="#3d725d" stroke="#d2b66e" stroke-width="8"/><path d="M445 96 Q475 45 510 59 Q493 107 456 125Z" fill="#77a98b" stroke="#d2b66e" stroke-width="5"/>',
        "青色羽翎盔":'<path d="M390 128 L408 69 L445 85 L482 69 L500 128Z" fill="#3c6b69" stroke="#c9ad6d" stroke-width="8"/><path d="M450 100 Q465 36 505 27 Q506 92 464 127Z" fill="#7aaeb2" stroke="#d7c18d" stroke-width="5"/>',
        "虎纹重盔":'<path d="M385 130 Q398 58 445 61 Q495 58 508 130Z" fill="#34383b" stroke="#c29a5a" stroke-width="9"/><path d="M400 78 L420 112 L445 82 L470 112 L491 78" fill="none" stroke="#c49a5e" stroke-width="7"/>',
        "魏军双翎盔":'<path d="M395 130 Q405 63 445 67 Q490 63 500 130Z" fill="#383b43" stroke="#b99b67" stroke-width="8"/><path d="M410 100 Q360 44 350 22 Q395 43 433 111 M460 111 Q514 43 542 24 Q531 87 480 129" fill="#4b5966" stroke="#c6ad77" stroke-width="7"/>',
        "华丽羽翎盔":'<path d="M390 130 Q402 62 445 68 Q490 62 500 130Z" fill="#4a5b63" stroke="#c6a66d" stroke-width="8"/><path d="M445 111 Q440 35 485 12 Q510 72 461 130Z" fill="#a4c0c0" stroke="#d4bd86" stroke-width="6"/>',
        "朴实重甲盔":'<path d="M386 130 Q398 62 445 65 Q492 62 505 130Z" fill="#4f5958" stroke="#a98e62" stroke-width="8"/><path d="M400 115 L490 115 M445 68 L445 133" stroke="#d0b175" stroke-width="6"/>',
        "重型铁盔":'<path d="M378 137 Q390 47 445 52 Q500 47 512 137 L490 157 L400 157Z" fill="#343a3b" stroke="#ad956b" stroke-width="10"/><path d="M400 80 L490 80 M445 54 L445 158" stroke="#d0b47a" stroke-width="7"/>',
        "深蓝重盔":'<path d="M380 132 Q394 57 445 61 Q497 57 510 132Z" fill="#26384a" stroke="#c5a56c" stroke-width="8"/><path d="M410 94 L445 67 L480 94" fill="none" stroke="#9cb3bb" stroke-width="7"/>',
        "轻骑弓盔":'<path d="M395 130 Q405 69 445 77 Q485 69 495 130Z" fill="#65746d" stroke="#c6a86d" stroke-width="7"/><path d="M445 90 L475 34 L488 92Z" fill="#c7d0c7" stroke="#5b6b67" stroke-width="5"/>',
        "轻便文士冠":'<path d="M394 126 Q406 88 445 89 Q484 88 496 126 L483 140 L407 140Z" fill="#686e68" stroke="#d0bb8c" stroke-width="6"/>',
        "魏国文臣冠":'<path d="M394 125 Q407 82 445 84 Q483 82 496 125 L482 140 L408 140Z" fill="#4d5259" stroke="#d1b77b" stroke-width="6"/><path d="M408 113 L482 113" stroke="#b99a62" stroke-width="5"/>',
        "魏军重盔":'<path d="M380 135 Q393 54 445 58 Q497 54 510 135Z" fill="#3d4147" stroke="#b79a68" stroke-width="9"/><path d="M397 115 L493 115" stroke="#b99a68" stroke-width="7"/>',
        "江东小霸王羽冠":'<path d="M393 126 Q406 76 445 80 Q485 76 498 126Z" fill="#8e4540" stroke="#d8b778" stroke-width="7"/><path d="M446 100 Q465 35 510 30 Q500 92 457 128Z" fill="#d5b66e" stroke="#6f4235" stroke-width="5"/>',
        "吴军轻甲盔":'<path d="M393 130 Q405 72 445 79 Q485 72 497 130Z" fill="#48695f" stroke="#d3b878" stroke-width="7"/>',
        "东莱武将盔":'<path d="M385 132 Q398 55 445 60 Q495 55 508 132Z" fill="#3a4b51" stroke="#c3a06c" stroke-width="8"/><path d="M405 110 L445 73 L485 110" fill="none" stroke="#d1b77c" stroke-width="6"/>',
        "江东文臣冠":'<path d="M395 125 Q405 84 445 85 Q485 84 495 125Z" fill="#48675e" stroke="#d2bb83" stroke-width="6"/>'
    })
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


def female_hero_svg(h):
    p=h["physique"]; slug=h["slug"]; accent=h["accent"]; armor=h["armor"]; cloth=h["cloth"]
    sx=float(p.get("widthScale",1.0)); sy=float(p.get("heightScale",1.0))
    if not (0.72<=sx<=1.42 and 0.84<=sy<=1.12): raise ValueError(f"unsafe female physique for {slug}: {sx}/{sy}")
    fighter=slug in ("sunshangxiang","wangyi","mayunlu")
    engineer=slug=="huangyueying"
    skin="#f0c6ae"; hair="#161820"; ink="#211d20"
    palettes={
      "sunshangxiang":("#873b36","#293943","#d4b06f","#70443b"),
      "wangyi":("#713d43","#27313a","#caa46a","#493b3c"),
      "mayunlu":("#9c4541","#526d78","#ded6bf","#495159"),
      "huangyueying":("#7b835e","#3c554f","#d4b77a","#594b3b"),
      "daqiao":("#7c9e9a","#d1b89e","#e5d2a4","#a7b9b2"),
      "xiaoqiao":("#bd756d","#63495d","#e4c17e","#bd8e8a"),
      "zhenji":("#8baebb","#dbe8e8","#d9cda9","#a8d1df"),
      "ganfuren":("#8a9276","#c6b99c","#cdbb88","#8b816b")
    }
    armor,cloth,accent,hair=palettes.get(slug,(armor,cloth,accent,hair))
    if slug=="sunshangxiang":
        hair_markup=f'<path d="M365 173 Q370 80 445 79 Q525 79 542 180 L520 260 Q500 315 470 326 L480 190 Q450 142 410 181 L395 280 Q360 260 365 173Z" fill="{hair}" stroke="{ink}" stroke-width="10"/><path d="M486 110 Q557 50 606 91 Q570 128 530 164" fill="none" stroke="{hair}" stroke-width="25" stroke-linecap="round"/><path d="M545 104 Q585 44 619 58" fill="none" stroke="'+accent+'" stroke-width="9"/>'
    elif slug=="wangyi":
        hair_markup=f'<path d="M365 173 Q370 80 445 79 Q525 79 542 180 L520 260 Q500 315 470 326 L480 190 Q450 142 410 181 L395 280 Q360 260 365 173Z" fill="{hair}" stroke="{ink}" stroke-width="10"/><path d="M515 155 Q580 230 560 365 Q545 470 600 520 Q520 485 510 395 L492 254" fill="none" stroke="{hair}" stroke-width="26" stroke-linecap="round"/>'
    elif slug=="mayunlu":
        hair_markup=f'<path d="M365 173 Q370 80 445 79 Q525 79 542 180 L520 260 Q500 315 470 326 L480 190 Q450 142 410 181 L395 280 Q360 260 365 173Z" fill="{hair}" stroke="{ink}" stroke-width="10"/><path d="M492 102 Q545 45 585 75 Q555 125 520 150" fill="none" stroke="{hair}" stroke-width="24" stroke-linecap="round"/>'
    elif slug=="huangyueying":
        hair_markup=f'<path d="M365 173 Q370 80 445 79 Q525 79 542 180 L520 260 Q500 315 470 326 L480 190 Q450 142 410 181 L395 280 Q360 260 365 173Z" fill="{hair}" stroke="{ink}" stroke-width="10"/><path d="M400 112 Q410 40 480 48 Q530 53 536 112" fill="none" stroke="{hair}" stroke-width="22"/><g fill="none" stroke="{accent}" stroke-width="7"><circle cx="510" cy="98" r="20"/><path d="M510 70 L510 126 M482 98 L538 98"/></g>'
    elif slug=="daqiao":
        hair_markup=f'<path d="M365 173 Q370 80 445 79 Q525 79 542 180 L520 260 Q500 315 470 326 L480 190 Q450 142 410 181 L395 280 Q360 260 365 173Z" fill="{hair}" stroke="{ink}" stroke-width="10"/><path d="M410 97 Q430 42 480 61 Q520 72 527 113" fill="none" stroke="{hair}" stroke-width="23"/><g fill="{accent}" stroke="#6a584a" stroke-width="4"><circle cx="512" cy="106" r="12"/><path d="M512 75 L512 55 M490 105 L474 90 M532 105 L550 90" fill="none"/></g>'
    elif slug=="xiaoqiao":
        hair_markup=f'<path d="M365 173 Q370 80 445 79 Q525 79 542 180 L520 260 Q500 315 470 326 L480 190 Q450 142 410 181 L395 280 Q360 260 365 173Z" fill="{hair}" stroke="{ink}" stroke-width="10"/><circle cx="376" cy="131" r="34" fill="{hair}" stroke="{ink}" stroke-width="8"/><circle cx="528" cy="131" r="34" fill="{hair}" stroke="{ink}" stroke-width="8"/><path d="M358 104 Q330 73 320 100 M546 103 Q576 75 590 103" fill="none" stroke="{accent}" stroke-width="9"/>'
    elif slug=="zhenji":
        hair_markup=f'<path d="M365 173 Q370 80 445 79 Q525 79 542 180 L520 260 Q500 315 470 326 L480 190 Q450 142 410 181 L395 280 Q360 260 365 173Z" fill="{hair}" stroke="{ink}" stroke-width="10"/><path d="M522 170 Q604 280 566 485" fill="none" stroke="{hair}" stroke-width="25" stroke-linecap="round"/><path d="M394 98 Q440 35 490 85" fill="none" stroke="{accent}" stroke-width="10"/><g fill="#cce5ec" stroke="#768f9a" stroke-width="4"><circle cx="444" cy="86" r="12"/><circle cx="467" cy="78" r="8"/></g>'
    else:
        hair_markup=f'<path d="M365 173 Q370 80 445 79 Q525 79 542 180 L520 260 Q500 315 470 326 L480 190 Q450 142 410 181 L395 280 Q360 260 365 173Z" fill="{hair}" stroke="{ink}" stroke-width="10"/><path d="M410 98 Q440 65 480 78" fill="none" stroke="{hair}" stroke-width="20"/><g fill="{accent}" stroke="#655744" stroke-width="3"><circle cx="510" cy="108" r="8"/><circle cx="525" cy="93" r="5"/></g>'
    face=f'<path d="M365 222 Q370 120 447 112 Q523 118 540 223 L525 295 Q504 347 450 361 Q397 346 379 294Z" fill="url(#skin)" stroke="#704936" stroke-width="9"/><path d="M390 243 Q412 225 433 242 M466 242 Q489 225 511 243" fill="none" stroke="{ink}" stroke-width="6" stroke-linecap="round"/><path d="M391 261 Q413 270 434 261 Q413 250 391 261Z M466 261 Q489 270 511 261 Q489 250 466 261Z" fill="#fff0df"/><ellipse cx="413" cy="262" rx="4" ry="6" fill="#281d20"/><ellipse cx="489" cy="262" rx="4" ry="6" fill="#281d20"/><path d="M451 266 L442 294 Q451 299 461 293 M435 315 Q452 324 470 315" fill="none" stroke="#a9695b" stroke-width="4"/>'
    if slug in ("sunshangxiang","wangyi","mayunlu"):
        clothes=f'''
<path d="M335 635 L390 625 L380 896 L344 942 L303 935Z M455 625 L515 635 L546 935 L505 942 L470 896Z" fill="#303a41" stroke="{ink}" stroke-width="11"/>
<path d="M330 680 L390 670 L380 744 L326 738Z M458 670 L520 680 L523 738 L470 744Z" fill="{_light(armor,.20)}" stroke="{accent}" stroke-width="7"/>
<path d="M320 890 L389 905 L371 970 L300 972Z M467 905 L536 890 L559 972 L488 970Z" fill="#273139" stroke="{ink}" stroke-width="10"/>
<path d="M305 962 L380 962 L385 994 L290 994Z M485 962 L560 962 L570 994 L475 994Z" fill="#171e23" stroke="{accent}" stroke-width="7"/>
<path d="M335 365 Q400 335 465 365 L485 538 Q400 585 315 538Z" fill="{cloth}" stroke="{ink}" stroke-width="12"/>
<path d="M350 388 Q400 365 450 388 L462 498 Q400 535 338 498Z" fill="{armor}" stroke="{accent}" stroke-width="9"/>
<path d="M400 375 L400 526 M350 442 L450 442 M354 489 L446 489" fill="none" stroke="{accent}" stroke-width="7"/>
<path d="M300 374 Q328 345 355 376 L370 454 L342 493 L292 439Z M445 376 Q474 345 501 374 L509 439 L462 493 L432 454Z" fill="{_dark(armor,.15)}" stroke="{ink}" stroke-width="10"/>
<path d="M285 465 L315 478 L300 552 L270 546Z M520 465 L550 478 L565 546 L535 552Z" fill="{_light(armor,.12)}" stroke="{ink}" stroke-width="8"/>
<path d="M320 548 Q400 576 480 548 L468 606 Q400 633 332 606Z" fill="#473b32" stroke="{ink}" stroke-width="9"/><path d="M338 561 Q400 580 462 561" fill="none" stroke="{accent}" stroke-width="8"/>
<path d="M354 420 Q398 395 446 420" fill="none" stroke="#fff0d0" stroke-width="4" opacity=".7"/>
'''
        if slug=="sunshangxiang":
            clothes+=f'<path d="M328 398 L355 386 L370 506 L340 516Z M430 386 L463 398 L450 516 L420 506Z" fill="#58656a" stroke="{ink}" stroke-width="7"/><path d="M342 426 L365 438 M430 438 L455 426" stroke="{accent}" stroke-width="6"/>'
        elif slug=="wangyi":
            clothes+=f'<path d="M345 360 L455 360 L475 510 L400 550 L325 510Z" fill="none" stroke="{accent}" stroke-width="7"/><path d="M360 390 L440 500 M440 390 L360 500" stroke="{accent}" stroke-width="5"/>'
        else:
            clothes+=f'<path d="M330 405 Q400 345 470 405 L485 520 L400 563 L315 520Z" fill="none" stroke="#e6e8dc" stroke-width="6"/><path d="M370 390 L430 540" stroke="{accent}" stroke-width="7"/>'
    elif engineer:
        clothes=f'''
<path d="M340 625 L405 640 L390 910 L350 952 L310 938Z M450 640 L510 625 L545 938 L505 952 L470 910Z" fill="#465348" stroke="{ink}" stroke-width="10"/>
<path d="M305 940 L386 940 L390 988 L295 988Z M482 940 L562 940 L574 988 L477 988Z" fill="#29332e" stroke="{accent}" stroke-width="7"/>
<path d="M330 365 Q400 330 470 365 L485 565 Q400 608 315 565Z" fill="{cloth}" stroke="{ink}" stroke-width="11"/>
<path d="M350 390 Q400 365 450 390 L460 515 Q400 552 340 515Z" fill="{armor}" stroke="{accent}" stroke-width="8"/>
<path d="M400 375 L400 540 M350 450 L450 450" stroke="{accent}" stroke-width="7"/>
<path d="M300 382 Q330 345 356 375 L370 475 L338 500 L290 440Z M444 375 Q472 345 500 382 L510 440 L462 500 L430 475Z" fill="{_dark(armor,.15)}" stroke="{ink}" stroke-width="10"/>
<path d="M315 540 L485 540 L475 630 L325 630Z" fill="#5d5744" stroke="{ink}" stroke-width="8"/><g fill="none" stroke="{accent}" stroke-width="7"><circle cx="360" cy="578" r="20"/><circle cx="435" cy="578" r="27"/><path d="M435 542 L435 614 M399 578 L471 578"/></g>
'''
    else:
        dress="#718f89" if slug=="daqiao" else "#b86f74" if slug=="xiaoqiao" else "#d5e4e6" if slug=="zhenji" else "#b9b39a"
        dress2="#e4d3b5" if slug=="daqiao" else "#e4bb83" if slug=="xiaoqiao" else "#f2f3ea" if slug=="zhenji" else "#ded1b8"
        clothes=f'''
<path d="M355 360 Q400 330 455 360 L500 545 Q555 745 610 918 Q525 967 450 928 Q385 970 280 925 Q330 720 300 545Z" fill="{dress}" stroke="{ink}" stroke-width="11"/>
<path d="M365 380 Q410 357 450 380 L470 560 Q430 690 410 900 L330 910 Q370 690 340 550Z" fill="{dress2}" stroke="{accent}" stroke-width="7"/>
<path d="M455 385 Q490 420 492 565 L570 900 L505 928 Q475 715 432 570Z" fill="{_dark(dress,.16)}" stroke="{accent}" stroke-width="7"/>
<path d="M330 380 Q350 355 385 380 L405 500 Q380 570 345 550 L300 470Z M455 380 Q485 350 510 380 L560 470 L520 550 Q485 570 460 500Z" fill="{dress}" stroke="{ink}" stroke-width="10"/>
<path d="M330 568 Q400 600 510 568 L520 625 Q410 666 320 625Z" fill="{_dark(dress,.2)}" stroke="{accent}" stroke-width="8"/><path d="M400 600 L435 615 L430 662 L395 650Z" fill="{accent}" stroke="{ink}" stroke-width="5"/>
'''
        if slug=="daqiao":
            clothes+=f'<path d="M305 515 Q210 500 180 700 Q215 735 270 720 L352 600 M510 510 Q610 490 650 690 Q615 735 555 710 L470 600" fill="none" stroke="{dress2}" stroke-width="24" stroke-linecap="round"/><path d="M300 530 Q220 510 190 690 M515 530 Q600 510 640 685" fill="none" stroke="{accent}" stroke-width="4"/>'
        elif slug=="xiaoqiao":
            clothes+=f'<path d="M340 365 Q400 335 460 365 L480 520 L400 556 L320 520Z" fill="{dress2}" stroke="{accent}" stroke-width="8"/><path d="M365 415 Q400 450 435 415" fill="none" stroke="{accent}" stroke-width="7"/>'
        elif slug=="zhenji":
            clothes+=f'<path d="M340 364 Q400 330 460 364 L480 530 Q400 568 320 530Z" fill="{dress2}" stroke="{accent}" stroke-width="8"/><path d="M370 370 Q400 430 430 370 M330 690 Q400 745 490 690" fill="none" stroke="#fff" stroke-width="7"/><path d="M565 440 Q650 510 700 650" fill="none" stroke="#bfe0e7" stroke-width="12"/>'
        else:
            clothes+=f'<path d="M350 385 Q400 365 450 385 L462 520 Q400 550 338 520Z" fill="{dress2}" stroke="{accent}" stroke-width="7"/><path d="M400 390 L400 530 M350 458 L450 458" stroke="{accent}" stroke-width="5"/>'
    weapon=""
    if slug=="sunshangxiang":
        weapon=f'<g><path d="M455 486 L610 486 L650 516 L610 546 L455 546Z" fill="#66523e" stroke="{ink}" stroke-width="9"/><path d="M468 498 L603 498 L628 516 L603 534 L468 534Z" fill="#c5a66d" stroke="{ink}" stroke-width="6"/><path d="M488 486 Q535 430 610 486 M488 546 Q535 600 610 546" fill="none" stroke="#dce7e8" stroke-width="8"/><path d="M454 516 L650 516" stroke="#fff" stroke-width="5"/><path d="M585 470 L585 562" stroke="{accent}" stroke-width="6"/><path d="M482 474 L482 558 M497 474 L497 558" stroke="{ink}" stroke-width="5"/></g>'
    elif slug=="wangyi":
        weapon=f'<g stroke="{ink}" stroke-width="8"><path d="M270 590 L205 425 Q198 390 225 390 Q250 405 248 440 L295 550Z" fill="#d8e0df"/><path d="M550 590 L615 425 Q622 390 595 390 Q570 405 572 440 L525 550Z" fill="#d8e0df"/><path d="M245 545 L290 570 M555 570 L600 545" stroke="{accent}" stroke-width="11"/></g>'
    elif slug=="mayunlu":
        weapon=f'<g><path d="M680 940 L680 170" stroke="#4b3429" stroke-width="19"/><path d="M680 85 Q630 150 680 240 Q730 150 680 85Z" fill="#dce5e6" stroke="{ink}" stroke-width="9"/><path d="M680 110 L680 220" stroke="#fff" stroke-width="6"/><path d="M650 225 L710 225" stroke="{accent}" stroke-width="11"/></g>'
    elif slug=="daqiao":
        weapon=f'<g><path d="M610 620 Q555 500 635 380 Q755 510 610 620Z" fill="#e3e9df" stroke="{ink}" stroke-width="8"/><path d="M610 620 L635 380 M610 620 L690 430" stroke="{accent}" stroke-width="6"/><path d="M610 620 L622 760" stroke="#684b3c" stroke-width="14"/></g>'
    elif slug=="xiaoqiao":
        weapon=f'<g><path d="M285 610 Q220 500 300 385 Q410 505 285 610Z M600 610 Q535 500 615 385 Q725 505 600 610Z" fill="#dfb5a0" stroke="{ink}" stroke-width="8"/><path d="M285 610 L300 385 M600 610 L615 385" stroke="{accent}" stroke-width="7"/></g>'
    elif slug=="zhenji":
        weapon=f'<g fill="none" stroke="#b9dfe8" stroke-width="15" stroke-linecap="round"><path d="M600 520 Q760 400 720 260 Q700 210 755 165"/><path d="M610 560 Q745 520 775 410"/></g>'
    elif slug=="huangyueying":
        weapon=f'<g><circle cx="680" cy="510" r="62" fill="none" stroke="{accent}" stroke-width="13"/><circle cx="680" cy="510" r="25" fill="none" stroke="{ink}" stroke-width="8"/><path d="M680 430 L680 590 M600 510 L760 510 M625 455 L735 565 M735 455 L625 565" stroke="{accent}" stroke-width="8"/></g>'
    else:
        weapon=f'<g><path d="M630 650 Q540 500 630 370 Q730 500 630 650Z" fill="#e4d9bd" stroke="{ink}" stroke-width="8"/><path d="M630 650 L630 780" stroke="{accent}" stroke-width="9"/></g>'
    hands=f'<path d="M303 505 Q280 515 281 548 Q290 568 314 559 L330 535Z M488 535 Q503 517 527 528 L540 551 Q530 575 505 565Z" fill="url(#skin)" stroke="#855746" stroke-width="7"/>'
    legs=f'<path d="M350 910 L397 920 L381 970 L317 970Z M448 920 L497 910 L530 970 L467 970Z" fill="#252a2c" stroke="{ink}" stroke-width="9"/><path d="M315 966 L390 966 L395 995 L300 995Z M465 966 L540 966 L555 995 L455 995Z" fill="#1e2325" stroke="{accent}" stroke-width="7"/>'
    accent_detail=f'<g fill="{accent}" stroke="{ink}" stroke-width="4"><circle cx="354" cy="425" r="6"/><circle cx="446" cy="425" r="6"/><path d="M400 420 L400 535" fill="none" stroke="#f4d9a4" stroke-width="4"/></g>'
    crest=""
    if slug=="sunshangxiang": crest=f'<path d="M420 95 Q430 20 470 15 Q490 70 458 122Z" fill="#a23b32" stroke="{accent}" stroke-width="8"/>'
    elif slug=="mayunlu": crest=f'<path d="M420 95 Q430 20 470 15 Q490 70 458 122Z" fill="#a23b32" stroke="{accent}" stroke-width="8"/>'
    elif slug=="wangyi": crest=f'<path d="M405 92 L440 50 L475 92 L455 130 L425 130Z" fill="#9b4f48" stroke="{accent}" stroke-width="7"/>'
    elif slug=="huangyueying": crest=f'<circle cx="450" cy="88" r="26" fill="none" stroke="{accent}" stroke-width="7"/>'
    elif slug=="zhenji": crest=f'<path d="M410 104 Q450 45 490 104" fill="none" stroke="#dff6fa" stroke-width="9"/>'
    elif slug in ("daqiao","xiaoqiao"): crest=f'<g fill="{accent}" stroke="#705443" stroke-width="4"><circle cx="450" cy="92" r="12"/><circle cx="426" cy="82" r="7"/><circle cx="474" cy="82" r="7"/></g>'
    else: crest=f'<path d="M414 100 Q450 68 486 100" fill="none" stroke="{accent}" stroke-width="8"/>'
    sx,sy=float(p.get("widthScale",1)),float(p.get("heightScale",1))
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
<title>{esc(h["name"])} · 2D 立绘</title>
<desc>以貂蝉的精细线条和材质为基础，按角色身份单独设计服装、发式、武器和体态。</desc>
<defs>
<linearGradient id="armor" x1="0" y1="0" x2="1" y2="1"><stop stop-color="{_light(armor,.34)}"/><stop offset=".38" stop-color="{armor}"/><stop offset="1" stop-color="{_dark(armor,.35)}"/></linearGradient>
<linearGradient id="cloth" x1="0" y1="0" x2="1" y2="1"><stop stop-color="{_light(cloth,.38)}"/><stop offset=".55" stop-color="{cloth}"/><stop offset="1" stop-color="{_dark(cloth,.30)}"/></linearGradient>
<linearGradient id="skin" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#ffe0bd"/><stop offset=".42" stop-color="#f0c5ae"/><stop offset="1" stop-color="#8e5744"/></linearGradient>
<linearGradient id="steel" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fffdf0"/><stop offset=".4" stop-color="#b8c7c9"/><stop offset="1" stop-color="#53656a"/></linearGradient>
</defs>
<ellipse cx="430" cy="960" rx="220" ry="24" fill="#0d1118" opacity=".22"/>
{weapon if slug!="sunshangxiang" else ""}
<path d="M350 370 Q275 392 238 555 L250 880 Q315 944 400 915 Q485 944 550 880 L566 555 Q520 392 450 370Z" fill="{_dark(cloth,.17)}" stroke="{ink}" stroke-width="12" opacity="{.9 if not fighter and not engineer else .12}"/>
{clothes}
{legs}
<path d="M340 374 Q310 405 300 490 L280 570 Q300 590 330 570 L367 470 M460 374 Q500 400 520 490 L540 570 Q520 590 490 570 L453 470" fill="none" stroke="{ink}" stroke-width="28" stroke-linecap="round"/>
<path d="M340 374 Q310 405 300 490 L280 570 Q300 590 330 570 L367 470 M460 374 Q500 400 520 490 L540 570 Q520 590 490 570 L453 470" fill="none" stroke="{_light(armor,.18)}" stroke-width="17" stroke-linecap="round"/>
{hands}
{weapon if slug=="sunshangxiang" else ""}
<path d="M360 330 L360 390 Q400 415 490 390 L490 330Z" fill="url(#skin)" stroke="#704936" stroke-width="7"/>
{hair_markup}
{face}
{crest}
{accent_detail}
</svg>'''

def body_svg(h, index):
    female=h["gender"]=="f"
    if female and h["slug"]!="diaochan":
        return female_hero_svg(h)
    if female:
        base_slug="diaochan"
    elif h.get("beard") in ("white","full","moustache","braid") or float(h.get("physique",{}).get("widthScale",1.0))>=1.12:
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
    # Each hero gets a chest insignia tied to their own skill silhouette, not a shared diamond badge.
    fx=h.get("fx","")
    if fx in SPECIAL_SKILL_PATHS:
        sigil=f'<g transform="translate(400 540) scale(.13) translate(-400 -500)" fill="none" stroke="{accent}" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"><path d="{SPECIAL_SKILL_PATHS[fx]}"/><circle cx="400" cy="500" r="70" stroke="#fff0c8" stroke-width="25" opacity=".75"/></g>'
    else:
        sigil=f'<path d="M440 506 L474 540 L440 574 L406 540Z" fill="{accent}" stroke="#30241d" stroke-width="6"/>'
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
    a=[.10,.48,1,.32][frame]; w=h["weapon"]; c=h["accent"]
    width=16 if frame==2 else 10
    if w in ("spear","spear-long"):
        p=["M310 520 L690 390 M650 360 L720 380 L668 425","M285 500 L730 340 M682 310 L752 330 L700 375","M245 485 L755 315 M700 285 L780 300 L722 352","M300 510 L690 390"][frame]
    elif w=="guandao":
        p=["M250 625 Q380 350 670 405","M200 610 Q390 280 710 405","M160 570 Q400 235 740 405","M240 620 Q420 330 680 410"][frame]
    elif w=="halberd":
        p=["M330 670 Q530 350 700 280","M270 680 Q560 300 740 260","M230 700 Q600 250 770 220","M330 665 Q520 360 700 300"][frame]
    elif w in ("sword","saber"):
        p=["M270 670 L600 350","M220 700 L650 285","M175 710 L700 240","M280 675 L610 355"][frame]
    elif w=="bow":
        p=["M590 440 L750 410 M620 470 L780 430","M560 455 L770 395 M580 490 L800 425","M520 430 L790 350 M545 470 L810 390","M585 445 L760 410"][frame]
    elif w=="crossbow":
        p=["M600 480 L760 465","M550 475 L780 430 M550 510 L780 465","M500 455 L805 390 M500 495 L805 430 M500 535 L805 470","M575 480 L770 435"][frame]
    elif w=="fan":
        p=["M470 600 Q640 330 735 520","M430 620 Q650 280 770 520 M450 640 Q690 380 760 610","M400 640 Q660 240 800 520 M415 660 Q700 350 790 640","M465 600 Q645 350 740 525"][frame]
    elif w=="scroll":
        p=["M520 430 Q670 330 750 440","M500 420 Q660 280 780 430 M500 560 Q680 670 780 550","M470 400 Q680 240 810 410 M470 590 Q690 760 810 580","M520 440 Q670 340 750 450"][frame]
    elif w in ("dual-dagger","dual-blade"):
        p=["M245 430 Q390 320 520 435 M320 620 Q465 720 610 575","M210 410 Q410 280 570 430 M290 650 Q480 780 660 570","M180 390 Q420 245 620 425 M265 680 Q500 800 700 560","M245 435 Q400 330 530 440 M325 615 Q470 710 610 575"][frame]
    elif w=="dual-axe":
        p=["M260 380 L510 615 M500 380 L260 615","M230 345 L560 650 M550 345 L230 650","M195 320 L600 680 M590 320 L195 680","M250 380 L510 610 M510 380 L250 610"][frame]
    elif w=="axe":
        p=["M300 300 L625 670","M270 260 L660 700","M230 220 L700 735","M300 315 L625 660"][frame]
    elif w=="hammer":
        p=["M400 340 L400 670","M365 280 L435 690","M340 220 L460 740","M400 340 L400 665"][frame]
    elif w=="shield":
        p=["M300 520 Q400 400 500 520","M250 500 Q400 330 550 500","M200 480 Q400 260 600 480","M300 520 Q400 400 500 520"][frame]
    elif w=="ribbon":
        p=["M520 650 Q700 500 590 350","M500 690 Q760 480 600 300","M480 720 Q800 450 610 260","M520 650 Q700 500 590 350"][frame]
    elif w=="mechanism":
        p=["M500 500 L650 350 M650 500 L500 350","M470 530 L700 300 M700 530 L470 300","M430 560 L750 270 M750 560 L430 270","M500 500 L650 350 M650 500 L500 350"][frame]
    else:
        p=["M285 570 Q470 290 730 430","M245 610 Q490 250 770 420","M200 650 Q520 210 810 400","M285 570 Q470 290 730 430"][frame]
    return f'<path d="{p}" fill="none" stroke="{c}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round" opacity="{a}"/><path d="{p}" fill="none" stroke="#fff0c8" stroke-width="4" stroke-linecap="round" opacity="{a*.72}"/>'

SPECIAL_SKILL_PATHS = {
"benevolent-mandate":'M400 270 C520 380 540 520 400 730 C260 520 280 380 400 270Z M400 370 L400 620 M330 490 L470 490',
"azure-dragon-slash":'M160 620 C250 350 420 300 560 410 C690 520 560 690 410 610 C310 550 400 450 520 470 M520 380 L650 300 L610 440Z',
"tiger-roar":'M210 420 L310 340 L400 390 L490 340 L590 420 L650 570 L540 690 L400 720 L260 690 L150 570Z M310 500 L365 520 M435 520 L490 500',
"silver-pearls":'M210 680 Q300 360 400 300 Q500 360 590 680 M300 640 Q355 470 400 430 Q445 470 500 640 M400 350 L400 700',
"eight-trigrams":'M400 270 L560 360 L560 550 L400 710 L240 550 L240 360Z M400 300 L400 680 M260 490 L540 490 M300 370 L500 610 M500 370 L300 610',
"hundred-pace-arrow":'M170 650 L690 340 L620 325 L725 320 L660 410Z M260 580 L350 525 L368 490',
"closed-moon":'M560 280 C390 240 250 370 270 530 C290 690 460 760 590 640 C450 680 350 590 360 470 C365 365 450 310 560 280Z',
"wei-warlord":'M400 260 L590 360 L560 590 Q400 760 240 590 L210 360Z M400 350 L485 490 L400 620 L315 490Z',
"red-cliff-fire":'M230 680 Q180 540 300 420 Q270 550 380 550 Q400 410 510 310 Q490 530 650 610 Q590 760 400 740 Q285 730 230 680Z M400 700 Q420 580 510 520',
"sky-halberd":'M400 760 L400 235 M400 360 Q550 250 660 355 Q630 475 420 520Z M380 330 L400 230 L420 330',
"evil-hunter":'M230 300 L570 700 M570 300 L230 700 M280 410 Q220 290 300 270 Q370 315 340 430 M520 430 Q490 315 560 270 Q640 290 580 410',
"qilin-strategy":'M210 590 Q270 340 450 370 Q620 400 600 570 Q580 730 420 690 Q290 650 350 510 Q410 390 540 500 M540 360 L670 300 L630 430',
"xiliang-charge":'M170 680 L700 350 M210 745 L735 430 M250 810 L770 500 M660 330 L745 330 L700 400',
"blood-maw":'M200 370 Q290 460 360 420 L410 535 L475 410 Q560 470 660 350 M250 620 Q400 780 620 600',
"phoenix-rebirth":'M400 700 Q270 550 330 400 Q390 470 400 540 Q470 390 570 305 Q520 520 670 600 Q550 760 400 700Z M400 670 Q415 540 495 450',
"weakpoint-mark":'M520 330 L520 650 M360 490 L680 490 M405 370 L635 610 M635 370 L405 610 M520 420 L600 490 L520 560 L440 490Z',
"sword-rift":'M210 700 L550 290 L660 220 L620 340 L280 760Z M235 470 Q365 350 490 455 Q580 530 700 420',
"rear-hunt":'M200 380 L640 380 M200 510 L640 510 M200 640 L640 640 M610 330 L700 380 L610 430 M610 460 L700 510 L610 560 M610 590 L700 640 L610 690',
"river-break":'M150 520 Q270 350 390 520 T630 520 M150 620 Q270 450 390 620 T630 620 M400 290 L470 490 L400 690 L330 490Z',
"dragon-inherit":'M200 590 Q270 320 450 390 Q640 450 560 625 Q470 760 330 625 Q280 560 410 470 Q510 400 625 505',
"snake-spear":'M400 760 L400 235 M350 330 L400 210 L450 330 L400 295Z M270 445 Q400 350 530 445 M270 520 Q400 425 530 520',
"swift-cavalry":'M180 640 Q230 390 440 390 Q650 390 620 610 Q590 790 390 710 Q270 650 340 520 Q410 400 540 500',
"feint-step":'M170 650 L470 340 L550 300 L515 390 L220 700Z M300 720 L600 420 L680 380 L645 470 L350 770Z',
"siege-axe":'M400 760 L400 230 M400 330 Q550 230 660 350 Q640 470 420 520Z M395 285 L425 285 M380 650 L420 650',
"tiger-earthquake":'M400 330 Q500 430 400 520 Q300 430 400 330Z M400 500 Q530 540 400 650 Q270 540 400 500Z M170 500 A230 230 0 1 0 630 500 A230 230 0 1 0 170 500',
"one-eye-reckoning":'M190 500 Q400 270 610 500 Q400 730 190 500Z M400 300 L400 700 M500 340 L660 250 L610 410Z',
"triple-arrow":'M170 360 L690 360 M170 500 L690 500 M170 640 L690 640 M625 325 L720 360 L625 395 M625 465 L720 500 L625 535 M625 605 L720 640 L625 675',
"fate-ambush":'M230 330 L560 680 L680 300 L230 330Z M230 680 L560 330 L680 710 L230 680Z M230 330 L230 680 M560 330 L560 680',
"kingmaker-aegis":'M400 270 L600 370 L560 600 Q400 750 240 600 L200 370Z M400 355 L480 490 L400 620 L320 490Z',
"wolf-shadow":'M210 600 L280 400 L385 455 L490 330 L590 445 L680 390 L630 620 L525 680 L415 650 L320 690Z',
"iron-wall":'M210 360 L350 280 L490 360 L490 640 L350 720 L210 640Z M490 360 L630 280 L770 360 L770 640 L630 720 L490 640Z',
"imperial-edict":'M280 300 L520 300 L630 410 L630 590 L520 700 L280 700 L170 590 L170 410Z M280 410 L520 410 M280 500 L520 500 M280 590 L500 590',
"first-breach":'M230 300 L570 300 L570 700 L230 700Z M400 300 L350 425 L460 480 L360 600 L415 700 M590 450 L710 500 L590 550Z',
"formation-lock":'M220 300 L580 300 L580 680 L220 680Z M340 300 L340 680 M460 300 L460 680 M220 425 L580 425 M220 555 L580 555 M400 300 L400 680',
"overlord":'M450 220 L300 500 L430 500 L320 770 L640 400 L480 400Z M210 700 Q400 790 650 680',
"jiangdong-command":'M400 230 L400 740 M400 280 L660 340 L400 470Z M300 720 L500 720 M350 660 L450 660',
"burning-camp":'M210 650 Q300 480 260 360 Q380 450 400 260 Q485 400 470 500 Q585 400 680 550 Q620 730 420 760Z M340 680 Q390 570 440 540 Q490 615 440 710',
"white-cloak":'M200 620 Q300 370 490 420 Q660 480 580 670 M270 720 L535 330 L635 270 L575 400 L320 760',
"night-raid":'M570 270 Q370 240 300 430 Q230 620 450 700 Q270 710 190 550 Q150 350 350 260Z M270 680 L440 400 L520 350 L470 460 M480 650 L630 440 L700 410',
"shen-ting":'M400 240 L400 760 M150 500 L650 500 M400 320 L465 455 L400 520 L335 455Z M400 390 A160 160 0 1 0 400 390',
"fire-vessel":'M230 620 Q300 460 380 515 Q440 320 510 470 Q620 390 670 580 Q630 760 430 750 Q280 745 230 620Z M440 330 L470 430 L530 470',
"taying-plan":'M260 300 L580 300 L580 660 L260 660Z M305 380 L535 380 M305 460 L535 460 M305 540 L500 540 M610 610 L690 690 L610 770 L530 690Z',
"crossbow-volley":'M220 420 L650 420 M220 510 L650 510 M220 600 L650 600 M610 380 L710 420 L610 460 M610 470 L710 510 L610 550 M610 560 L710 600 L610 640',
"flower-recovery":'M400 340 Q460 390 400 480 Q340 390 400 340Z M400 520 Q460 610 400 680 Q340 610 400 520Z M280 480 Q370 420 430 480 Q370 540 280 480Z M490 480 Q580 420 670 480 Q580 540 490 480Z',
"twin-fan":'M220 640 Q220 390 450 330 Q420 540 220 640Z M580 640 Q580 390 350 330 Q380 540 580 640Z M220 640 L450 330 M580 640 L350 330',
"luoshui-freeze":'M150 500 Q250 360 350 500 T550 500 T750 500 M400 240 L400 760 M250 350 L550 650 M550 350 L250 650 M350 500 L400 420 L450 500 L400 580Z',
"wooden-cattle":'M320 500 A115 115 0 1 0 320 501 M555 500 A100 100 0 1 0 555 501 M435 400 L555 400 L630 310 M435 600 L555 600 L630 700',
"vengeful-blade":'M190 670 L390 300 L470 235 L430 365 L250 740Z M610 670 L410 300 L330 235 L370 365 L550 740Z',
"silver-moon":'M580 270 Q380 230 300 420 Q230 600 430 700 Q260 730 180 570 Q130 360 340 250Z M440 280 L480 500 L440 730 L400 500Z',
"maternal-aegis":'M400 270 Q610 370 550 560 Q500 680 400 750 Q300 680 250 560 Q190 370 400 270Z M400 430 Q445 380 480 430 Q510 480 400 550 Q290 480 320 430 Q355 380 400 430Z'
}
def skill_mark(h,frame):
    fx=h["fx"]; c=h["accent"]; a=[.18,.52,1,.42][frame]
    if fx in SPECIAL_SKILL_PATHS:
        tint="#f08a42" if any(k in fx for k in ("fire","phoenix","burning")) else "#b94b43" if any(k in fx for k in ("blood","maw","vengeful","one-eye")) else "#b9e5f2" if any(k in fx for k in ("ice","luoshui")) else c
        return f'<g opacity="{a}" fill="none" stroke="{tint}" stroke-width="{10+frame*2}" stroke-linecap="round" stroke-linejoin="round"><path d="{SPECIAL_SKILL_PATHS[fx]}"/><circle cx="400" cy="500" r="{85+frame*22}" stroke="{tint}" stroke-width="5" opacity=".3"/></g>'
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
    attack_motion={
        "spear":["translate(0 0)","translate(-8 -5) rotate(-2 400 820)","translate(20 -10) rotate(4 400 820)","translate(0 0)"],
        "spear-long":["translate(0 0)","translate(-10 -4) rotate(-2 400 820)","translate(28 -8) rotate(5 400 820)","translate(0 0)"],
        "guandao":["translate(0 0)","translate(-18 -2) rotate(-6 400 800)","translate(25 -10) rotate(10 400 800)","translate(0 0)"],
        "halberd":["translate(0 0)","translate(-15 -6) rotate(-8 400 800)","translate(18 -15) rotate(13 400 800)","translate(0 0)"],
        "sword":["translate(0 0)","translate(-12 -8) rotate(-4 400 820)","translate(25 -12) rotate(7 400 820)","translate(0 0)"],
        "saber":["translate(0 0)","translate(-16 -5) rotate(-6 400 800)","translate(25 -8) rotate(11 400 800)","translate(0 0)"],
        "bow":["translate(0 0)","translate(-5 -12) scale(1.01)","translate(18 -16) scale(1.03)","translate(0 -2)"],
        "crossbow":["translate(0 0)","translate(-4 -8) scale(1.01)","translate(16 -8) scale(1.02)","translate(0 0)"],
        "fan":["translate(0 0)","translate(-8 -5) rotate(-5 400 820)","translate(14 -8) rotate(9 400 820)","translate(0 0)"],
        "scroll":["translate(0 0)","translate(-7 -4) rotate(-3 400 820)","translate(9 -4) rotate(5 400 820)","translate(0 0)"],
        "dual-dagger":["translate(0 0)","translate(-8 -10) rotate(-4 400 820)","translate(18 -12) rotate(7 400 820)","translate(0 0)"],
        "dual-blade":["translate(0 0)","translate(-10 -8) rotate(-5 400 820)","translate(20 -10) rotate(8 400 820)","translate(0 0)"],
        "dual-axe":["translate(0 0)","translate(-16 -10) rotate(-7 400 820)","translate(25 -15) rotate(9 400 820)","translate(0 0)"],
        "axe":["translate(0 0)","translate(-10 -8) rotate(-5 400 820)","translate(14 -22) rotate(10 400 820)","translate(0 0)"],
        "hammer":["translate(0 0)","translate(-4 -18) rotate(-2 400 820)","translate(8 -28) rotate(3 400 820)","translate(0 0)"],
        "shield":["translate(0 0)","translate(0 -8) rotate(-3 400 820)","translate(24 -8) rotate(5 400 820)","translate(0 0)"],
        "ribbon":["translate(0 0)","translate(-5 -8) rotate(-6 400 820)","translate(10 -10) rotate(8 400 820)","translate(0 0)"],
        "mechanism":["translate(0 0)","translate(-8 -4) rotate(-3 400 820)","translate(12 -8) rotate(4 400 820)","translate(0 0)"]
    }
    transforms=(attack_motion.get(h["weapon"],["translate(0 0)","translate(-10 -8) rotate(-3 400 840)","translate(28 -16) rotate(7 400 840)","translate(-4 0) rotate(-1 400 840)"]) if mode=="attack" else ["translate(0 0)","translate(0 -18) scale(1.02)","translate(0 -28) scale(1.06)","translate(0 -2) scale(1.01)"])
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
