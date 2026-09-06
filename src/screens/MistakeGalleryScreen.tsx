// ============================================================
// MistakeGalleryScreen —— Fix It 的「基因库」：惯犯照片墙
// ============================================================
// 结构：三个展区（时态 / 直译 / 词形），每区 = 区头（类型+人数）+ 本区卡片
// 空房间由师傅搭好；照片冲印机（map）和展区归类（filter）由徒弟亲手装

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { getMistakes } from '../data/store';

export default function MistakeGalleryScreen({ onBack }: { onBack: () => void }) {
  const [mistakes, setMistakes] = useState<any[]>([]); // 从抽屉搬出来的全部错题

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

      {/* =================【你的位置】================= */}
      {/* 三个展区将从这里长出来：时态区 / 直译区 / 词形区 */}
      {/* 每个展区 = 区头（类型名+人数）+ 该类型的所有卡片 */}
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
});
