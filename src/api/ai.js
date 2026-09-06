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
async function askAI(messages) {
  const response = await fetch(ZHIPU_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'glm-4-flash',
      messages: messages,
      temperature: 0.7,
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

export async function generateQuestion(trapType,level) {
  const theme = drawTheme(level); // 先抽场景牌
  let levelDesc;
  if (level === '基础') {
    levelDesc = '难度：基础档——单句，四级以内词汇，把简单句写对即可。' +
      '选材务必贴近四级翻译真题的缩小版：句子自然常见，像真题里会出现的，禁止离奇、搞笑或生造的场景。';
  } else if (level === '中等') {
    levelDesc = '难度：中等档——四六级之间，可以用上一个常见从句或被动，句子长度适中。' +
      '选材模拟四级翻译真题段落中的一句：传统文化、社会发展、经济生活、科技应用、教育现状等四六级中真实常见的题目。' +
      '用词和句式都向真题靠拢，不要出脑筋急转弯式的偏题。';
  } else {
    levelDesc = '难度：进阶档——六级到雅思5.5-6.5，最多自然地用上一处从句、被动或非谓语，可参考历年考试真题，不要堆砌。' +
      '选材模拟六级/雅思风格的句子：社会现象评论、观点论述、数据趋势描述、抽象概念。' +
      '所有数据必须直接用文字写进题面（如「近五年增长了 30%」），禁止出「描述下表/下图」类题目——用户看不到任何图表。';
  }
  const messages = [
    {
      role: 'system',
      content:
        '你是一个英语出题专家，专攻中国大学生中译英考试（四六级/考研/雅思）。' +
        '注意：这是中译英练习——题面必须是中文句子，由用户翻译成英文；严禁用英语出题。' +
        '你出的题目要埋下指定类型的「雷点」，雷点必须是中国学生真实常犯的高频错误，不要生造，不要重复。' +
        '题目必须是一句自然、常见、可以在真实考试里出现的中文句子。' +
        '只输出题目本身，不要输出答案，不要解释。' +
        '括号内最多给 1 个生僻名词或专有名词的英文提示（如人名地名机构名），提示以外的题面全部用中文；' +
        '严禁提示动词、时态、词形、句式结构或雷点相关的任何词——提示不许泄露答案。',
    },
    {
      role: 'user',
      content:`请出一道中译英题：题面是中文句子（不要用英语出题），雷点类型：${trapType}。${levelDesc}本题题材限定：${theme}（必须围绕这个场景出，不要自己换题材）。`,
    }
  ];
  const q = await askAI(messages);
  if (!isChineseQuestion(q)) {
    // 门卫退货：AI 用英语出了题，重出一次（再犯就抛错，让错误显示器亮红字）
    const retry = await askAI(messages);
    if (!isChineseQuestion(retry)) {
      throw new Error('AI 连续两次用英语出题，已被门卫拦下');
    }
    return retry;
  }
  return q;
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