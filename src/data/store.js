// ============================================================
// store.js —— Fix It 的「账本」：错题档案的存取
// ============================================================
// 为什么用 AsyncStorage？
//   和打卡墙的 localStorage 一个道理：数据存在手机本机，
//   关掉 App 不丢。这是 M1 学过的「本地存储」在 App 里的版本。

import AsyncStorage from '@react-native-async-storage/async-storage';

const MISTAKES_KEY = 'fixit_mistakes'; // 错题档案的抽屉名

// ------------------------------------------------------------
// 读取全部错题
// 返回数组，每条错题长这样：
// { question, userAnswer, fixedVersion, upgradedVersion,
//   trapType, date, passedCount }
// ------------------------------------------------------------
export async function getMistakes() {
  const raw = await AsyncStorage.getItem(MISTAKES_KEY);
  return raw ? JSON.parse(raw) : [];
}

// ------------------------------------------------------------
// 存一条新错题（批改发现惯犯时调用）
// ------------------------------------------------------------
export async function addMistake(mistake) {
  const mistakes = await getMistakes();
  mistakes.push({
    ...mistake,
    date: new Date().toISOString().slice(0, 10), // 记账日期
    passedCount: 0, // 连对次数——攒够 3 次毕业出库
  });
  await AsyncStorage.setItem(MISTAKES_KEY, JSON.stringify(mistakes));
}

// ------------------------------------------------------------
// 老规矩：写完读一遍验证没写坏（和打卡墙 L6 的习惯一样）
// ------------------------------------------------------------
export async function countByType() {
  const mistakes = await getMistakes();
  const counts = { 时态: 0, 直译: 0, 词形: 0 };
  mistakes.forEach((m) => {
    if (counts[m.trapType] !== undefined) counts[m.trapType] += 1;
  });
  return counts;
}
