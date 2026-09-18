// ============================================================
// backup.js —— Fix It 的「搬家公司」：把两张抽屉打包寄走，再原样搬回来
// ============================================================
// 为什么需要它？
//   错题和好句都住在手机/浏览器自己的抽屉（AsyncStorage）里——
//   换浏览器、换电脑、清缓存，抽屉就空了。搬家公司把两个抽屉的
//   全部家当打进一只箱子（JSON 字符串），你把箱子拷走；
//   到了新地方再拆箱，家当原样归位。
//
// 和 store.js / sentences.js 的关系：
//   它们管「住」；backup.js 管「搬」——只借道，不另立门户。

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMistakes, MISTAKES_KEY } from './store';
import { getSentences, SENTENCES_KEY } from './sentences';

const BACKUP_VERSION = 1; // 箱子款式号——以后家当结构变了就换新款号，老箱子还认得出来历

// ------------------------------------------------------------
// 打包：两张抽屉装一箱，贴上快递单（app 印章 + 款式号 + 打包日期）
// 返回 JSON 字符串——一段纯文本，复制/存文件/发给自己都行
// ------------------------------------------------------------
export async function buildBackup() {
  const mistakes = await getMistakes();
  const sentences = await getSentences();
  return JSON.stringify(
    {
      app: 'fixit', // 印章：这是 Fix It 的箱子
      version: BACKUP_VERSION,
      date: new Date().toISOString().slice(0, 10),
      mistakes: mistakes, // 错题抽屉全部家当
      sentences: sentences, // 好句抽屉全部家当
    },
    null,
    2
  ); // null, 2 = 排版缩进两格，人打开文件也看得清
}

// ------------------------------------------------------------
// 门卫三号：验箱（和门卫一号验中文题、门卫二号验三张脸是一个编制）
// 只回答两个问题：这箱子能不能收？不能的话为什么？
// ------------------------------------------------------------
export function validateBackup(text) {
  let box;
  try {
    box = JSON.parse(text);
  } catch (e) {
    return { ok: false, reason: '这箱子打不开——不是合法的 JSON 文本' };
  }
  if (!box || box.app !== 'fixit') {
    return { ok: false, reason: '单子上没有 fixit 印章——不是 Fix It 的备份箱' };
  }
  if (box.version !== BACKUP_VERSION) {
    return { ok: false, reason: '箱子款式不认得（v' + box.version + '，现在只收 v' + BACKUP_VERSION + '）' };
  }
  if (!Array.isArray(box.mistakes) || !Array.isArray(box.sentences)) {
    return { ok: false, reason: '箱子里缺抽屉——mistakes/sentences 必须是两张清单' };
  }
  return { ok: true, box: box };
}

// ------------------------------------------------------------
// 拆箱：合并入库（搬家最怕扔东西，所以只加不删）
// 门规三条：
//   1. 门卫三号先验箱，箱子不对一件都不收
//   2. 门卫二号复查每头惯犯——幽灵惯犯（类型不是三张脸）不许跟着箱子混进来
//   3. 重复的不重复入库：惯犯「题目+你写的答案」一样 = 同一头；
//      好句英文一样 = 同一句（跟 addSentence 一个门规）
// 返回战报：新收几头/几句、跳过几头/几句、拦下几条脏货
// ------------------------------------------------------------
export async function restoreBackup(text) {
  const check = validateBackup(text);
  if (!check.ok) return { ok: false, reason: check.reason };
  const box = check.box;

  const oldM = await getMistakes(); // getMistakes 自带大扫除，读出来的已经是干净账
  const oldS = await getSentences();

  // 门卫二号复查：字段不齐 + 类型不是三张脸的，一律拦在门外
  const TRAP = ['时态', '直译', '词形'];
  const cleanM = box.mistakes.filter(
    (m) => m && m.question && m.userAnswer && TRAP.includes(m.trapType)
  );
  const cleanS = box.sentences.filter((s) => s && s.en);

  // 查重：老住户名单里见过的，不重复收
  const newM = cleanM.filter(
    (m) => !oldM.some((x) => x.question === m.question && x.userAnswer === m.userAnswer)
  );
  const newS = cleanS.filter((s) => !oldS.some((x) => x.en === s.en));

  // 合并写回：老住户在前，新来的排后面
  await AsyncStorage.setItem(MISTAKES_KEY, JSON.stringify([...oldM, ...newM]));
  await AsyncStorage.setItem(SENTENCES_KEY, JSON.stringify([...oldS, ...newS]));

  return {
    ok: true,
    addedM: newM.length, // 新收惯犯
    skippedM: cleanM.length - newM.length, // 跳过的重复惯犯
    dirtyM: box.mistakes.length - cleanM.length, // 门卫拦下的脏货
    addedS: newS.length, // 新收好句
    skippedS: cleanS.length - newS.length, // 跳过的重复好句
  };
}
