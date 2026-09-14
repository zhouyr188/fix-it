// ============================================================
// sentences.js —— Fix It 的「好句库」：被你亲手升级过的好句子
// ============================================================
// 和错题档案（store.js）是姐妹抽屉：
//   错题抽屉 = 惯犯档案（还没治好的）
//   好句抽屉 = 毕业好句（你被 AI 升级过的句子，值得回头背）
// 两个抽屉同一套手艺：AsyncStorage + JSON.stringify/parse

import AsyncStorage from '@react-native-async-storage/async-storage';

const SENTENCES_KEY = 'fixit_sentences'; // 好句抽屉的抽屉名

// ------------------------------------------------------------
// 读取全部好句
// 返回数组，每条长这样：
// { en, zh, note, trapType, date }
//   en       —— 升级版的英文句子
//   zh       —— 中文原题（对着中文回想英文，复习才有悬念）
//   note     —— 为什么好（AI 批改时给的升级理由，当时就存下）
//   trapType —— 这句话治的是什么病（时态/直译/词形）
// ------------------------------------------------------------
export async function getSentences() {
  const raw = await AsyncStorage.getItem(SENTENCES_KEY);
  return raw ? JSON.parse(raw) : [];
}

// ------------------------------------------------------------
// 收藏一句（批改完看到好句，按「收藏好句」时调用）
// 防重复：同一句英文已经收过，就不再收第二遍
// ------------------------------------------------------------
export async function addSentence(sentence) {
  const all = await getSentences();
  if (all.some((x) => x.en === sentence.en)) return 'duplicate'; // 战报：收过了
  all.push({
    ...sentence,
    date: new Date().toISOString().slice(0, 10), // 收藏日期
  });
  await AsyncStorage.setItem(SENTENCES_KEY, JSON.stringify(all));
  return 'saved'; // 战报：入库
}

// ------------------------------------------------------------
// 删除一句（背熟了/不想要了，长按删除——M3 打磨项，先留门）
// ------------------------------------------------------------
export async function removeSentence(en) {
  const all = await getSentences();
  const left = all.filter((x) => x.en !== en);
  await AsyncStorage.setItem(SENTENCES_KEY, JSON.stringify(left));
  return 'removed';
}

// ------------------------------------------------------------
// 数一句（首页入口显示好句数量用）
// ------------------------------------------------------------
export async function countSentences() {
  const all = await getSentences();
  return all.length;
}
