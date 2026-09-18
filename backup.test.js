// 门卫三号（backup.js validateBackup）单测 —— node 直接跑，老套路 new Function 剥 import
// 跑法：node backup.test.js  （在项目根目录）
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/src/data/backup.js', 'utf8');

// 剥掉 import 行和 export 前缀，只留门卫三号 + 款式号常量
const code = src
  .replace(/^import .*$/gm, '')
  .replace(/^export /gm, '')
  .split('// ------------------------------------------------------------')
  .filter((part) => part.includes('BACKUP_VERSION') || part.includes('validateBackup'))
  .join('\n');
const validateBackup = new Function(code + '\nreturn validateBackup;')();

// ---- 造箱子 ----
const goodBox = JSON.stringify({
  app: 'fixit', version: 1, date: '2026-09-18',
  mistakes: [], sentences: [],
});
const badNoApp = JSON.stringify({ app: 'other', version: 1, mistakes: [], sentences: [] });
const badVer = JSON.stringify({ app: 'fixit', version: 99, mistakes: [], sentences: [] });
const badArr = JSON.stringify({ app: 'fixit', version: 1, mistakes: {}, sentences: [] });
const badJson = '{这是打不开的箱子';

const cases = [
  [goodBox, true, '正箱能收'],
  [badJson, false, '坏 JSON 拦下'],
  [badNoApp, false, '无印章拦下'],
  [badVer, false, '错款式拦下'],
  [badArr, false, '缺清单拦下'],
  ['', false, '空文本拦下'],
];
let pass = 0;
for (const [text, wantOk, name] of cases) {
  const r = validateBackup(text);
  const ok = r.ok === wantOk;
  if (ok) pass++;
  console.log(ok ? 'PASS' : 'FAIL', name, '→', r.ok ? '' : r.reason);
}
console.log(pass + '/' + cases.length + ' green');
process.exit(pass === cases.length ? 0 : 1);
