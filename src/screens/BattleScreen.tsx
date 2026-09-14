// ============================================================
// BattleScreen —— Fix It 的「战斗房」：和一头惯犯怪兽单挑
// ============================================================
// 怪兽 = 基因库里的一条错题。血量 3 滴（连对 3 次消灭）：
//   答对一刀 → passMistake 记账 → 血条动画掉一格
//   答错     → failMistake 记账 → 怪兽满血复活（血条弹回满）
//   血清零   → 消灭出库，🏆 撒花，自动回基因库
// 新知识点：Animated —— 让宽度「动起来」的导演系统

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { gradeAnswer } from '../api/ai';
import { passMistake, failMistake, getMistakes } from '../data/store';

// 和练习页同款的小剪刀：从批改结果里剪出【某栏】的内容
function pickPart(text: string, name: string) {
  const parts = text.split('【');
  const block = parts.find((p) => p.startsWith(name + '】'));
  return block ? block.slice(name.length + 1).trim() : '';
}

// 三种怪兽的长相：类型不同脸不同，好认
const MONSTER_FACE: { [k: string]: string } = {
  时态: '⏰👾',
  直译: '🔄👹',
  词形: '🔤🦖',
};

export default function BattleScreen({ monster, onBack }: { monster: any; onBack: () => void }) {
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');     // 批改全文
  const [battleLog, setBattleLog] = useState(''); // 战斗播报（砍中/复活/消灭）
  const [hp, setHp] = useState(3 - (monster?.passedCount || 0)); // 现在的血
  const [nestTotal, setNestTotal] = useState(0); // 巢穴总数：该类型在押卡片数（方案三：一刀一个+清巢血条）
  const [won, setWon] = useState(false);        // 是否已消灭
  const [q, setQ] = useState('');               // 当前战题——从错题库抽（Zoey 09-12：弹药=自己的错题，不造新题）
  const [pool, setPool] = useState<any[]>([]);  // 弹药库：同类型的其他错题
  const [giveUp, setGiveUp] = useState(false);  // 认输了吗（认输后亮出参考答案）
  const [reveal, setReveal] = useState('');     // 认输后亮出的参考答案

  // ---- Animated 主演：血条的宽度（数字 0-3，映射成 0%-100%）----
  // useRef 是「跨回合记忆盒」：重渲染不会把它洗掉，动画值才连续
  const hpAnim = useRef(new Animated.Value(3 - (monster?.passedCount || 0))).current;

  // ---- 抽下一道战题：弹药=错题库里同类型的其他题目（Zoey 09-12：不造新题）----
  // 规则：优先打「别的」错题；全打完一轮了，最后一发回到出身题
  // 抽过的排到队尾循环用，不重复啃同一句
  async function newRound() {
    setGiveUp(false); // 新一题重新开打，认输状态清掉
    let p = pool;
    if (p.length === 0) {
      // 进房第一次：从错题库搬同类弹药（不含出身题——它压轴）
      const all = await getMistakes();
      const others = all.filter((m: any) => m.trapType === monster.trapType && m.question !== monster.question);
      p = others.length > 0 ? others : [monster]; // 孤品怪兽：库里没别的同类题，出身题自己顶上
    }
    const next = p[0];
    setQ(next.question);
    setPool([...p.slice(1), next]); // 用过的排到队尾，循环发放
  }

  // 进战斗房先出第一题
  useEffect(() => {
    if (monster) newRound();
  }, []);

  // 进房数巢：该类型还押着几头（血条=剩余/总数，方案三）
  useEffect(() => {
    if (!monster) return;
    getMistakes().then((all) => {
      const left = all.filter((m: any) => m.trapType === monster.trapType).length;
      setNestTotal(left);
      setHp(left);
      hpAnim.setValue(left); // 演员先站到起始位
    });
  }, []);

  // 打完收工回基因库（消灭后自动走）
  useEffect(() => {
    if (!won) return;
    const t = setTimeout(onBack, 2200);
    return () => clearTimeout(t); // 组件卸载时撤掉闹钟，防止对着空气放电
  }, [won]);

  // ---- 挥刀：交答案 → AI 批改 → 按战果记账+放动画 → 换新句再战 ----
  async function strike() {
    if (busy) return;
    if (!q) { newRound(); return; } // 没题时按钮就是「抽下一题」
    if (!answer.trim()) return;
    setBusy(true);
    try {
      const g = await gradeAnswer(q, answer);
      setResult(g);
      const trap = pickPart(g, '惯犯类型');

      if (trap === '无' || trap === '') {
        // ---- 砍中了！被答对的那张卡当场毕业出库（账记在 q 头上）----
        const report = await passMistake(q);
        const all = await getMistakes();
        const left = all.filter((m: any) => m.trapType === monster.trapType).length;
        setNestTotal((t) => t || left + 1); // 首刀时补记总数
        if (left === 0) {
          setHp(0);
          Animated.timing(hpAnim, { toValue: 0, duration: 600, useNativeDriver: false }).start();
          setBattleLog('🏆 全巢清空！' + monster.trapType + '类惯犯一锅端，撒花！');
          setWon(true);
        } else {
          setHp(left);
          Animated.timing(hpAnim, { toValue: left, duration: 700, useNativeDriver: false }).start();
          setBattleLog(`⚔️ 消灭一头！${monster.trapType}巢还剩 ${left} 头`);
        }
        setAnswer('');  // 清空旧答案
        newRound();     // 下一刀换新句子（趁看批改的工夫后台出题）
      } else {
        // ---- 答错：这头怪没死，但巢不惩罚进度（方案三：无满血复活）----
        setBattleLog('💥 答错——这头怪兽还在，换下一发弹药再战');
        setAnswer('');
        newRound();     // 换新句子再战
      }
    } catch (e) {
      setBattleLog('批改失败：检查网络后再挥一刀');
    }
    setBusy(false);
  }

  // ---- 认输：亮出这题的参考答案 ----
  // 参考答案就在弹药库的卡片上（fixedVersion=当年批改的改对版）
  // 战题 q 是「题目」文本，去弹药池+出身题里翻出它的档案
  function surrender() {
    const card = [monster, ...pool].find((x: any) => x && x.question === q);
    setGiveUp(true);
    setBattleLog('🏳️ 认输不丢人——看一遍答案，下一刀砍回来');
    setReveal(card ? card.fixedVersion : '档案里没找到这句的答案，抽下一题吧');
  }

  // 血条宽度：0-3 滴血 → 0%-100%（Animated 的翻译官 interpolate）
  const barWidth = hpAnim.interpolate({
    inputRange: [0, Math.max(nestTotal, 1)],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={s.page}>
      <TouchableOpacity onPress={onBack} style={s.backBtn}>
        <Text style={s.backText}>← 逃回基因库</Text>
      </TouchableOpacity>

      {/* 怪兽登场区 */}
      <View style={s.monsterStage}>
        <Text style={s.face}>{won ? '💨' : MONSTER_FACE[monster?.trapType] || '👾'}</Text>
        <Text style={s.monsterName}>{monster?.trapType}巢 · 剩 {hp} 头{nestTotal ? ` / 共 ${nestTotal} 头` : ''}</Text>
        {/* 血条外框（灰底）+ 内条（红色，宽度被 Animated 遥控） */}
        <View style={s.barShell}>
          <Animated.View style={[s.barFill, { width: barWidth }]} />
        </View>
        {battleLog ? <Text style={s.log}>{battleLog}</Text> : null}
      </View>

      {/* 题目区：当前的战斗题（每刀换新句）；出身题当怪物档案小字展示 */}
      <Text style={s.qLabel}>📜 本场战题 · {monster?.trapType}型 · 来自你的错题库</Text>
      <Text style={s.question}>{q}</Text>
      <Text style={s.origin}>出身题：{monster?.question}</Text>

      {/* 作答区 */}
      <TextInput
        style={s.input}
        placeholder="写下你的英文翻译，一刀砍下去…"
        value={answer}
        onChangeText={setAnswer}
        multiline
      />
      <TouchableOpacity style={s.btn} onPress={strike} disabled={busy}>
        <Text style={s.btnText}>{busy ? '批改中…' : (!q ? '🎲 抽下一题' : '⚔️ 挥刀')}</Text>
      </TouchableOpacity>

      {/* 认输按钮：还没认输、当前有题时才出现 */}
      {!giveUp && q ? (
        <TouchableOpacity style={s.giveUpBtn} onPress={surrender} disabled={busy}>
          <Text style={s.giveUpBtnText}>🏳️ 认输，看答案</Text>
        </TouchableOpacity>
      ) : null}

      {/* 认输后亮出的参考答案 */}
      {giveUp ? (
        <View style={s.revealBox}>
          <Text style={s.revealLabel}>📖 参考答案（看熟了，按挥刀用新句砍回来）</Text>
          <Text style={s.revealText}>{reveal}</Text>
        </View>
      ) : null}

      {/* 批改结果 */}
      {result ? <Text style={s.result}>{result}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#1A1A2E', padding: 20 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 8 },
  backText: { fontSize: 15, color: '#E85D3D' },
  monsterStage: { backgroundColor: '#16213E', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  face: { fontSize: 56, marginBottom: 8 },
  monsterName: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 10 },
  barShell: { width: '100%', height: 16, backgroundColor: '#0F3460', borderRadius: 8, overflow: 'hidden', flexDirection: 'row' },
  barFill: { height: 16, backgroundColor: '#E94560', borderRadius: 8 },
  log: { color: '#FFD56B', fontSize: 15, fontWeight: '600', marginTop: 12, textAlign: 'center' },
  question: { fontSize: 17, color: '#fff', backgroundColor: '#16213E', borderRadius: 12, padding: 16, marginBottom: 8, lineHeight: 26 },
  qLabel: { fontSize: 12, color: '#8899BB', marginBottom: 6 },
  origin: { fontSize: 12, color: '#667799', marginBottom: 16, lineHeight: 18 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 16, fontSize: 16, minHeight: 100, marginBottom: 16, textAlignVertical: 'top' },
  btn: { backgroundColor: '#E94560', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16 },
  giveUpBtn: { backgroundColor: '#2C3E60', borderRadius: 12, padding: 10, alignItems: 'center', marginBottom: 16 },
  giveUpBtnText: { color: '#8899BB', fontSize: 14, fontWeight: '600' },
  revealBox: { backgroundColor: '#16213E', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#2C3E60' },
  revealLabel: { fontSize: 12, color: '#FFD56B', marginBottom: 8 },
  revealText: { fontSize: 16, color: '#fff', lineHeight: 26 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  result: { fontSize: 15, color: '#fff', backgroundColor: '#16213E', borderRadius: 12, padding: 16, lineHeight: 24 },
});
