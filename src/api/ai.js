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
export async function generateQuestion(trapType,level) {
  let levelDesc;
  if (level === '基础') {
    levelDesc = '难度：基础档——日常普通句子，四级以内，用词常见，不需要从句等复杂结构，考的是把简单句写对。';
  } else if (level === '中等') {
    levelDesc = '难度：中等档——四六级之间，可以用上一个常见从句或被动，句子长度适中。';
  } else {
    levelDesc = '难度：进阶档——六级到雅思5.5-6.5，最多自然地用上一处从句、被动或非谓语，可参考历年考试真题，不要堆砌。';
  }
  const messages = [
    {
      role: 'system',
      content:
        '你是一个英语出题专家。用户是中国大学生，正在练习中译英。' +
        '你出的题目要埋下指定类型的「雷点」，雷点必须是中国学生真实常犯的高频错误，不要生造，不要重复。' +
        '只输出题目本身（一句中文 + 场景提示），不要输出答案，不要解释。',
    },
    {
      role: 'user',
      content:`请出一道中译英题，雷点类型：${trapType}。${levelDesc}题材选校园、生活、社会、教育、科技类。`,}
  ];
  return askAI(messages);
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