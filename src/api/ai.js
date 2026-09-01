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
export async function generateQuestion(trapType) {
  const messages = [
    {
      role: 'system',
      content:
        '你是一个英语出题专家。用户是中国大学生，正在练习中译英。' +
        '你出的题目要专门埋下指定的「雷点」，让用户容易犯错。' +
        '只输出题目本身（一句中文 + 场景提示），不要输出答案，不要解释。',
    },
    {
      role: 'user',
      content: `请出一道中译英题，雷点类型：${trapType}。难度：大学四级水平。`,
    },
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
