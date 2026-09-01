// ============================================================
// PracticeScreen —— Fix It 的「餐桌」：交作业页
// ============================================================
// 流程：出题埋雷 → 四查自检 → 你翻译 → AI 两档批改 → 错题归档
// （M2 第一天先跑通主干，四查弹窗和惯犯重生随后加）

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from 'react-native';
import { generateQuestion, gradeAnswer } from '../api/ai';
import { addMistake } from '../data/store';

export default function PracticeScreen({ onBack }: { onBack: () => void }) {
  const [question, setQuestion] = useState('');   // 当前题目
  const [answer, setAnswer] = useState('');       // 你的翻译
  const [result, setResult] = useState('');      // 批改结果
  const [busy, setBusy] = useState(false);       // AI 干活中，别催

  // ---- 第 1 步：出题（随机埋一种雷）----
  async function newQuestion() {
    setBusy(true); setResult(''); setAnswer('');
    const traps = ['时态', '直译', '词形'];
    const trap = traps[Math.floor(Math.random() * traps.length)];
    try {
      const q = await generateQuestion(trap);
      setQuestion(q);
    } catch (e) {
      Alert.alert('出题失败', '检查网络后再试一次');
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

      // 【你的位置 ①】解析批改结果，发现惯犯就归档
      const parts = g.split('【');

      const trap = parts[3].slice(parts[3].indexOf('】')+1);

      if (trap !== '无'){
        await addMistake({
          question: question,
          userAnswer: answer,
          fixedVersion:parts[1].slice(parts[1].indexOf('】')+1),
          upgradedVersion:parts[2].slice(parts[2].indexOf('】')+1),
        trapType: trap,
        });
      }
      // 提示：g 里有【惯犯类型】xx，如果它不是「无」，
      // 就调用 addMistake({question, userAnswer: answer,
      //   fixedVersion: …, upgradedVersion: …, trapType: …})
      // 从 g 里把【改对版】【升级版】后面的内容切出来（用 split('【')）
      // —— 三四行代码，你来写！

    } catch (e) {
      Alert.alert('批改失败', '检查网络后再试一次');
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
      {question ? <Text style={s.question}>{question}</Text> : null}

      {/* 作答区 */}
      <TextInput
        style={s.input}
        placeholder="在这里写下你的英文翻译…"
        value={answer}
        onChangeText={setAnswer}
        multiline
      />

      {/* 【你的位置 ②】四查自检：提交前弹出清单
          提示：现在 submit 直接批改。你的任务是在这里加一个
          Alert.alert('交卷前四查', '①单复数一致 ②词性 ③中式直译 ④拼写格式\n都过了吗？',
            [取消, 确定→才真正调批改])  —— 你来写！ */}

      <TouchableOpacity style={s.btn} onPress={submit} disabled={busy}>
        <Text style={s.btnText}>{busy ? '批改中…' : '提交批改'}</Text>
      </TouchableOpacity>

      {/* 批改结果区 */}
      {result ? <Text style={s.result}>{result}</Text> : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
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
