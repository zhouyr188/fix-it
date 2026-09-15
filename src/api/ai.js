// ============================================================
// ai.js —— Fix It 的「后厨」：所有和智谱 AI 打交道的代码都在这
// ============================================================
// 为什么单独一个文件？
//   以后如果要换 AI 供应商（比如换 DeepSeek），只需要改这一个文件，
//   练习页和错题档案完全不用动。这就是「各管一事」。

const ZHIPU_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

// 你的钥匙从环境变量读（.env 文件），不写死在代码里
// —— 这样代码可以放心上传 GitHub，钥匙永远留在本机
import Constants from 'expo-constants';
const API_KEY = Constants.expoConfig?.extra?.zhipuKey || '';

// ------------------------------------------------------------
// 通用请求函数：发一条消息给 AI，拿回回复文本
// ------------------------------------------------------------
async function askAI(messages, temperature = 0.7) {
  const response = await fetch(ZHIPU_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'glm-4-flash',
      messages: messages,
      temperature: temperature,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI 接口出错：${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ------------------------------------------------------------
// 出题埋雷：让 AI 出一道中译英题，偷偷埋一个惯犯雷点
// trapType: '时态' | '直译' | '词形' —— 错题三大分类
// ------------------------------------------------------------
// 题材牌堆：每档一个池子，每次出题随机抽一张「场景牌」塞给 AI
// 为什么？AI 自己选题材会翻来覆去用同一个（锚定效应），咱们发牌它就没法偷懒
const THEME_POOLS = {
  基础: ['校园学习', '购物消费', '交通出行', '健康运动', '家庭朋友', '饮食三餐', '天气季节', '兴趣爱好'],
  中等: ['传统文化', '社会发展', '经济生活', '科技应用', '教育现状'],
  进阶: ['社会现象评论', '观点论述', '数据与趋势', '抽象概念'],
};
let lastTheme = ''; // 上一题抽的牌——防止连抽同一个场景
function drawTheme(level) {
  const pool = THEME_POOLS[level] || THEME_POOLS.基础;
  let t = pool[Math.floor(Math.random() * pool.length)];
  if (t === lastTheme && pool.length > 1) {
    t = pool[(pool.indexOf(t) + 1) % pool.length]; // 撞牌就顺延一张
  }
  lastTheme = t;
  return t;
}

// ------------------------------------------------------------
// 门卫：检查题目是不是中文（AI 偶尔会犯糊涂用英语出题，当场退货重出）
// 判定方法：数中文字符。中文题面里英文只该出现在括号提示里，占比很小
// ------------------------------------------------------------
function isChineseQuestion(q) {
  const chinese = (q.match(/[\u4e00-\u9fff]/g) || []).length;
  const letters = (q.match(/[a-zA-Z]/g) || []).length;
  return chinese >= 4 && chinese > letters; // 至少 4 个汉字，且汉字比英文字母多
}

// ============================================================
// 出厂检验官（2026-09-11）：规格不靠 AI 自觉，机器亲手数数
// AI 交卷格式：题目：xxx\n译文：yyy —— 译文也要交，机器数完词再放行
// 数数口径：含字母或数字的空格串算 1 词；汉字去掉括号提示再数
// ============================================================
const CLAUSE_MARKS = /\b(that|which|who|whom|whose|when|where|why|because|although|though|if|since|unless|until|while|whereas|whether|what|whatever|so that|as if|even if)\b/gi;

const LEVEL_SPEC = {
  基础: { wMax: 12, zMax: 20 },
  中等: { wMin: 12, wMax: 18, zMin: 16, zMax: 30 },
  进阶: { wMin: 18, wMax: 25, zMin: 28, zMax: 45 },
};

export function countWords(s) {
  return s.split(/\s+/).filter((t) => /[A-Za-z0-9]/.test(t)).length;
}
export function countHanzi(s) {
  return (s.replace(/[（(][^）)]*[）)]/g, '').match(/[\u4e00-\u9fff]/g) || []).length; // 全角/半角括号里的提示都不算
}
export function countClauseMarks(s) {
  return (s.match(CLAUSE_MARKS) || []).length;
}

// 拆卷：把「题目：…\n译文：…」两行拆开；格式不对返回 null
export function parseQuestion(raw) {
  const qMatch = raw.match(/题目[：:]\s*(.+)/);
  const tMatch = raw.match(/译文[：:]\s*([\s\S]+)/);
  if (!qMatch || !tMatch) return null;
  return {
    question: qMatch[1].trim(),
    ref: tMatch[1].trim().split('\n')[0].trim(), // 只取第一行，防啰嗦
  };
}

// 检验单题：达标返回 ok:true；不达标给出人话原因
export function checkSpec(level, question, ref) {
  const sp = LEVEL_SPEC[level] || LEVEL_SPEC.基础;
  const w = countWords(ref);
  const z = countHanzi(question);
  const reasons = [];
  if (w > sp.wMax) reasons.push(`译文${w}词超上限${sp.wMax}词`);
  if (sp.wMin && w < sp.wMin) reasons.push(`译文${w}词不够下限${sp.wMin}词`);
  if (z > sp.zMax) reasons.push(`题面${z}字超上限${sp.zMax}字`);
  if (sp.zMin && z < sp.zMin) reasons.push(`题面${z}字不够下限${sp.zMin}字`);
  return { ok: reasons.length === 0, reason: reasons.join('；'), words: w, hanzi: z };
}

// ------------------------------------------------------------
// 拼出题提示词：把（雷点类型 + 难度规格 + 场景牌）组装成发给 AI 的完整订单
// 单独抽成一个函数：generateQuestion 和验收测试用的是同一份文案，永不两样
// ------------------------------------------------------------
export function buildQuestionPrompt(trapType, level) {
  const theme = drawTheme(level); // 先抽场景牌
  // ---- 难度三档 = 三张机械规格表（2026-09-11 大修）----
  // 旧版净是「长度适中」「最多一处从句」这种形容词——AI 读了等于没读，出题忽长忽短。
  // 新版全部换成能一条条打勾的硬指标：英文单词数、从句数、中文汉字数。
  // 换算经验值：1 个英文单词 ≈ 1.6 个汉字，中文题面的字数锚点就是这么定的。
  let levelDesc;
  if (level === '基础') {
    levelDesc = '难度：基础档。以下规格是硬性要求，任何一条不满足即废题：\n' +
      '1. 标准英文译文不超过 12 个英文单词（a/an/the 这些小词也要数进去）；\n' +
      '2. 只许一套主谓结构的简单句——全句不许出现任何从句（定语/状语/宾语从句一律禁止）；\n' +
      '3. 只用四级以内的常见词汇；\n' +
      '4. 中文题面（不算括号里的提示）不超过 20 个字，且至多包含 2 个动作（「起床」「坐地铁」各算一个动作，动作越多译文越长）；\n' +
      '选材贴近四级翻译真题的缩小版：句子自然常见，禁止离奇、搞笑或生造的场景。';
  } else if (level === '中等') {
    levelDesc = '难度：中等档。以下规格是硬性要求，任何一条不满足即废题：\n' +
      '1. 标准英文译文 12-18 个英文单词（a/an/the 也要数）；\n' +
      '2. 恰好包含 1 个从句——定语/状语/宾语从句三种里挑一种，不许出现第二个从句；\n' +
      '3. 主句之外不许再拉分句：「但/而且/同时」引出的第二个谓语分支一律砍掉，逗号直接并列的第二套谓语（如「收入提高，结构优化」）也算超标——一个从句已经是全部复杂度；\n' +
      '4. 中文题面（不算括号提示）16-30 个字。\n' +
      '选材模拟四级翻译真题段落中的一句：传统文化、社会发展、经济生活、科技应用、教育现状等四六级中真实常见的题材，' +
      '用词和句式都向真题靠拢，不要出脑筋急转弯式的偏题。';
  } else {
    levelDesc = '难度：进阶档。以下规格是硬性要求，任何一条不满足即废题：\n' +
      '1. 标准英文译文 18-25 个英文单词（a/an/the 也要数），宁精勿长，超过 25 词即废题；\n' +
      '2. 恰好包含 2 个从句（同种或不同种都行），不许出现第 3 个从句；\n' +
      '3. 中文题面（不算括号提示）28-45 个字；\n' +
      '4. 统计数字最多出现 1 个（两个数字必然把译文撑爆）；\n' +
      '5. 全句只有一个句号——禁止拆成两句话；\n' +
      '6. 结构只有「一个主句 + 两个从句」，砍掉一切铺垫和尾巴：「但/然而/同时」引出的第三个谓语分支一律砍掉，「这一现象引起了广泛关注」「人们对此看法不一」这类收尾句式一律禁止——它们每个都要多烧 5-8 个词。\n' +
      '选材模拟六级/雅思风格的句子：社会现象评论、观点论述、数据趋势描述、抽象概念。' +
      '所有数据必须直接用文字写进题面（如「近五年增长了 30%」），禁止出「描述下表/下图」类题目——用户看不到任何图表。';
  }
  return [
    {
      role: 'system',
      content:
        '你是一个英语出题专家，专攻中国大学生中译英考试（四六级/考研/雅思）。' +
        '注意：这是中译英练习——题面必须是中文句子，由用户翻译成英文；严禁用英语出题，严禁多次重复同话题题目。' +
        '你出的题目要埋下指定类型的「雷点」，雷点必须是中国学生真实常犯的高频错误，不要生造，不要重复。' +
        '题目必须是一句自然、常见、可以在真实考试里出现的中文句子。' +
        '输出格式（严格遵守）：第一行「题目：」+中文单句；第二行「译文：」+该句的标准英文译文。除这两行外不要输出任何别的字。' +
        '括号内最多给 1 个生僻名词或专有名词的英文提示（如人名地名机构名），提示以外的题面全部用中文；' +
        '严禁提示动词、时态、词形、句式结构或雷点相关的任何词——提示不许泄露答案。',
    },
    {
      role: 'user',
      content:`请出一道中译英题：题面是中文句子（不要用英语出题），雷点类型：${trapType}。${levelDesc}本题题材限定：${theme}（必须围绕这个场景出，不要自己换题材）。无论哪档，题面都必须是一个单句（全句只有一个句号），禁止拆成两句。交卷前自查：在心里默写标准英文译文、数一遍单词数和从句数，规格不满足就换一题；自查必须默默完成——最终只输出「题目：」和「译文：」两行，除此之外一个字都不要多。`,
    }
  ];
}

export async function generateQuestion(trapType,level) {
  const base = buildQuestionPrompt(trapType, level);
  // 出题流水线：AI 交卷 → 机器验规格 → 不合格把「不合格原因」退回去重造（规格执法不靠自觉）
  // 重试时升温+换场景牌，别让 AI 复读同一张废卷；最多 3 次；
  // 3 次都不完美就放行「词数最接近规格」的那张——练习不能卡死在等题上
  let msgs = base;
  let best = null; // { q, dist } 词数离规格最近的卷子
  for (let i = 0; i < 3; i++) {
    const raw = await askAI(msgs, i === 0 ? 0.5 : 0.8); // 首次低温守规格，重试升温换脑子
    const parsed = parseQuestion(raw);
    if (!parsed || !isChineseQuestion(parsed.question)) {
      msgs = [...base, { role: 'assistant', content: raw },
        { role: 'user', content: '格式不对——请严格按「题目：…\n译文：…」两行格式重新交卷，题面必须是中文。' }];
      continue; // 卷子格式不对/英文题：直接扔
    }
    const sp = LEVEL_SPEC[level] || LEVEL_SPEC.基础;
    const check = checkSpec(level, parsed.question, parsed.ref);
    const mid = sp.wMin ? (sp.wMin + sp.wMax) / 2 : sp.wMax / 2;
    const dist = Math.abs(check.words - mid);
    if (best === null || dist < best.dist) best = { q: parsed.question, dist };
    if (check.ok) return parsed.question;
    msgs = [...base, { role: 'assistant', content: raw },
      { role: 'user', content: `这份卷子不合格：${check.reason}。请换一个说法重新出一道全新的题，务必让标准英文译文落进规格区间，译文给最简版（能删的词都删）。` }];
  }
  if (best) return best.q; // 挑最好的将就放行，练习不断粮
  throw new Error('AI 连续三次交不出合格卷子，已被出厂检验官拦下');
}

// ------------------------------------------------------------
// 批改作业：把用户的翻译发给 AI，拿回两档批改结果
// 返回格式（我们约定 AI 按这个格式回答）：
//   【改对版】……
//   【升级版】……
//   【惯犯类型】时态/直译/词形/无
// ------------------------------------------------------------
export async function gradeAnswer(question, userAnswer) {
  const messages = [
    {
      role: 'system',
      content:
        '你是英语批改老师。用户提交了一段中译英翻译，请按以下格式批改：\n' +
        '【评分】按 A/B/C/D 打分:A=完全正确;B=有小错但不影响理解;C=错误明显;D=错误严重，句子不成立\n' +
        '【改对版】把用户的错误全部修正的最小改写（只消灭错误，不追求漂亮）\n' +
        '【升级版】更地道、更漂亮的表达（在正确的基础上升级）\n' +
        '【惯犯类型】从 时态/直译/词形 中选一个最贴切的；如果用户全对，写「无」\n' +
        '每部分一两句话，简洁。',
    },
    {
      role: 'user',
      content: `题目：${question}\n用户的翻译：${userAnswer}`,
    },
  ];
  return askAI(messages);
}

export async function explainMistake(userAnswer) {
  const messages = [
    { role: 'system', 
      content:
        '你是英语讲解员。用户给你一句英文（可能是对的也可能是错的），你用中文回复，严格三行：\n'+
        '第一行【问题】指出这句话哪里有问题；如果整句都对，就写它哪里写得好\n'+
        '第二行【原理】用一句话讲清背后的规则，要让大学生能听懂\n'+
        '第三行【最佳】给出最地道的写法，并附上一个值得学的漂亮词汇或地道表达,每行不超过 30 字，总共不超过 100 字。语气像学姐讲题，亲切直接。',
  },   // 把上面那份说明书抄进来
    { 
      role: 'user', 
      content: `用户的答案：${userAnswer}`,     
    },
  ];
    
  return askAI(messages);
}