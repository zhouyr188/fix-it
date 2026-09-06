// ============================================================
// PracticeScreen —— Fix It 的「餐桌」：交作业页
// ============================================================
// 流程：出题埋雷 → 四查自检 → 你翻译 → AI 两档批改 → 错题归档
// （M2 第一天先跑通主干，四查弹窗和惯犯重生随后加）

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from 'react-native';
import { generateQuestion, gradeAnswer, explainMistake } from '../api/ai';
import { addMistake } from '../data/store';

function pickPart(text: string, name: string) {
  const parts = text.split('【');
  const block = parts.find((p) => p.startsWith(name + '】'));
  return block ? block.slice(name.length + 1).trim() : '';
}
// 难度徽章字典：档位名 → 徽章文案（🌱 小苗 → 🌿 树叶 → 🌳 大树）
const badgeText: { [k: string]: string } = {
  基础: '🌱 基础',
  中等: '🌿 中等',
  进阶: '🌳 进阶',
};

export default function PracticeScreen({ onBack }: { onBack: () => void }) {
  const [question, setQuestion] = useState('');   // 当前题目
  const [answer, setAnswer] = useState('');       // 你的翻译
  const [result, setResult] = useState('');      // 批改结果
  const [busy, setBusy] = useState(false);       // AI 干活中，别催
  const [explain,setExplain] = useState('');    //讲解内容
  const [checked, setChecked] = useState(false);   //已检查
  const [err, setErr] = useState('');   //错误显示器：网页版 Alert 不弹，错误亮在这
  const [level, setLevel] = useState('');        // 当前题难度档

  // ---- 第 1 步：出题（随机埋一种雷）----
  async function newQuestion() {
    setErr('');   // 先擦掉上一轮的旧红字，别拿陈年旧账吓自己
    const levels = ['基础', '基础', '中等', '中等', '中等', '中等', '中等', '进阶', '进阶', '进阶'];
    const lv = levels[Math.floor(Math.random() * levels.length)];
    setLevel(lv);
    setBusy(true); setResult(''); setAnswer('');setChecked(false);
    const traps = ['时态', '直译', '词形'];
    const trap = traps[Math.floor(Math.random() * traps.length)];
    try {
      const q = await generateQuestion(trap,lv);
      setQuestion(q);
    } catch (e) {
      setErr('出题失败：' + String(e));   // 网页版 Alert 不弹，把错误亮在屏幕上
    }
    setBusy(false);
  }

  // ---- 第 2 步：提交批改 ----
  async function submit() {
    if (!answer.trim()) {
      Alert.alert('先写点什么', '空着交不了作业哦');
      return;
    }
    setBusy(true);
    try {
      const g = await gradeAnswer(question, answer);
      setResult(g);

    const trap = pickPart(g, '惯犯类型');
   
      if (trap !== '无' && trap !== '') {
        await addMistake({
          question: question,
          userAnswer: answer,
          fixedVersion: pickPart(g, '改对版'),
          upgradedVersion: pickPart(g, '升级版'),
          trapType: trap,
        });
      }

    } catch (e) {
      Alert.alert('批改失败', '检查网络后再试一次');
    }
    setBusy(false);
  }

  // ---- 第 3 步：讲原理（AI 讲解员）----
  async function askExplain() {
    setBusy(true); setExplain('');
    try {
      const e = await explainMistake(answer);
      setExplain(e);
    } catch (err) {
      Alert.alert('讲解失败', '检查网络后再试一次');
    }
    setBusy(false);
  }

  // ---- 界面 ----
  return (
    <ScrollView style={s.page}>
      <TouchableOpacity onPress={onBack} style={s.backBtn}>
        <Text style={s.backText}>← 返回首页</Text>
      </TouchableOpacity>
      <Text style={s.title}>📝 交作业 · 翻译练习</Text>

      {/* 题目区 */}
      <TouchableOpacity style={s.btn} onPress={newQuestion} disabled={busy}>
        <Text style={s.btnText}>{busy ? 'AI 出题中…' : '出新题'}</Text>
      </TouchableOpacity>
      {question ? <Text style={s.levelBadge}>{badgeText[level]}</Text> : null}
      {question ? <Text style={s.question}>{question}</Text> : null}
      {/* 作答区 */}
      <TextInput
        style={s.input}
        placeholder="在这里写下你的英文翻译…"
        value={answer}
        onChangeText={(text) => { setAnswer(text); setChecked(false); }}
        multiline
      />

      
        
      {/* 检查完成按钮：答题框有字、且还没盖章时出现 */}
      {answer.trim() !== '' && !checked ? (
        <TouchableOpacity style={s.checkBtn} onPress={() => setChecked(true)}>
          <Text style={s.btnText}>检查完成 ✓</Text>
        </TouchableOpacity>
      ) : null}

      {/* 提交批改按钮：盖了章才出现 */}
      {checked ? (
        <TouchableOpacity style={s.btn} onPress={submit} disabled={busy}>
          <Text style={s.btnText}>{busy ? '批改中…' : '提交批改'}</Text>
        </TouchableOpacity>
      ) : null}

      


      {/* 批改结果区 */}
      {result ? <Text style={s.result}>{result}</Text> : null}

      {/* 讲解按钮：有批改结果才出现 */}
      {result ? (
        <TouchableOpacity style={s.explainBtn} onPress={askExplain} disabled={busy}>
          <Text style={s.explainBtnText}>{busy ? '讲解中…' : '💡 为什么？'}</Text>
        </TouchableOpacity>
      ) : null}
      {explain ? <Text style={s.explain}>{explain}</Text> : null}

      {/* 错误显示器：AI 调用失败时红字亮出（网页版 Alert 不弹的补丁） */}
      {err ? <Text style={s.errBox}>{err}</Text> : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  explainBtn: { backgroundColor: '#4A90D9', borderRadius: 12, padding: 12, alignItems: 'center', marginBottom: 16 },
  checkBtn: { backgroundColor: '#4A90D9', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16 },
  levelBadge: { alignSelf: 'flex-start', backgroundColor: '#E8F5E9', color: '#2E7D32', fontSize: 13, fontWeight: '600', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, marginBottom: 8 },
  errBox: { backgroundColor: '#FFEBEE', color: '#C62828', fontSize: 14, borderRadius: 12, padding: 16, lineHeight: 24 },
  explainBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  explain: { fontSize: 15, color: '#333', backgroundColor: '#FFF3E0', borderRadius: 12, padding: 16, lineHeight: 26 },
  page: { flex: 1, backgroundColor: '#FFF8F0', padding: 20 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 8 },
  backText: { fontSize: 15, color: '#E85D3D' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#E85D3D', marginBottom: 16 },
  btn: { backgroundColor: '#E85D3D', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  question: { fontSize: 17, color: '#333', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, lineHeight: 26 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 16, fontSize: 16, minHeight: 100, marginBottom: 16, textAlignVertical: 'top' },
  result: { fontSize: 15, color: '#333', backgroundColor: '#E8F5E9', borderRadius: 12, padding: 16, lineHeight: 24 },
});
