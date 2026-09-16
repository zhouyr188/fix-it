// ============================================================
// MistakeGalleryScreen —— Fix It 的「基因库」：惯犯照片墙
// ============================================================
// 结构：三个展区（时态 / 直译 / 词形），每区 = 区头（类型+人数）+ 本区卡片
// 空房间由师傅搭好；照片冲印机（map）和展区归类（filter）由徒弟亲手装

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { getMistakes } from '../data/store';

export default function MistakeGalleryScreen({ onBack, onBattle }: { onBack: () => void; onBattle: (m: any) => void }) {
  const [mistakes, setMistakes] = useState<any[]>([]); // 从抽屉搬出来的全部错题
  const [zone, setZone] = useState('大厅');

  // 进屋先开抽屉：把档案整个搬到墙上（数人数也靠它）
  useEffect(() => {
    getMistakes().then((m) => setMistakes(m));
  }, []);

  return (
    <ScrollView style={s.page}>
      <TouchableOpacity onPress={onBack} style={s.backBtn}>
        <Text style={s.backText}>← 回首页</Text>
      </TouchableOpacity>
      <Text style={s.title}>🧬 惯犯基因库</Text>
      <Text style={s.sub}>在押惯犯 {mistakes.length} 名 · 连对三次可毕业出库</Text>
{zone === '大厅' && (
  <View>
    <TouchableOpacity style={s.doorCard} onPress={() => setZone('时态')}>
      <Text style={s.doorTitle}>⏰ 时态馆</Text>
      <Text style={s.doorSub}>在押 {mistakes.filter((m) => m.trapType === '时态').length} 头</Text>
    </TouchableOpacity>
    <TouchableOpacity style={s.doorCard} onPress={() => setZone('直译')}>
  <Text style={s.doorTitle}>🔄 直译馆</Text>
      <Text style={s.doorSub}>在押 {mistakes.filter((m) => m.trapType === '直译').length} 头</Text>
    </TouchableOpacity>
    <TouchableOpacity style={s.doorCard} onPress={() => setZone('词形')}>
      <Text style={s.doorTitle}>🔤 词形馆</Text>
      <Text style={s.doorSub}>在押 {mistakes.filter((m) => m.trapType === '词形').length} 头</Text>
    </TouchableOpacity>

  </View>
)}


{zone === '时态' && (
  <>
  <TouchableOpacity onPress={() => setZone('大厅')}>
  <Text style={s.backText}>← 返回大厅</Text>
  </TouchableOpacity>
      <Text style={s.sub}>⏰时态区 (已错 {mistakes.filter((m) => m.trapType === '时态').length} 次)</Text>
      {/* ↓ 师傅的示例：冲印机 map——把筛出来的每条时态错题各印一张卡片 */}
      {mistakes.filter((m) => m.trapType === '时态').map((m) => (
        <View style={s.card} key={m.date + m.userAnswer}>
          <Text style={s.date}>📅 {m.date}</Text>
          <Text style={s.q}>题目：{m.question}</Text>
          <Text>你写的：{m.userAnswer}</Text>
          <Text style={s.fix}>✅ 改对版：{m.fixedVersion}</Text>
          <Text style={s.count}>在押</Text>
          <TouchableOpacity style={s.battleBtn} onPress={() => onBattle(m)}>
            <Text style={s.battleBtnText}>⚔️ 挑战这头怪兽</Text>
          </TouchableOpacity>
        </View>
      ))}
  </>
)}

{zone === '直译' && (
  <>
  <TouchableOpacity onPress={() => setZone('大厅')}>
  <Text style={s.backText}>← 返回大厅</Text>
  </TouchableOpacity>
      <Text style={s.sub}>🔄直译区 (已错 {mistakes.filter((m) => m.trapType === '直译').length} 次)</Text>
      {mistakes.filter((m) => m.trapType === '直译').map((m) => (
        <View style={s.card} key={m.date + m.userAnswer}>
          <Text style={s.date}>📅 {m.date}</Text>
          <Text style={s.q}>题目：{m.question}</Text>
          <Text>你写的：{m.userAnswer}</Text>
          <Text style={s.fix}>✅ 改对版：{m.fixedVersion}</Text>
          <Text style={s.count}>在押</Text>
          <TouchableOpacity style={s.battleBtn} onPress={() => onBattle(m)}>
            <Text style={s.battleBtnText}>⚔️ 挑战这头怪兽</Text>
          </TouchableOpacity>
        </View>
      ))}
</>
)}

{zone ==='词形' && (
  <>
  <TouchableOpacity onPress={() => setZone('大厅')}>
  <Text style={s.backText}>← 返回大厅</Text>
  </TouchableOpacity>
      <Text style={s.sub}>🔤词形区 (已错 {mistakes.filter((m) => m.trapType === '词形').length} 次)</Text>
      {mistakes.filter((m) => m.trapType ==='词形').map((m) => (
        <View style={s.card} key={m.date + m.userAnswer}>
          <Text style={s.date}>📅 {m.date}</Text>
          <Text style={s.q}>题目：{m.question}</Text>
          <Text>你写的：{m.userAnswer}</Text>
          <Text style={s.fix}>✅ 改对版：{m.fixedVersion}</Text>
          <Text style={s.count}>在押</Text>
          <TouchableOpacity style={s.battleBtn} onPress={() => onBattle(m)}>
            <Text style={s.battleBtnText}>⚔️ 挑战这头怪兽</Text>
          </TouchableOpacity>
        </View>
      ))}
      </>
)}
      {/* 弹药预告：mistakes.filter(筛类型).map(印卡片) —— 周三开工 */}
      {mistakes.length === 0 ? (
        <Text style={s.empty}>抽屉是空的——先去「交作业」攒几个惯犯吧</Text>
      ) : null}

    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFF8F0', padding: 20 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 8 },
  backText: { fontSize: 15, color: '#E85D3D' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#E85D3D', marginBottom: 4 },
  sub: { fontSize: 14, color: '#888888', marginBottom: 16 },
  empty: { fontSize: 15, color: '#999999', textAlign: 'center', marginTop: 60 },
  // ---- 惯犯卡片样式（徒弟挂照片用）----
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14, marginBottom: 10 },
  date: { fontSize: 12, color: '#BBBBBB', marginBottom: 6 },
  count: { fontSize: 12, color: '#E85D3D', marginTop: 6 },
  q: { fontSize: 14, color: '#555555', marginBottom: 4 },
  fix: { fontSize: 14, color: '#2E7D32', marginTop: 4 },
  battleBtn: { alignSelf: 'flex-start', backgroundColor: '#E85D3D', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, marginTop: 10 },
  battleBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  doorCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 18, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#E85D3D' },
doorTitle: { fontSize: 18, fontWeight: 'bold', color: '#E85D3D' },
doorSub: { fontSize: 13, color: '#888888', marginTop: 4 },

});
